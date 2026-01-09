
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
    const [stats, setStats] = useState({ percentage: 0, totalPresent: 0, totalWorkingDays: 0, onTimePercentage: 100 });
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [leaveBalances, setLeaveBalances] = useState({ casual: 12, sick: 10, privilege: 15 });

    useEffect(() => {
        if (user) {
            checkAndFixPreviousSessions();
            fetchTodaySessions();
            fetchHistory();
            fetchStats();
            fetchLeaveBalances();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchLeaveBalances = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('leave_balance_casual, leave_balance_sick, leave_balance_privilege')
                .eq('id', user.id)
                .single();

            if (error) {
                // If column doesn't exist yet, we stick to defaults
                console.warn("Could not fetch leave balances (cols might be missing)", error);
            }

            if (data) {
                setLeaveBalances({
                    casual: data.leave_balance_casual || 12,
                    sick: data.leave_balance_sick || 10,
                    privilege: data.leave_balance_privilege || 15
                });
            }
        } catch (error) {
            console.error("Error fetching leave balances:", error);
        }
    };

    const fetchStats = async () => {
        if (!user) return;
        try {
            // 1. Get ALL attendance records for this user
            const { data: allRecords, error } = await supabase
                .from('attendance')
                .select('date, clock_in, clock_out')
                .eq('employee_id', user.id);

            if (error) throw error;
            if (!allRecords) return;

            // 2. Group by Date to sum duration
            const dailyMap = new Map<string, number>(); // date -> total hours
            const dailyMapObj: Record<string, number> = {};

            allRecords.forEach(r => {
                if (!r.clock_in) return;
                const time = new Date(r.clock_in);
                const start = time.getTime();
                const end = r.clock_out ? new Date(r.clock_out).getTime() : new Date().getTime();
                const durationHours = (end - start) / (1000 * 60 * 60);

                const current = dailyMap.get(r.date) || 0;
                dailyMap.set(r.date, current + durationHours);
                dailyMapObj[r.date] = current + durationHours;
            });

            // 3. Calculate Weekly Stats (Flexible Model)
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);

            let weeklyTotalHours = 0;
            let weeklyWorkingDaysPassed = 0;
            const dailyStatsArray: any[] = [];

            // Iterate 30 days back for table history
            const historyStart = new Date();
            historyStart.setDate(today.getDate() - 30);

            // Generate stat objects
            dailyMap.forEach((hours, dateStr) => {
                const date = new Date(dateStr);

                // Weekly Sum (only for current week)
                if (date >= startOfWeek && date <= today) {
                    weeklyTotalHours += hours;
                    if (date.getDay() !== 0 && date.getDay() !== 6) {
                        weeklyWorkingDaysPassed++;
                    }
                }

                // Determine "Flexible" Status
                let status: 'Regular' | 'Overtime' | 'Short' = 'Short';
                if (hours >= 8.5) status = 'Overtime';
                else if (hours >= 4) status = 'Regular';

                dailyStatsArray.push({
                    date: dateStr,
                    totalHours: hours,
                    status
                });
            });

            // 4. Time Bank Calculation
            // Target: 8 hours per working day passed this week
            const expectedHours = Math.max(0, weeklyWorkingDaysPassed * 8);
            const timeBank = weeklyTotalHours - expectedHours; // +ve = OT, -ve = Debt

            // 5. Update State
            // Re-using "percentage" to show Weekly Goal Progress (capped at 100%)
            const weeklyGoal = 40;
            const progressPercent = Math.min(100, Math.round((weeklyTotalHours / weeklyGoal) * 100));

            setStats({
                percentage: progressPercent, // Now represents Weekly Goal
                totalPresent: weeklyTotalHours, // Actually Total Weekly Hours
                totalWorkingDays: expectedHours, // Actually Expected Hours
                onTimePercentage: timeBank // Actually Time Bank balance
            });

            setDailyStats(dailyStatsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

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
                .order('clock_in', { ascending: false })
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
        stats,
        dailyStats,
        leaveBalances
    };
}
