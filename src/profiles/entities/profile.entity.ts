export class Profile {
    profile_id: string;
    user_id: string;
    profile_type: 'contractor' | 'supplier' | 'admin';
    company_name?: string;
    business_license?: string;
    address?: string;
    rating?: number;
    verification_status?: string;
    created_at: string;
    updated_at?: string;

    // Contractor-specific
    project_locations?: string;

    // Supplier-specific
    inventory_count?: number;

    // Admin-specific
    permissions?: string;
}
