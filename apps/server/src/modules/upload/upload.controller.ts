import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CosService } from './cos.service';
import { buildObjectKey, validateImage } from './upload.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessError } from '../../common/errors/business-error';

@Controller('admin/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UploadController {
  constructor(private readonly cos: CosService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      validateImage(file);
    } catch (e) {
      throw new BusinessError(4220, e instanceof Error ? e.message : '校验失败');
    }
    const key = buildObjectKey(file.originalname, file.mimetype);
    const result = await this.cos.upload(file.buffer, key, file.mimetype);
    return { url: result.url };
  }

  /** Scoped STS temp credentials for browser direct upload to COS (production pattern). */
  @Get('sts-credentials')
  stsCredentials() {
    return this.cos.getUploadCredentials();
  }
}
