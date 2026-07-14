import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// `export = COS` CommonJS module; esModuleInterop allows default import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const COS = require('cos-nodejs-sdk-v5');
import { BusinessError } from '../../common/errors/business-error';

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
}
