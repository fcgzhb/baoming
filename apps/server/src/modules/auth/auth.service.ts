import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User } from '../../database/entities/user.entity';
import { ConsentRecord } from '../../database/entities/consent-record.entity';
import { JwtRole } from '../../common/interfaces/jwt-payload';
import { BusinessError } from '../../common/errors/business-error';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ConsentRecord) private readonly consents: Repository<ConsentRecord>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** US2: WeChat authorized login via wx.login code -> code2session -> upsert user -> JWT. */
  async loginByCode(code: string) {
    const session = await this.code2session(code);
    let user = await this.users.findOne({ where: { openid: session.openid } });
    if (!user) {
      user = this.users.create({ openid: session.openid, unionid: session.unionid ?? null });
      user = await this.users.save(user);
    }
    const token = this.signToken(user.id, 'user');
    return { token, user: this.toProfile(user) };
  }

  /** US2: store phone obtained via <button open-type="getPhoneNumber"> code. */
  async setPhone(userId: string, code: string) {
    const phone = await this.getPhoneNumber(code);
    await this.users.update(userId, { phone });
    return { phone };
  }

  /** US2 / FR-014: record sensitive-info consent. */
  async recordConsent(userId: string, consentType: string, policyVersion: string) {
    const rec = this.consents.create({
      userId,
      consentType,
      policyVersion,
      consentedAt: new Date(),
    });
    const saved = await this.consents.save(rec);
    return { id: saved.id, consentedAt: saved.consentedAt };
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw BusinessError.unauthorized();
    const hasConsent = await this.consents.exists({
      where: { userId, consentType: 'sensitive_info_collection' },
    });
    return { ...this.toProfile(user), hasConsent };
  }

  private signToken(sub: string, role: JwtRole): string {
    return this.jwt.sign({ sub, role });
  }

  private toProfile(u: User) {
    return {
      id: u.id,
      openid: u.openid,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      phone: u.phone,
    };
  }

  private async code2session(code: string): Promise<{ openid: string; unionid?: string }> {
    const appId = this.config.get<string>('WX_APP_ID');
    const secret = this.config.get<string>('WX_APP_SECRET');
    const url = `https://api.weixin.qq.com/sns/jsapi2session?appid=${appId}&secret=${secret}&js_code=${encodeURIComponent(
      code,
    )}&grant_type=authorization_code`;
    const { data } = await axios.get(url);
    if (!data.openid) {
      throw new BusinessError(4001, `微信登录失败: ${data.errmsg ?? 'unknown'}`);
    }
    return { openid: data.openid, unionid: data.unionid };
  }

  private async getPhoneNumber(code: string): Promise<string> {
    const accessToken = await this.fetchAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    const { data } = await axios.post(url, { code });
    if (!data?.phone_info?.phoneNumber) {
      throw new BusinessError(4001, `手机号获取失败: ${data?.errmsg ?? 'unknown'}`);
    }
    return data.phone_info.phoneNumber as string;
  }

  private async fetchAccessToken(): Promise<string> {
    const appId = this.config.get<string>('WX_APP_ID');
    const secret = this.config.get<string>('WX_APP_SECRET');
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
    const { data } = await axios.get(url);
    if (!data.access_token) {
      throw new BusinessError(5000, `access_token 获取失败: ${data.errmsg ?? 'unknown'}`);
    }
    return data.access_token as string;
  }
}
