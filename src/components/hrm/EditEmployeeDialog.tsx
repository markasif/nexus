import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    User,
    Shield,
    Briefcase,
    Building,
    Check,
    DollarSign,
    TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface EditEmployeeDialogProps {
    employee: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmployeeUpdated: () => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onEmployeeUpdated }: EditEmployeeDialogProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        role: "employee",
        department: "",
        jobTitle: "",
        baseSalary: 0,
        commissionRate: 0
    });

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || "",
                role: employee.role || "employee",
                department: employee.details?.department || "",
                jobTitle: employee.details?.job_title || "",
                baseSalary: employee.details?.base_salary || 0,
                commissionRate: employee.details?.commission_rate || 0
            });
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Update Profile (Name, Role)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.name,
                    role: formData.role,
                })
                .eq('id', employee.id);

            if (profileError) throw profileError;

            // 2. Update Details (Department, Salary, Job Title)
            // Use upsert in case details row doesn't exist for legacy users
            const { error: detailsError } = await supabase
                .from('employee_details')
                .upsert({
                    id: employee.id,
                    department: formData.department,
                    job_title: formData.jobTitle,
                    base_salary: formData.baseSalary,
                    commission_rate: formData.commissionRate
                });

            if (detailsError) throw detailsError;

            toast({
                title: "Employee Updated",
                description: `Successfully updated details for ${formData.name}`,
            });

            onOpenChange(false);
            onEmployeeUpdated();

        } catch (error: any) {
            console.error("Error updating employee:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update employee",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] overflow-hidden p-0 gap-0 border-0 shadow-2xl">
                {/* Premium Header with Deep Ocean Gradient */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">Edit Profile</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium">
                            Update employee information and system role.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-background">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-nexus-primary" /> Full Name
                            </Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-nexus-primary" /> System Role
                            </Label>
                            <div className="relative">
                                <select
                                    id="edit-role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="flex h-11 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nexus-primary/10 focus-visible:border-nexus-primary/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-dept" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-nexus-primary" /> Department
                            </Label>
                            <Input
                                id="edit-dept"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5 text-nexus-primary" /> Job Title
                            </Label>
                            <Input
                                id="edit-title"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-salary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-nexus-primary" /> Base Salary ($)
                            </Label>
                            <Input
                                id="edit-salary"
                                type="number"
                                value={formData.baseSalary}
                                onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-commission" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-nexus-primary" /> Commission (%)
                            </Label>
                            <Input
                                id="edit-commission"
                                type="number"
                                value={formData.commissionRate}
                                onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 border-gray-200 hover:bg-gray-50 hover:text-nexus-dark font-medium transition-all">Cancel</Button>
                        <Button type="submit" disabled={loading} className="h-11 px-8 bg-nexus-dark hover:bg-nexus-primary text-white shadow-lg hover:shadow-nexus-primary/50 transition-all duration-300 font-semibold">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
