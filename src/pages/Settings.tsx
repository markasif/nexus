import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Shield, Bell, Database, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
];

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    company_name: '',
    company_email: '',
    tax_id: '',
    currency: 'USD',
    low_stock_threshold: 5,
    default_commission: 8,
    audit_logging: true,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('crm_settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'No rows' error
          console.error('Error fetching settings:', error);
          toast.error('Failed to load settings');
        }

        if (data) {
          setSettings({
            id: data.id,
            company_name: data.company_name || '',
            company_email: data.company_email || '',
            tax_id: data.tax_id || '',
            currency: data.currency || 'USD',
            low_stock_threshold: data.low_stock_threshold ?? 5,
            default_commission: data.default_commission ?? 8,
            audit_logging: data.audit_logging ?? true,
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        company_name: settings.company_name,
        company_email: settings.company_email,
        tax_id: settings.tax_id,
        currency: settings.currency,
        low_stock_threshold: Number(settings.low_stock_threshold),
        default_commission: Number(settings.default_commission),
        audit_logging: settings.audit_logging,
        updated_at: new Date().toISOString(),
      };

      // If ID exists, update. If not, insert (upsert handles both if PK provided, but here we might not have ID yet)
      // Actually, since it's a singleton pattern, we can treat the table as having one row.
      // But upsert needs a constraint.

      let error;
      if (settings.id) {
        const { error: updateError, data } = await supabase
          .from('crm_settings')
          .update(payload)
          .eq('id', settings.id)
          .select(); // Return the updated row to verify

        if (!updateError && (!data || data.length === 0)) {
          throw new Error('No settings were updated. Please check your permissions.');
        }
        error = updateError;
      } else {
        const { error: insertError, data } = await supabase
          .from('crm_settings')
          .insert([payload])
          .select();

        if (!insertError && (!data || data.length === 0)) {
          throw new Error('Failed to create settings. Please check your permissions.');
        }
        error = insertError;
      }

      if (error) throw error;
      toast.success('Settings saved successfully');

      // Dispatch event to update other components immediately
      window.dispatchEvent(new Event('settings-updated'));

      // Refresh to get ID if it was a new insert
      const { data } = await supabase.from('crm_settings').select('id').limit(1).single();
      if (data) setSettings(prev => ({ ...prev, id: data.id }));

    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8">
        {/* Header */}
        <ScrollReveal width="100%">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage system configuration and preferences</p>
          </div>
        </ScrollReveal>

        <ScrollReveal width="100%">
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="bg-white border w-full max-w-[600px] grid grid-cols-4">
              <TabsTrigger value="company" className="h-9">
                <Building2 className="mr-2 h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="security" className="h-9">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="h-9">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="system" className="h-9">
                <Database className="mr-2 h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            value={settings.company_name}
                            onChange={(e) => handleChange('company_name', e.target.value)}
                            placeholder="Enter company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company-email">Company Email</Label>
                          <Input
                            id="company-email"
                            type="email"
                            value={settings.company_email}
                            onChange={(e) => handleChange('company_email', e.target.value)}
                            placeholder="contact@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tax-id">Tax ID</Label>
                          <Input
                            id="tax-id"
                            value={settings.tax_id}
                            onChange={(e) => handleChange('tax_id', e.target.value)}
                            placeholder="XX-XXXXXXX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={settings.currency}
                            onValueChange={(value) => handleChange('currency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out inactive users after 30 minutes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">IP Allowlist</p>
                      <p className="text-sm text-muted-foreground">
                        Restrict access to specific IP addresses
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Low Stock Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when inventory falls below threshold
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">New Deal Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts when deals are closed
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Leave Requests</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified of pending leave requests
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Advanced system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="low-stock">Low Stock Threshold</Label>
                      <Input
                        id="low-stock"
                        type="number"
                        value={settings.low_stock_threshold}
                        onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                      />
                    </div>

                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-muted-foreground">
                        Log all inventory movements and changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.audit_logging}
                      onCheckedChange={(checked) => handleChange('audit_logging', checked)}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollReveal>
      </div>
    </DashboardLayout >
  );
}
