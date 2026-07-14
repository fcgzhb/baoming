import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus, ProjectStatus, RefundStatus } from '@baoming/shared';
import { Order } from '../../database/entities/order.entity';
import { Participant } from '../../database/entities/participant.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { BusinessError } from '../../common/errors/business-error';
import { WechatPayService } from '../payment/wechat-pay.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { AdminQueryOrderDto } from './dto/admin-query-order.dto';

const yuanToFen = (yuan: string | number): number => Math.round(Number(yuan) * 100);

const genOrderNo = (): string => {
  const ts = new Date()
    .toISOString()
    .replace(/[-:TZ]/g, '')
    .slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BM${ts}${rand}`;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Participant) private readonly participants: Repository<Participant>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    private readonly wechatPay: WechatPayService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- US3: create order (pending, no quota lock) ----------

  async create(userId: string, dto: CreateOrderDto) {
    const project = await this.projects.findOne({
      where: { id: dto.projectId, status: ProjectStatus.PUBLISHED },
    });
    if (!project) throw BusinessError.notFound('项目不存在或未上架');
    if (project.enrollDeadline && project.enrollDeadline.getTime() < Date.now()) {
      throw BusinessError.conflict('报名已截止');
    }
    if (project.registeredCount >= project.totalQuota) {
      throw BusinessError.conflict('名额已满');
    }

    // App-level uniqueness (FR-015): no active order for (project, idCard).
    const existing = await this.orders
      .createQueryBuilder('o')
      .where('o.project_id = :pid', { pid: dto.projectId })
      .andWhere('o.participant_id_card = :idc', { idc: dto.participant.idCard })
      .andWhere('o.status IN (:...st)', { st: [OrderStatus.PENDING, OrderStatus.CONFIRMED] })
      .getOne();
    if (existing) throw BusinessError.conflict('该参团人已报名');

    return this.dataSource.transaction(async (mgr) => {
      // participant first (orderId null — column is nullable to break the NOT-NULL cycle),
      // then order with participantId, then link participant.orderId.
      const participant = mgr.create(Participant, { ...dto.participant, orderId: null });
      const savedPart = await mgr.save(participant);

      const orderNo = genOrderNo();
      const order = mgr.create(Order, {
        orderNo,
        projectId: project.id,
        userId,
        participantId: savedPart.id,
        participantIdCard: dto.participant.idCard,
        amount: project.price, // price locked at order time
        status: OrderStatus.PENDING,
      });
      const savedOrder = await mgr.save(order);
      await mgr.update(Participant, savedPart.id, { orderId: savedOrder.id });
      return { orderId: savedOrder.id, orderNo: savedOrder.orderNo, amount: savedOrder.amount };
    });
  }

  // ---------- US3: prepare JSAPI payment ----------

  async preparePayment(userId: string, orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId, userId } });
    if (!order) throw BusinessError.notFound('订单不存在');
    if (order.status !== OrderStatus.PENDING) throw BusinessError.conflict('订单状态不可支付');

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.openid) throw BusinessError.conflict('用户信息缺失，无法支付');

    const project = await this.projects.findOne({ where: { id: order.projectId } });
    const payParams = await this.wechatPay.createJsapiPayment({
      description: project?.title ?? '游学报名',
      outTradeNo: order.orderNo,
      totalFen: yuanToFen(order.amount),
      openid: user.openid,
      notifyUrl: this.config.get<string>('WXPAY_NOTIFY_URL') ?? '',
    });
    return { payParams };
  }

  // ---------- US4: my orders ----------

  async findMyOrders(userId: string, q: QueryOrderDto) {
    const page = q.page ?? 1;
    const size = q.size ?? 10;
    const qb = this.orders
      .createQueryBuilder('o')
      .where('o.user_id = :uid', { uid: userId })
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);
    if (q.status) qb.andWhere('o.status = :st', { st: q.status });
    const [list, total] = await qb.getManyAndCount();
    const projectIds = [...new Set(list.map((o) => o.projectId))];
    const projects = projectIds.length
      ? await this.projects.find({ where: projectIds.map((id) => ({ id })) })
      : [];
    const pMap = new Map(projects.map((p) => [p.id, p]));
    return {
      list: list.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        projectId: o.projectId,
        projectTitle: pMap.get(o.projectId)?.title ?? null,
        projectCover: pMap.get(o.projectId)?.coverImageUrl ?? null,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
      })),
      total,
      page,
      size,
    };
  }

  async findOneMine(userId: string, orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId, userId } });
    if (!order) throw BusinessError.notFound('订单不存在');
    const [project, participant] = await Promise.all([
      this.projects.findOne({ where: { id: order.projectId } }),
      this.participants.findOne({ where: { id: order.participantId } }),
    ]);
    return { ...order, project, participant };
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId, userId } });
    if (!order) throw BusinessError.notFound('订单不存在');
    if (order.status !== OrderStatus.PENDING) throw BusinessError.conflict('仅待支付订单可取消');
    // pending does NOT hold a quota → no release needed.
    await this.orders.update(order.id, { status: OrderStatus.CANCELLED, cancelledAt: new Date() });
    return { id: order.id, status: OrderStatus.CANCELLED };
  }

  // ---------- WeChat pay notify (atomic quota deduction, oversold→refund) ----------

  async handlePayNotify(decrypted: {
    out_trade_no?: string;
    transaction_id?: string;
    trade_state?: string;
    amount?: { total?: number };
  }) {
    const orderNo = decrypted.out_trade_no;
    if (!orderNo) return;
    const order = await this.orders.findOne({ where: { orderNo } });
    if (!order) {
      this.logger.warn(`pay notify: unknown order ${orderNo}`);
      return;
    }
    // Idempotent: only act on pending.
    if (order.status !== OrderStatus.PENDING) return;

    if (decrypted.trade_state !== 'SUCCESS') return; // not paid yet, ignore

    const expectedFen = yuanToFen(order.amount);
    if (decrypted.amount?.total !== expectedFen) {
      this.logger.error(
        `pay notify: amount mismatch order=${orderNo} got=${decrypted.amount?.total} expected=${expectedFen}`,
      );
      return; // do not confirm; manual intervention
    }

    // Atomic quota deduction (research.md D9).
    const result = await this.dataSource.query(
      'UPDATE projects SET registered_count = registered_count + 1 WHERE id = ? AND registered_count < total_quota',
      [order.projectId],
    );
    const affected = result?.affectedRows ?? result?.changedRows ?? 0;

    if (affected === 1) {
      await this.orders.update(order.id, {
        status: OrderStatus.CONFIRMED,
        paidAt: new Date(),
        transactionId: decrypted.transaction_id ?? null,
      });
      await this.audit.insert({
        actorType: 'system',
        action: 'order.pay_confirmed',
        targetType: 'order',
        targetId: order.id,
        amount: order.amount,
      });
      this.logger.log(`order ${orderNo} confirmed`);
    } else {
      // Oversold: user paid but quota already full → cancel + full refund.
      this.logger.warn(`order ${orderNo} oversold — refunding`);
      await this.orders.update(order.id, {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        refundStatus: RefundStatus.PROCESSING,
        refundAmount: order.amount,
      });
      await this.audit.insert({
        actorType: 'system',
        action: 'order.oversold_refund',
        targetType: 'order',
        targetId: order.id,
        amount: order.amount,
      });
      // Fire-and-forget refund; refund-notify closes the loop.
      this.initiateRefund(order).catch((e) =>
        this.logger.error(`oversold refund failed for ${orderNo}: ${e?.message}`),
      );
    }
  }

  // ---------- Refund (full, v1) ----------

  async initiateRefund(order: Order) {
    const totalFen = yuanToFen(order.amount);
    const outRefundNo = `RF${order.orderNo}`;
    await this.orders.update(order.id, {
      refundTransactionId: outRefundNo,
      refundAmount: order.amount,
      refundStatus: RefundStatus.PROCESSING,
    });
    const res = await this.wechatPay.refund({
      outTradeNo: order.orderNo,
      outRefundNo,
      totalFen,
      refundFen: totalFen,
      notifyUrl: this.config.get<string>('WXPAY_REFUND_NOTIFY_URL') ?? '',
    });
    if (res.status !== 200) {
      this.logger.error(`refund request failed order=${order.orderNo} res=${JSON.stringify(res)}`);
      await this.orders.update(order.id, { refundStatus: RefundStatus.FAILED });
    }
  }

  async handleRefundNotify(decrypted: {
    out_trade_no?: string;
    out_refund_no?: string;
    refund_status?: string;
  }) {
    const orderNo = decrypted.out_trade_no;
    if (!orderNo) return;
    const order = await this.orders.findOne({ where: { orderNo } });
    if (!order) return;
    if (order.refundStatus === RefundStatus.SUCCESS) return; // idempotent

    if (decrypted.refund_status === 'SUCCESS') {
      // Release quota ONLY if the order was confirmed (held a spot).
      // Oversold orders are 'cancelled' and held no quota → no release.
      if (order.status === OrderStatus.CONFIRMED) {
        await this.dataSource.query(
          'UPDATE projects SET registered_count = registered_count - 1 WHERE id = ? AND registered_count > 0',
          [order.projectId],
        );
        await this.orders.update(order.id, {
          status: OrderStatus.REFUNDED,
          refundStatus: RefundStatus.SUCCESS,
          refundedAt: new Date(),
          refundTransactionId: decrypted.out_refund_no ?? order.refundTransactionId,
        });
      } else {
        await this.orders.update(order.id, {
          refundStatus: RefundStatus.SUCCESS,
          refundedAt: new Date(),
          refundTransactionId: decrypted.out_refund_no ?? order.refundTransactionId,
        });
      }
      await this.audit.insert({
        actorType: 'system',
        action: 'order.refund_confirmed',
        targetType: 'order',
        targetId: order.id,
        amount: order.refundAmount ?? order.amount,
      });
      this.logger.log(`order ${orderNo} refund confirmed`);
    } else {
      await this.orders.update(order.id, { refundStatus: RefundStatus.FAILED });
      this.logger.warn(`order ${orderNo} refund not success: ${decrypted.refund_status}`);
    }
  }

  // ---------- Reconcile stale pending orders (FR-013, 查单补单) ----------

  async reconcileStalePending(
    olderThanMinutes = 15,
  ): Promise<{ checked: number; updated: number }> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
    const stale = await this.orders.find({
      where: { status: OrderStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
    const targets = stale.filter((o) => o.createdAt < cutoff);
    let updated = 0;
    for (const order of targets) {
      try {
        const res = await this.wechatPay.queryOrder(order.orderNo);
        const state = res?.data?.trade_state;
        if (state === 'SUCCESS') {
          await this.handlePayNotify(res.data);
          updated++;
        } else if (['CLOSED', 'NOTPAY', 'PAYERROR', 'REVOKED', 'USERPAYING'].includes(state)) {
          await this.orders.update(order.id, {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
          });
          updated++;
        }
      } catch (e) {
        this.logger.warn(
          `reconcile query failed for ${order.orderNo}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    return { checked: targets.length, updated };
  }

  // ---------- US6: admin orders ----------

  async findAdminOrders(q: AdminQueryOrderDto) {
    const page = q.page ?? 1;
    const size = q.size ?? 20;
    const qb = this.orders
      .createQueryBuilder('o')
      .leftJoin(Participant, 'part', 'part.id = o.participant_id');
    if (q.projectId) qb.andWhere('o.project_id = :pid', { pid: q.projectId });
    if (q.status) qb.andWhere('o.status = :st', { st: q.status });
    if (q.orderNo) qb.andWhere('o.order_no LIKE :ono', { ono: `%${q.orderNo}%` });
    if (q.phone) qb.andWhere('part.phone LIKE :ph', { ph: `%${q.phone}%` });
    if (q.name) qb.andWhere('part.name LIKE :nm', { nm: `%${q.name}%` });
    qb.orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);
    const [rows, total] = await qb.getManyAndCount();

    const partIds = [...new Set(rows.map((o) => o.participantId))];
    const projIds = [...new Set(rows.map((o) => o.projectId))];
    const [parts, projs] = await Promise.all([
      partIds.length ? this.participants.find({ where: partIds.map((id) => ({ id })) }) : [],
      projIds.length ? this.projects.find({ where: projIds.map((id) => ({ id })) }) : [],
    ]);
    const partMap = new Map(parts.map((p) => [p.id, p]));
    const projMap = new Map(projs.map((p) => [p.id, p]));

    return {
      list: rows.map((o) => {
        const part = partMap.get(o.participantId);
        return {
          id: o.id,
          orderNo: o.orderNo,
          projectId: o.projectId,
          projectTitle: projMap.get(o.projectId)?.title ?? null,
          userId: o.userId,
          participantName: part?.name ?? null,
          participantPhone: part?.phone ?? null,
          participantIdCard: part?.idCard ?? null,
          amount: o.amount,
          status: o.status,
          refundStatus: o.refundStatus,
          paidAt: o.paidAt,
          refundedAt: o.refundedAt,
          createdAt: o.createdAt,
        };
      }),
      total,
      page,
      size,
    };
  }

  async findOneAdmin(id: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw BusinessError.notFound('订单不存在');
    const [project, participant, user] = await Promise.all([
      this.projects.findOne({ where: { id: order.projectId } }),
      this.participants.findOne({ where: { id: order.participantId } }),
      this.users.findOne({ where: { id: order.userId } }),
    ]);
    return {
      ...order,
      project,
      participant,
      user: user ? { id: user.id, nickname: user.nickname, phone: user.phone } : null,
    };
  }

  /** US6: admin initiates a full refund on a confirmed order. */
  async adminRefund(orderId: string, adminId: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw BusinessError.notFound('订单不存在');
    if (order.status !== OrderStatus.CONFIRMED) {
      throw BusinessError.conflict('仅已报名(已支付)订单可退款');
    }
    await this.audit.insert({
      actorType: 'admin',
      actorId: adminId,
      action: 'order.refund',
      targetType: 'order',
      targetId: order.id,
      amount: order.amount,
    });
    // Sets refundStatus=processing then calls WeChat; throws if not configured.
    await this.initiateRefund(order);
    return { id: order.id, status: order.status, refundStatus: RefundStatus.PROCESSING };
  }
}
