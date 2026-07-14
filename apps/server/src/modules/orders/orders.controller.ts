import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/jwt-payload';

@Controller('mp/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Post(':id/pay')
  pay(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.preparePayment(user.id, id);
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: QueryOrderDto) {
    return this.orders.findMyOrders(user.id, q);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.findOneMine(user.id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.cancel(user.id, id);
  }
}
