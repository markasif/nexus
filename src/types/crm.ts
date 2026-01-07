export interface Lead {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    value: number;
    status: string;
    assigned_to: string;
    last_contact: string;
    created_at?: string;
    updated_at?: string;
    product?: string;
    notes?: string;
    source?: string;
    profiles?: { full_name: string; email: string }; // Joined assignee data
}
