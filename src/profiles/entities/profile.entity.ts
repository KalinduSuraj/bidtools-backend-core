import { ProfileType, VerificationStatus } from '../../common/types';

export class Profile {
    profile_id: string;
    user_id: string;
    profile_type: ProfileType;
    company_name?: string;
    business_license?: string;
    address?: string;
    rating?: number;
    verification_status?: VerificationStatus;
    created_at: string;
    updated_at?: string;

    // Contractor-specific
    project_locations?: string;

    // Supplier-specific
    inventory_count?: number;

    // Admin-specific
    permissions?: string;
}
