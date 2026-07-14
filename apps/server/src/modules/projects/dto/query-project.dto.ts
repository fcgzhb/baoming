import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max } from 'class-validator';
import { ProjectStatus } from '@baoming/shared';

export class QueryProjectDto {
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
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  q?: string;
}
