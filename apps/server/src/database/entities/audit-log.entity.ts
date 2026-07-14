import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
@Index('idx_audit_target', ['targetType', 'targetId'])
@Index('idx_audit_actor', ['actorType', 'actorId'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'actor_type', type: 'varchar', length: 16 })
  actorType: string;

  @Column({ name: 'actor_id', type: 'bigint', unsigned: true, nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ name: 'target_type', type: 'varchar', length: 32, nullable: true })
  targetType: string | null;

  @Column({ name: 'target_id', type: 'bigint', unsigned: true, nullable: true })
  targetId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: string | null;

  @Column({ type: 'json', nullable: true })
  meta: Record<string, unknown> | null;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
