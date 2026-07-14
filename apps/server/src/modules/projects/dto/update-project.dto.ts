import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Manual partial of CreateProjectDto.
 * `status` is intentionally EXCLUDED — status transitions must go through the
 * publish()/offline() endpoints to enforce the state machine (security: prevent
 * bypassing draft↔published↔offline guards via direct update).
 */
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  itinerary?: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuota?: number;

  @IsOptional()
  @IsDateString()
  enrollDeadline?: string;
}
