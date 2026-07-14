import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max } from 'class-validator';

export class AdminQueryUserDto {
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
  q?: string;
}
