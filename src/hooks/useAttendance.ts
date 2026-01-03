
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type AttendanceRecord = {
    id: string;
    clock_in: string;
    clock_out: string | null;
    date: string;
    total_hours: number | null;
};

export function useAttendance() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        if (user) {
            checkTodayStatus();
        }
    }, [user]);

    const checkTodayStatus = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', user?.id)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error("Error fetching attendance:", error);
            }

            if (data) {
                setTodayRecord(data);
            } else {
                setTodayRecord(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clockIn = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('attendance')
                .insert({
                    employee_id: user.id,
                    date: today,
                    clock_in: now.toISOString(),
                    status: 'present'
                })
                .select()
                .single();

            if (error) throw error;

            setTodayRecord(data);
            toast({
                title: "Clocked In",
                description: `Have a great day! Time: ${now.toLocaleTimeString()}`,
                variant: "success"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to clock in. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const clockOut = async () => {
        if (!user || !todayRecord) return;
        setLoading(true);
        try {
            const now = new Date();

            const { data, error } = await supabase
                .from('attendance')
                .update({
                    clock_out: now.toISOString()
                })
                .eq('id', todayRecord.id)
                .select()
                .single();

            if (error) throw error;

            setTodayRecord(data);
            toast({
                title: "Clocked Out",
                description: `Good work today! Time: ${now.toLocaleTimeString()}`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to clock out.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        isClockedIn: !!todayRecord && !todayRecord.clock_out,
        hasClockedOut: !!todayRecord?.clock_out,
        clockInTime: todayRecord?.clock_in ? new Date(todayRecord.clock_in) : null,
        clockOutTime: todayRecord?.clock_out ? new Date(todayRecord.clock_out) : null,
        clockIn,
        clockOut
    };
}
