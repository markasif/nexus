import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface SettingsData {
    company_name: string;
    tax_id: string;
    currency: string;
    low_stock_threshold: number;
    default_commission: number;
    audit_logging: boolean;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
};

export function useSettings() {
    const [settings, setSettings] = useState<SettingsData>({
        company_name: 'NEXUS',
        tax_id: '',
        currency: 'USD',
        low_stock_threshold: 5,
        default_commission: 8,
        audit_logging: true,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data } = await supabase
                    .from('crm_settings')
                    .select('*')
                    .limit(1)
                    .single();

                if (data) {
                    setSettings({
                        company_name: data.company_name || 'NEXUS',
                        tax_id: data.tax_id || '',
                        currency: data.currency || 'USD',
                        low_stock_threshold: data.low_stock_threshold ?? 5,
                        default_commission: data.default_commission ?? 8,
                        audit_logging: data.audit_logging ?? true,
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();

        // Realtime subscription
        const channel = supabase
            .channel('settings_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_settings',
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        const newData = payload.new as any;
                        setSettings((prev) => ({
                            ...prev,
                            ...newData
                        }));
                    }
                }
            )
            .subscribe();

        // Local event listener for immediate updates from Settings page
        const handleLocalUpdate = () => {
            fetchSettings();
        };

        window.addEventListener('settings-updated', handleLocalUpdate);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('settings-updated', handleLocalUpdate);
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency,
        }).format(amount);
    };

    return {
        settings,
        loading,
        formatCurrency,
        currencySymbol: CURRENCY_SYMBOLS[settings.currency] || '$'
    };
}
