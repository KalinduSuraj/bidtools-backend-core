import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsIn,
} from 'class-validator';
import { USER_ROLES, VERIFICATION_STATUSES } from '../../common/types';

export class CreateProfileDto {
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(USER_ROLES)
    profile_type: (typeof USER_ROLES)[number];

    @IsString()
    @IsOptional()
    company_name?: string;

    @IsString()
    @IsOptional()
    business_license?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsNumber()
    @IsOptional()
    rating?: number;

    @IsString()
    @IsOptional()
    @IsIn(VERIFICATION_STATUSES)
    verification_status?: (typeof VERIFICATION_STATUSES)[number];

    // Contractor-specific
    @IsString()
    @IsOptional()
    project_locations?: string;

    // Supplier-specific
    @IsNumber()
    @IsOptional()
    inventory_count?: number;

    // Admin-specific
    @IsString()
    @IsOptional()
    permissions?: string;
}
