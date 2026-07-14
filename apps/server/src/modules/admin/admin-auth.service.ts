import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Admin } from '../../database/entities/admin.entity';
import { comparePassword } from '../../common/utils/password.util';
import { BusinessError } from '../../common/errors/business-error';

export interface AdminPublic {
  id: string;
  username: string;
  displayName: string | null;
  status: number;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ token: string; admin: AdminPublic }> {
    const admin = await this.admins.findOne({ where: { username } });
    if (!admin || admin.status !== 1) {
      throw BusinessError.unauthorized('账号或密码错误');
    }
    const ok = await comparePassword(password, admin.passwordHash);
    if (!ok) {
      throw BusinessError.unauthorized('账号或密码错误');
    }
    const token = this.jwt.sign({ sub: admin.id, role: 'admin' });
    return { token, admin: this.toPublic(admin) };
  }

  async getMe(id: string): Promise<AdminPublic> {
    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) {
      throw BusinessError.unauthorized();
    }
    return this.toPublic(admin);
  }

  private toPublic(a: Admin): AdminPublic {
    return { id: a.id, username: a.username, displayName: a.displayName, status: a.status };
  }
}
