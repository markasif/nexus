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
import { Settings, Loader2, Save } from "lucide-react";
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
    });

    useEffect(() => {
        if (open) fetchSettings();
    }, [open]);

    const fetchSettings = async () => {
        const { data } = await supabase.from('crm_settings').select('*').limit(1).single();
        if (data) {
            setFormData({
                round_robin_enabled: data.round_robin_enabled,
                monthly_revenue_target: data.monthly_revenue_target
            });
            setSettingsId(data.id);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                round_robin_enabled: formData.round_robin_enabled,
                monthly_revenue_target: formData.monthly_revenue_target
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
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>CRM Settings</DialogTitle>
                    <DialogDescription>
                        Configure automation and targets.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="rr-mode" className="flex flex-col space-y-1">
                            <span>Round Robin Routing</span>
                            <span className="font-normal text-xs text-muted-foreground">Auto-assign new leads to agents sequentially.</span>
                        </Label>
                        <Switch
                            id="rr-mode"
                            checked={formData.round_robin_enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, round_robin_enabled: checked })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="target">Monthly Revenue Target</Label>
                        <Input
                            id="target"
                            type="number"
                            value={formData.monthly_revenue_target}
                            onChange={(e) => setFormData({ ...formData, monthly_revenue_target: Number(e.target.value) })}
                        />
                        <p className="text-[10px] text-muted-foreground">Used for progress bars and forecasting.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading} className="bg-nexus-primary">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
