export interface Tenant {
    id: string;
    name: string;
    tenantKey: string;
    slug: string;
    domain: string;
    secondary_domain: string;
    // subscription_expires_at: string
}
