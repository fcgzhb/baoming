import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminQueryUserDto } from './dto/admin-query-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() q: AdminQueryUserDto) {
    return this.users.findAll(q);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.users.findOne(id);
  }
}
