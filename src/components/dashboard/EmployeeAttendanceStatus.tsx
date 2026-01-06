import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EmployeeStatus {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    status: 'online' | 'offline' | 'absent';
    clock_in?: string;
}

export function EmployeeAttendanceStatus() {
    const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Get all employees (exclude admin/super_admin if desired, but user said "employee attendance")
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, avatar_url')
                    .eq('role', 'employee'); // Only show employees, exclude admins

                if (profilesError) throw profilesError;

                // 2. Get today's attendance
                const today = new Date().toISOString().split('T')[0];
                const { data: attendance, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', today);

                if (attendanceError) throw attendanceError;

                // 3. Map status
                const statusList: EmployeeStatus[] = profiles.map(profile => {
                    const userRecords = attendance?.filter(a => a.employee_id === profile.id) || [];

                    let status: EmployeeStatus['status'] = 'absent';
                    let clock_in = undefined;

                    if (userRecords.length > 0) {
                        // Check for any active session
                        const activeSession = userRecords.find(r => !r.clock_out);

                        if (activeSession) {
                            status = 'online';
                            clock_in = activeSession.clock_in;
                        } else {
                            status = 'offline';
                            // Show clock in of the LAST session
                            const lastSession = userRecords.sort((a: any, b: any) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime())[0];
                            clock_in = lastSession.clock_in;
                        }
                    }

                    return {
                        id: profile.id,
                        full_name: profile.full_name || 'Unknown',
                        role: profile.role,
                        avatar_url: profile.avatar_url,
                        status,
                        clock_in
                    };
                });

                // Sort: Online first, then Offline, then Absent
                statusList.sort((a, b) => {
                    const score = (s: string) => s === 'online' ? 2 : s === 'offline' ? 1 : 0;
                    return score(b.status) - score(a.status);
                });

                setEmployees(statusList);
            } catch (err) {
                console.error("Error fetching attendance status:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        // Optional: Realtime subscription could go here
    }, []);

    return (
        <Card className="h-full animate-slide-up border-none shadow-lg bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-nexus-primary" />
                            Attendance Status
                        </CardTitle>
                        <CardDescription>Live employee presence tracking</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/50">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="h-[350px] pr-4">
                        <div className="space-y-4">
                            {employees.map((emp) => (
                                <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={emp.avatar_url || undefined} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600">
                                                {emp.full_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900">{emp.full_name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{emp.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <Badge
                                            variant={emp.status === 'online' ? 'success' : emp.status === 'offline' ? 'secondary' : 'destructive'}
                                            className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 ${emp.status === 'online' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                emp.status === 'offline' ? 'bg-slate-100 text-slate-700 hover:bg-slate-100' :
                                                    'bg-red-50 text-red-600 hover:bg-red-50 border-red-100'
                                                }`}
                                        >
                                            {emp.status === 'online' ? 'Present' : emp.status === 'offline' ? 'Checked Out' : 'Absent'}
                                        </Badge>
                                        {emp.clock_in && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(emp.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {employees.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No employees found.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
