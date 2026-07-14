import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max } from 'class-validator';
import { OrderStatus } from '@baoming/shared';

export class QueryOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  size?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
