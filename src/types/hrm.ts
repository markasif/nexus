export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    details?: {
        base_salary: number;
        commission_rate: number;
        job_title: string;
        department: string;
    };
    attendance: string; // Formatting purpose for now
}
