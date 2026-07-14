import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('uk_users_openid', ['openid'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  openid: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  unionid: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nickname: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 512, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
