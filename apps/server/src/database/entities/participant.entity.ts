import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IdCardType } from '@baoming/shared';
import { Order } from './order.entity';

@Entity('participants')
@Index('uk_participants_order', ['orderId'], { unique: true })
export class Participant {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'order_id', type: 'bigint', unsigned: true })
  orderId: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'id_card_type', type: 'varchar', length: 16 })
  idCardType: IdCardType;

  @Column({ name: 'id_card', type: 'varchar', length: 64 })
  idCard: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  relation: string | null;

  @Column({ name: 'emergency_name', type: 'varchar', length: 64, nullable: true })
  emergencyName: string | null;

  @Column({ name: 'emergency_phone', type: 'varchar', length: 20, nullable: true })
  emergencyPhone: string | null;

  @Column({ name: 'school_grade', type: 'varchar', length: 128, nullable: true })
  schoolGrade: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
