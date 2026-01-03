
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Loader2,
    User,
    Mail,
    Lock,
    Shield,
    Briefcase
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// Create a *temporary* client just for creating users
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tywjsjlibpxzoizdblhn.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5d2pzamxpYnB4em9pemRibGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNDgzNDgsImV4cCI6MjA4MjgyNDM0OH0.Vg-F3YPdnlal5nLGbRJaOQ9m04oiG8_R2DXr53FUPUo';

const tempClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export function CreateEmployeeDialog({ onEmployeeCreated }: { onEmployeeCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: "Sales",  // Default
        jobTitle: "Representative" // Default
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create User in Supabase Auth
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: formData.role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No user returned");

            // 2. Insert into profiles (if not auto-created)
            // AND insert default employee_details

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: formData.email,
                    role: formData.role,
                    full_name: formData.name,
                });

            if (profileError) console.warn("Profile insert warning:", profileError);

            // 3. Insert Details
            const { error: detailsError } = await supabase
                .from('employee_details')
                .insert({
                    id: authData.user.id,
                    department: formData.department,
                    job_title: formData.jobTitle,
                    base_salary: 50000,
                    commission_rate: 5
                });

            if (detailsError) console.warn("Details insert warning:", detailsError);

            toast({
                title: "Employee Onboarded",
                description: `Successfully created account for ${formData.name}`,
            });

            setOpen(false);
            setFormData({ name: "", email: "", password: "", role: "employee", department: "Sales", jobTitle: "Representative" });
            onEmployeeCreated?.();

        } catch (error: any) {
            console.error("Error creating employee:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create employee",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="nexus" className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
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
                            <span className="tracking-tight">New Team Member</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium">
                            Onboard a new employee to the Nexus ecosystem.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-background">

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-nexus-primary" /> Full Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. James Smith"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-nexus-primary" /> Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="james@nexus.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-nexus-primary" /> System Role
                            </Label>
                            <div className="relative">
                                <select
                                    id="role"
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
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-nexus-primary" /> Temp Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 border-gray-200 hover:bg-gray-50 hover:text-nexus-dark font-medium transition-all">Cancel</Button>
                        <Button type="submit" disabled={loading} className="h-11 px-8 bg-nexus-dark hover:bg-nexus-primary text-white shadow-lg hover:shadow-nexus-primary/50 transition-all duration-300 font-semibold">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Create Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
