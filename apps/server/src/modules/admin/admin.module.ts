import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../../database/entities/admin.entity';
import { User } from '../../database/entities/user.entity';
import { Order } from '../../database/entities/order.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User, Order])],
  providers: [AdminAuthService, AdminUsersService],
  controllers: [AdminAuthController, AdminUsersController],
  exports: [AdminAuthService],
})
export class AdminModule {}
