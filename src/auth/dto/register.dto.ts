import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsIn,
    MinLength,
} from 'class-validator';

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
    @IsIn(['contractor', 'supplier', 'admin'])
    role: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
