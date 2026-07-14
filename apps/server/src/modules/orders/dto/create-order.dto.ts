import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { IdCardType } from '@baoming/shared';

export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsEnum(IdCardType)
  idCardType: IdCardType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  idCard: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  relation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  emergencyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  schoolGrade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ValidateNested()
  @Type(() => ParticipantDto)
  participant: ParticipantDto;
}
