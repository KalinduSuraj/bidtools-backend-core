import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsIn,
} from 'class-validator';
import { USER_ROLES } from '../../common/types';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsOptional()
    cognito_username?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(USER_ROLES)
    role: (typeof USER_ROLES)[number];

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
