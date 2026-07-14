import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../database/entities/order.entity';
import { BusinessError } from '../../common/errors/business-error';
import { AdminQueryUserDto } from './dto/admin-query-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  async findAll(q: AdminQueryUserDto) {
    const page = q.page ?? 1;
    const size = q.size ?? 20;
    const qb = this.users.createQueryBuilder('u');
    if (q.q) {
      qb.andWhere('u.nickname LIKE :q OR u.phone LIKE :q', { q: `%${q.q}%` });
    }
    qb.orderBy('u.createdAt', 'DESC').skip((page - 1) * size).take(size);
    const [rows, total] = await qb.getManyAndCount();

    const userIds = rows.map((u) => u.id);
    let cMap = new Map<string, number>();
    if (userIds.length) {
      const counts = await this.orders
        .createQueryBuilder('o')
        .select('o.user_id', 'userId')
        .addSelect('COUNT(*)', 'cnt')
        .where('o.user_id IN (:...ids)', { ids: userIds })
        .groupBy('o.user_id')
        .getRawMany<{ userId: string; cnt: string }>();
      cMap = new Map(counts.map((c) => [c.userId, Number(c.cnt)]));
    }
    return {
      list: rows.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        createdAt: u.createdAt,
        orderCount: cMap.get(u.id) ?? 0,
      })),
      total,
      page,
      size,
    };
  }

  async findOne(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw BusinessError.notFound('用户不存在');
    const orders = await this.orders.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return { ...user, orders };
  }
}
