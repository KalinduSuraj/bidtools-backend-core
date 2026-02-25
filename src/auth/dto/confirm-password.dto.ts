import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class ConfirmPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;
}
