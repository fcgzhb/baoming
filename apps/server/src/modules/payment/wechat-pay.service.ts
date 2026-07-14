import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
// `export = Pay` CommonJS module; esModuleInterop allows default import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Pay = require('wechatpay-node-v3');
import { BusinessError } from '../../common/errors/business-error';

export interface JsapiPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string; // prepay_id=xxx
  signType: 'RSA';
  paySign: string;
}

/** Wraps wechatpay-node-v3 (V3). Lazily constructed from env/cert files. */
@Injectable()
export class WechatPayService {
  private client: InstanceType<typeof Pay> | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): InstanceType<typeof Pay> {
    if (this.client) return this.client;
    const appid = this.config.get<string>('WXPAY_APP_ID');
    const mchid = this.config.get<string>('WXPAY_MCH_ID');
    const serial_no = this.config.get<string>('WXPAY_CERT_SERIAL_NO');
    const key = this.config.get<string>('WXPAY_API_V3_KEY'); // APIv3
    const keyPath = this.config.get<string>('WXPAY_PRIVATE_KEY_PATH');
    const certPath = this.config.get<string>('WXPAY_CERT_PATH'); // merchant cert (apiclient_cert.pem)
    if (!appid || !mchid || !key || !keyPath || !certPath || !serial_no) {
      throw new BusinessError(5000, '微信支付未配置（WXPAY_* / 证书缺失）');
    }
    const privateKey = fs.readFileSync(path.resolve(process.cwd(), keyPath));
    const publicKey = fs.readFileSync(path.resolve(process.cwd(), certPath));
    this.client = new Pay({ appid, mchid, serial_no, publicKey, privateKey, key });
    return this.client;
  }

  /** JSAPI / 小程序下单 — returns ready-to-use payment params. */
  async createJsapiPayment(p: {
    description: string;
    outTradeNo: string;
    totalFen: number;
    openid: string;
    notifyUrl: string;
  }): Promise<JsapiPayParams> {
    const client = this.getClient();
    const result = await client.transactions_jsapi({
      description: p.description,
      out_trade_no: p.outTradeNo,
      notify_url: p.notifyUrl,
      amount: { total: p.totalFen },
      payer: { openid: p.openid },
    });
    if (result.status !== 200 || !result.data?.paySign) {
      throw new BusinessError(5000, `微信支付下单失败: ${JSON.stringify(result)}`);
    }
    return result.data as JsapiPayParams;
  }

  /** Query order status by merchant order no. */
  async queryOrder(outTradeNo: string) {
    return this.getClient().query({ out_trade_no: outTradeNo });
  }

  /** Initiate a refund (full, v1). totalFen/refundFen in 分. */
  async refund(p: {
    outTradeNo: string;
    outRefundNo: string;
    totalFen: number;
    refundFen: number;
    notifyUrl: string;
  }) {
    return this.getClient().refunds({
      out_trade_no: p.outTradeNo,
      out_refund_no: p.outRefundNo,
      amount: { refund: p.refundFen, total: p.totalFen, currency: 'CNY' },
      notify_url: p.notifyUrl,
    });
  }

  /** Decrypt a notify `resource` (AES-256-GCM, APIv3 key). */
  decryptNotify<T = Record<string, unknown>>(resource: {
    ciphertext: string;
    associated_data: string;
    nonce: string;
  }): T {
    const key = this.config.get<string>('WXPAY_API_V3_KEY');
    return this.getClient().decipher_gcm(
      resource.ciphertext,
      resource.associated_data,
      resource.nonce,
      key,
    ) as T;
  }

  /** Verify a notify signature. Requires platform cert (auto-fetched by SDK via APIv3 key). */
  async verifyNotifySignature(p: {
    timestamp: string;
    nonce: string;
    body: string;
    serial: string;
    signature: string;
  }): Promise<boolean> {
    const key = this.config.get<string>('WXPAY_API_V3_KEY');
    return this.getClient().verifySign({ ...p, apiSecret: key });
  }
}
