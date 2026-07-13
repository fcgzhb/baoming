import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConsentDto, LoginDto, PhoneDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/interfaces/jwt-payload';

@Controller('mp')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/login')
  @Public()
  login(@Body() dto: LoginDto) {
    return this.auth.loginByCode(dto.code);
  }

  @Post('auth/phone')
  @UseGuards(JwtAuthGuard)
  phone(@CurrentUser() user: RequestUser, @Body() dto: PhoneDto) {
    return this.auth.setPhone(user.id, dto.code);
  }

  @Post('consent')
  @UseGuards(JwtAuthGuard)
  consent(@CurrentUser() user: RequestUser, @Body() dto: ConsentDto) {
    return this.auth.recordConsent(user.id, dto.consentType, dto.policyVersion);
  }

  @Get('user/profile')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() user: RequestUser) {
    return this.auth.getProfile(user.id);
  }
}
