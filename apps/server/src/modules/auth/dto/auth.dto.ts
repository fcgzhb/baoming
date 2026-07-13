import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class PhoneDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ConsentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  consentType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  policyVersion: string;
}
