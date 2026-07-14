import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CosService } from './cos.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  providers: [CosService],
  controllers: [UploadController],
  exports: [CosService],
})
export class UploadModule {}
