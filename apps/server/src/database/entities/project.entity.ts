import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '@baoming/shared';

@Entity('projects')
@Index('idx_projects_status', ['status', 'enrollDeadline'])
export class Project {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  title: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 512, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  itinerary: string | null;

  @Column({ name: 'departure_date', type: 'date', nullable: true })
  departureDate: string | null;

  @Column({ name: 'return_date', type: 'date', nullable: true })
  returnDate: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({ name: 'total_quota', type: 'int', unsigned: true })
  totalQuota: number;

  @Column({ name: 'registered_count', type: 'int', unsigned: true, default: 0 })
  registeredCount: number;

  @Column({ name: 'enroll_deadline', type: 'datetime', nullable: true })
  enrollDeadline: Date | null;

  @Column({ type: 'varchar', length: 16, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ name: 'created_by_admin_id', type: 'bigint', unsigned: true, nullable: true })
  createdByAdminId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
