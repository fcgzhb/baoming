import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max } from 'class-validator';
import { OrderStatus } from '@baoming/shared';

export class AdminQueryOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  size?: number = 20;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
