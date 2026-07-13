import { User } from './user.entity';
import { Admin } from './admin.entity';
import { Project } from './project.entity';
import { Participant } from './participant.entity';
import { Order } from './order.entity';
import { ConsentRecord } from './consent-record.entity';
import { AuditLog } from './audit-log.entity';

export const entities = [User, Admin, Project, Participant, Order, ConsentRecord, AuditLog];

export { User, Admin, Project, Participant, Order, ConsentRecord, AuditLog };
