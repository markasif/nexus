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
import { Plus, Loader2, User, Building2, Mail, Phone, DollarSign, UserPlus, Globe, Package } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function CreateLeadDialog({ onLeadCreated }: { onLeadCreated: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "",
        value: "",
        status: "new",
        source: "website",
        product: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('leads')
                .insert({
                    name: formData.name,
                    company: formData.company,
                    email: formData.email,
                    phone: formData.phone,
                    value: Number(formData.value) || 0,
                    status: formData.status,
                    source: formData.source,
                    product: formData.product || 'Other',
                    assigned_to: user?.role === 'employee' ? user.id : null
                });

            if (error) throw error;

            toast({ title: "Lead Created", description: "New lead has been added to the pipeline." });
            setOpen(false);
            setFormData({ name: "", company: "", email: "", phone: "", value: "", status: "new", source: "website", product: "" });
            onLeadCreated();

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="nexus" className="shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    New Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] overflow-hidden p-0 gap-0 border-0 shadow-2xl">
                {/* Premium Header with Deep Ocean Gradient */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shadow-inner">
                                <UserPlus className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">New Lead</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium">
                            Create a new sales opportunity for the pipeline.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-background">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-nexus-primary" /> Contact Name
                            </Label>
                            <Input
                                id="name"
                                required
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-nexus-primary" /> Company
                            </Label>
                            <Input
                                id="company"
                                placeholder="e.g. Acme Corp"
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-nexus-primary" /> Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@acme.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-nexus-primary" /> Phone Number
                            </Label>
                            <Input
                                id="phone"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-nexus-primary" /> Deal Value ($)
                            </Label>
                            <Input
                                id="value"
                                type="number"
                                placeholder="0.00"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="source" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-nexus-primary" /> Lead Source
                            </Label>
                            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                                <SelectTrigger className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-medium">
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="cold-call">Cold Call</SelectItem>
                                    <SelectItem value="ad">Advertisement</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="product" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-nexus-primary" /> Interested Product
                        </Label>
                        <Select
                            value={formData.product}
                            onValueChange={(value) => setFormData({ ...formData, product: value })}
                        >
                            <SelectTrigger id="product" className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-medium">
                                <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CRM System">CRM System</SelectItem>
                                <SelectItem value="ERP Solution">ERP Solution</SelectItem>
                                <SelectItem value="Website Development">Website Development</SelectItem>
                                <SelectItem value="Mobile App">Mobile App</SelectItem>
                                <SelectItem value="SEO Service">SEO Service</SelectItem>
                                <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 border-gray-200 hover:bg-gray-50 hover:text-nexus-dark font-medium transition-all">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-11 px-8 bg-nexus-dark hover:bg-nexus-primary text-white shadow-lg hover:shadow-nexus-primary/50 transition-all duration-300 font-semibold">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Create Lead
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
