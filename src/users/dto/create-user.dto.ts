import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsIn,
} from 'class-validator';

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
    @IsIn(['contractor', 'supplier', 'admin'])
    role: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
