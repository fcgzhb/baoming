import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectStatus } from '@baoming/shared';

/** Manual partial of CreateProjectDto (avoids @nestjs/mapped-types dependency). */
export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(128) title?: string;
  @IsOptional() @IsString() @MaxLength(512) coverImageUrl?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() itinerary?: string;
  @IsOptional() @IsDateString() departureDate?: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(1) totalQuota?: number;
  @IsOptional() @IsDateString() enrollDeadline?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
}
