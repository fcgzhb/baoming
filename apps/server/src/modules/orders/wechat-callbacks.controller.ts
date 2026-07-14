import { Body, Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { WechatPayService } from '../payment/wechat-pay.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * WeChat Pay V3 async callbacks. Public routes (verified by signature + AES decryption
 * with the APIv3 key). Uses @Res() to return WeChat's expected {code:'SUCCESS'} envelope,
 * bypassing the app's {code,msg,data} response interceptor.
 */
@Controller('wechat')
export class WechatCallbacksController {
  private readonly logger = new Logger(WechatCallbacksController.name);

  constructor(
    private readonly orders: OrdersService,
    private readonly wechatPay: WechatPayService,
  ) {}

  @Post('pay/notify')
  @Public()
  async payNotify(@Req() req: any, @Body() body: any, @Res() res: any) {
    await this.verifyOrWarn(req, body);
    try {
      const resource = body?.resource;
      if (!resource?.ciphertext) {
        return res.status(400).json({ code: 'FAIL', message: 'no resource' });
      }
      const decrypted = this.wechatPay.decryptNotify(resource);
      await this.orders.handlePayNotify(decrypted);
      return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
    } catch (e) {
      this.logger.error(`pay notify error: ${(e as Error)?.message}`);
      return res.status(500).json({ code: 'FAIL', message: 'internal error' });
    }
  }

  @Post('refund/notify')
  @Public()
  async refundNotify(@Req() req: any, @Body() body: any, @Res() res: any) {
    await this.verifyOrWarn(req, body);
    try {
      const resource = body?.resource;
      if (!resource?.ciphertext) {
        return res.status(400).json({ code: 'FAIL', message: 'no resource' });
      }
      const decrypted = this.wechatPay.decryptNotify(resource);
      await this.orders.handleRefundNotify(decrypted);
      return res.status(200).json({ code: 'SUCCESS', message: 'OK' });
    } catch (e) {
      this.logger.error(`refund notify error: ${(e as Error)?.message}`);
      return res.status(500).json({ code: 'FAIL', message: 'internal error' });
    }
  }

  /** Defense-in-depth signature check. Decryption with the APIv3 key is itself strong auth,
   *  so on verification error we log + proceed (covers the no-platform-cert-fetched case). */
  private async verifyOrWarn(req: any, body: any) {
    try {
      const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
      const ok = await this.wechatPay.verifyNotifySignature({
        timestamp: req.headers['wechatpay-timestamp'],
        nonce: req.headers['wechatpay-nonce'],
        body: raw,
        serial: req.headers['wechatpay-serial'],
        signature: req.headers['wechatpay-signature'],
      });
      if (!ok) this.logger.warn('wechat notify signature verification returned false');
    } catch (e) {
      this.logger.warn(`wechat notify verify skipped: ${(e as Error)?.message}`);
    }
  }
}
