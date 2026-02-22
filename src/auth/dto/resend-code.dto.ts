import { IsNotEmpty, IsEmail } from 'class-validator';

export class ResendCodeDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
