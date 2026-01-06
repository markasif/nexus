
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
    status: 'present' | 'absent' | 'leave' | 'late';
    employee_id: string;
};

export function useAttendance() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [todaySessions, setTodaySessions] = useState<AttendanceRecord[]>([]);
    const [activeSession, setActiveSession] = useState<AttendanceRecord | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (user) {
            checkAndFixPreviousSessions();
            fetchTodaySessions();
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const checkAndFixPreviousSessions = async () => {
        if (!user) return;
        try {
            // Find any open sessions from previous days
            const { data: openSessions, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', user.id)
                .is('clock_out', null)
                .lt('date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            if (openSessions && openSessions.length > 0) {
                // Auto-close them
                for (const session of openSessions) {
                    // Set clock-out to end of that day (e.g. 23:59:59) or just 9 hours after clock_in
                    // For simplicity, let's just close it now or 18:00 of that day
                    const sessionDate = new Date(session.date);
                    sessionDate.setHours(18, 0, 0, 0);

                    await supabase
                        .from('attendance')
                        .update({ clock_out: sessionDate.toISOString() })
                        .eq('id', session.id);
                }
                toast({
                    title: "System Update",
                    description: "Previous open sessions have been auto-closed.",
                });
            }
        } catch (error) {
            console.error("Error fixing sessions:", error);
        }
    };

    const fetchTodaySessions = async () => {
        if (!user) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', user.id)
                .eq('date', today)
                .order('clock_in', { ascending: true });

            if (error) throw error;

            if (data) {
                setTodaySessions(data);
                // Find active session (no clock_out)
                const active = data.find(s => !s.clock_out);
                setActiveSession(active || null);
            }
        } catch (error) {
            console.error("Error fetching today:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', user.id)
                .order('date', { ascending: false })
                .limit(30);

            if (error) throw error;
            if (data) setHistory(data);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const clockIn = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            if (activeSession) {
                toast({
                    title: "Already Clocked In",
                    description: "You have an active session.",
                    variant: "destructive"
                });
                return;
            }

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

            setTodaySessions(prev => [...prev, data]);
            setActiveSession(data);
            fetchHistory(); // Refresh history

            toast({
                title: "Clocked In",
                description: `Session started at ${now.toLocaleTimeString()}`,
                variant: "default"
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to clock in.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const clockOut = async () => {
        if (!user || !activeSession) return;
        setLoading(true);
        try {
            const now = new Date();

            const { data, error } = await supabase
                .from('attendance')
                .update({
                    clock_out: now.toISOString()
                })
                .eq('id', activeSession.id)
                .select()
                .single();

            if (error) throw error;

            setTodaySessions(prev => prev.map(s => s.id === activeSession.id ? data : s));
            setActiveSession(null);
            fetchHistory();

            toast({
                title: "Clocked Out",
                description: `Session ended at ${now.toLocaleTimeString()}`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to clock out.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate total duration for today
    const totalDurationHours = todaySessions.reduce((acc, session) => {
        if (!session.clock_in) return acc;
        const start = new Date(session.clock_in).getTime();
        const end = session.clock_out
            ? new Date(session.clock_out).getTime()
            : new Date().getTime(); // If active, calculate up to now

        return acc + (end - start) / (1000 * 60 * 60);
    }, 0);

    return {
        loading,
        isClockedIn: !!activeSession,
        hasClockedOut: todaySessions.length > 0 && !activeSession,
        clockInTime: activeSession ? new Date(activeSession.clock_in) : null,
        clockOutTime: null,
        clockIn,
        clockOut,
        totalDurationHours,
        history,
    };
}
