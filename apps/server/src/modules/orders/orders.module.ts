import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Participant } from '../../database/entities/participant.entity';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { PaymentModule } from '../payment/payment.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WechatCallbacksController } from './wechat-callbacks.controller';

@Module({
  imports: [
    PaymentModule,
    TypeOrmModule.forFeature([Order, Participant, Project, User, AuditLog]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController, WechatCallbacksController],
})
export class OrdersModule {}
