import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus, RefundStatus } from '@baoming/shared';

/**
 * NOTE on `active_key` (FR-015, research.md D10):
 * MySQL has no partial unique index, so we use a STORED generated column that is
 * `project_id:participant_id_card` for active orders (pending/confirmed) and NULL otherwise,
 * with a UNIQUE index on it (MySQL ignores NULLs in unique indexes). This lets a participant
 * re-enroll after their previous order was cancelled/refunded.
 */
@Entity('orders')
@Index('uk_orders_order_no', ['orderNo'], { unique: true })
@Index('uk_orders_participant', ['participantId'], { unique: true })
@Index('uk_orders_active_key', ['activeKey'], { unique: true })
@Index('idx_orders_user', ['userId', 'status'])
@Index('idx_orders_project', ['projectId', 'status'])
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_no', type: 'varchar', length: 32 })
  orderNo: string;

  @Column({ name: 'project_id', type: 'bigint', unsigned: true })
  projectId: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'participant_id', type: 'bigint', unsigned: true })
  participantId: string;

  @Column({ name: 'participant_id_card', type: 'varchar', length: 64 })
  participantIdCard: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 16, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'paid_at', type: 'datetime', precision: 3, nullable: true })
  paidAt: Date | null;

  @Column({ name: 'transaction_id', type: 'varchar', length: 64, nullable: true })
  transactionId: string | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: string | null;

  @Column({ name: 'refund_transaction_id', type: 'varchar', length: 64, nullable: true })
  refundTransactionId: string | null;

  @Column({ name: 'refund_status', type: 'varchar', length: 16, nullable: true })
  refundStatus: RefundStatus | null;

  @Column({ name: 'refunded_at', type: 'datetime', precision: 3, nullable: true })
  refundedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', precision: 3, nullable: true })
  cancelledAt: Date | null;

  @Column({
    name: 'active_key',
    type: 'varchar',
    length: 140,
    nullable: true,
    generatedType: 'STORED',
    asExpression:
      "CASE WHEN `status` IN ('pending','confirmed') THEN CONCAT(`project_id`, ':', `participant_id_card`) ELSE NULL END",
  })
  activeKey: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date;
}
