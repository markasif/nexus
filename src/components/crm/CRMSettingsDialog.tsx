import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Settings, Loader2, Save, Sliders } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export function CRMSettingsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Setting ID placeholder (assuming single row)
    const [settingsId, setSettingsId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        round_robin_enabled: false,
        monthly_revenue_target: 100000,
        commission_percentage: 10,
    });

    useEffect(() => {
        if (open) fetchSettings();
    }, [open]);

    const fetchSettings = async () => {
        const { data } = await supabase.from('crm_settings').select('*').limit(1).single();
        if (data) {
            setFormData({
                round_robin_enabled: data.round_robin_enabled,
                monthly_revenue_target: data.monthly_revenue_target,
                commission_percentage: data.commission_percentage || 10
            });
            setSettingsId(data.id);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                round_robin_enabled: formData.round_robin_enabled,
                monthly_revenue_target: formData.monthly_revenue_target,
                commission_percentage: formData.commission_percentage
            };

            let error;
            if (settingsId) {
                const { error: updateError } = await supabase
                    .from('crm_settings')
                    .update(payload)
                    .eq('id', settingsId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('crm_settings').insert(payload);
                error = insertError;
            }

            if (error) throw error;
            toast({ title: "Settings Saved", description: "CRM configuration updated." });
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-dashed border-nexus-primary/30 text-nexus-primary bg-nexus-primary/5 hover:bg-nexus-primary/10">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                {/* Premium Header */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <Sliders className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">CRM Settings</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 font-medium text-blue-100">
                            Configure automation rules and targets.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-background">
                    <div className="flex items-center justify-between space-x-4 rounded-xl border p-4 bg-secondary/20">
                        <Label htmlFor="rr-mode" className="flex flex-col space-y-1 cursor-pointer">
                            <span className="font-semibold text-base">Round Robin Routing</span>
                            <span className="font-normal text-xs text-muted-foreground">Automatically assign new incoming leads to agents sequentially.</span>
                        </Label>
                        <Switch
                            id="rr-mode"
                            checked={formData.round_robin_enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, round_robin_enabled: checked })}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="commission" className="font-semibold">Commission Rate (%)</Label>
                        <div className="relative">
                            <Input
                                id="commission"
                                type="number"
                                className="pr-7 font-mono"
                                value={formData.commission_percentage}
                                onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })}
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">This percentage is applied to the deal value when closed won.</p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="target" className="font-semibold">Monthly Revenue Target</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                            <Input
                                id="target"
                                type="number"
                                className="pl-7 font-mono"
                                value={formData.monthly_revenue_target}
                                onChange={(e) => setFormData({ ...formData, monthly_revenue_target: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">This target is used to calculate progress bars and forecast accuracy.</p>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 bg-background">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-nexus-primary to-nexus-dark text-white hover:opacity-90 shadow-md">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
