import {
    IsString,
    IsOptional,
    IsNumber,
    IsIn,
} from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @IsIn(['contractor', 'supplier', 'admin'])
    profile_type?: string;

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
    verification_status?: string;

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
