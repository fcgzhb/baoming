import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128) // bound bcrypt input size to prevent resource exhaustion
  password: string;
}
