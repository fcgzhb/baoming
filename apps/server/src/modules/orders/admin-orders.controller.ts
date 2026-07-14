import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AdminQueryOrderDto } from './dto/admin-query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/jwt-payload';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() q: AdminQueryOrderDto) {
    return this.orders.findAdminOrders(q);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.orders.findOneAdmin(id);
  }

  @Post(':id/refund')
  refund(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.adminRefund(id, user.id);
  }
}
