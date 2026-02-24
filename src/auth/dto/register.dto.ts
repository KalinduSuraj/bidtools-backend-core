import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsIn,
  MinLength,
} from 'class-validator';
import { USER_ROLES } from '../../common/types';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(USER_ROLES)
  role: (typeof USER_ROLES)[number];

  @IsString()
  @IsOptional()
  phone?: string;
}
