import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    @IsIn(['active', 'inactive', 'suspended', 'pending_verification'])
    status?: string;
}
