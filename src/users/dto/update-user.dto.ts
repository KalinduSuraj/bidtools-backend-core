import { IsString, IsOptional, IsIn } from 'class-validator';
import { USER_STATUSES } from '../../common/types';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    @IsIn(USER_STATUSES)
    status?: (typeof USER_STATUSES)[number];
}
