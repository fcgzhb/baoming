import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// `export = COS` CommonJS module; esModuleInterop allows default import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const COS = require('cos-nodejs-sdk-v5');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const STS = require('qcloud-cos-sts');
import { BusinessError } from '../../common/errors/business-error';

export interface StsCredentials {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
  bucket: string;
  region: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

/** Tencent COS image upload (admin-authored project covers / rich-text images).
 *  Backend proxy upload: the SecretKey never leaves the server. The browser only
 *  receives the resulting public URL. For production, prefer STS temp credentials +
 *  frontend direct upload to scope exposure.
 */
@Injectable()
export class CosService {
  private readonly logger = new Logger(CosService.name);
  private client: InstanceType<typeof COS> | null = null;

  constructor(private readonly config: ConfigService) {}

  private getBucket(): string {
    const b = this.config.get<string>('COS_BUCKET');
    if (!b) throw new BusinessError(5000, 'COS 未配置 COS_BUCKET');
    return b;
  }
  private getRegion(): string {
    const r = this.config.get<string>('COS_REGION');
    if (!r) throw new BusinessError(5000, 'COS 未配置 COS_REGION');
    return r;
  }

  private getClient(): InstanceType<typeof COS> {
    if (this.client) return this.client;
    const SecretId = this.config.get<string>('COS_SECRET_ID');
    const SecretKey = this.config.get<string>('COS_SECRET_KEY');
    if (!SecretId || !SecretKey) {
      throw new BusinessError(5000, 'COS 未配置 COS_SECRET_ID/SECRET_KEY');
    }
    this.client = new COS({ SecretId, SecretKey });
    return this.client;
  }

  /** Public read URL for a stored object. */
  buildPublicUrl(key: string): string {
    return `https://${this.getBucket()}.cos.${this.getRegion()}.myqcloud.com/${key}`;
  }

  /** Upload a Buffer to COS under the given key. Returns the public URL + key. */
  async upload(body: Buffer, key: string, contentType: string): Promise<UploadResult> {
    const client = this.getClient();
    try {
      await client.putObject({
        Bucket: this.getBucket(),
        Region: this.getRegion(),
        Key: key,
        Body: body,
        ContentType: contentType,
      });
      return { url: this.buildPublicUrl(key), key };
    } catch (e) {
      this.logger.error(`COS putObject failed: ${e instanceof Error ? e.message : String(e)}`);
      throw new BusinessError(5000, '图片上传失败');
    }
  }

  /**
   * Issue scoped STS temporary credentials so the browser can upload directly to COS
   * (production pattern: the main SecretKey never reaches the client). Scoped to
   * PutObject/PostObject on uploads/projects/* with a 30-minute TTL.
   *
   * NOTE: requires COS bucket CORS configured to allow PUT/POST from the admin origin.
   */
  async getUploadCredentials(): Promise<StsCredentials> {
    const SecretId = this.config.get<string>('COS_SECRET_ID');
    const SecretKey = this.config.get<string>('COS_SECRET_KEY');
    const bucket = this.getBucket();
    const region = this.getRegion();
    if (!SecretId || !SecretKey) {
      throw new BusinessError(5000, 'COS 未配置 COS_SECRET_ID/SECRET_KEY');
    }
    const appId = bucket.split('-').pop();
    const policy = {
      version: '2.0',
      statement: [
        {
          action: ['name/cos:PostObject', 'name/cos:PutObject'],
          effect: 'allow',
          principal: { qcs: ['*'] },
          resource: [`qcs::cos:${region}:uid/${appId}:${bucket}/uploads/projects/*`],
        },
      ],
    };
    try {
      const data = await STS.getCredential({
        secretId: SecretId,
        secretKey: SecretKey,
        region,
        policy,
        durationSeconds: 1800,
      });
      return {
        tmpSecretId: data.credentials.tmpSecretId,
        tmpSecretKey: data.credentials.tmpSecretKey,
        sessionToken: data.credentials.sessionToken,
        startTime: data.startTime,
        expiredTime: data.expiredTime,
        bucket,
        region,
      };
    } catch (e) {
      this.logger.error(`STS getCredential failed: ${e instanceof Error ? e.message : String(e)}`);
      throw new BusinessError(5000, '获取上传凭证失败');
    }
  }
}
