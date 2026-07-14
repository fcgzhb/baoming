import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
