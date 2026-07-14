import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('consent_records')
@Index('idx_consent_user', ['userId', 'consentType'])
export class ConsentRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'consent_type', type: 'varchar', length: 32 })
  consentType: string;

  @Column({ name: 'policy_version', type: 'varchar', length: 16 })
  policyVersion: string;

  @Column({ name: 'consented_at', type: 'datetime' })
  consentedAt: Date;
}
