import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

export function CRMLeaderboard() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            const { data } = await supabase.rpc('get_crm_leaderboard');
            if (data) setLeaders(data);
            setLoading(false);
        };
        fetchLeaders();
    }, []);

    if (loading) return null;

    const topThree = leaders.slice(0, 3);
    const others = leaders.slice(3);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performers
                </CardTitle>
                <CardDescription>Sales champions this month</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Podium for Top 3 */}
                <div className="flex justify-center items-end gap-4 mb-8 pt-4">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <div className="flex flex-col items-center">
                            <Avatar className="h-12 w-12 border-2 border-gray-300">
                                <AvatarFallback className="bg-gray-100 text-gray-700 font-bold">{topThree[1].full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="h-16 w-16 bg-gray-100 rounded-t-lg mt-2 flex flex-col items-center justify-center border-t border-x border-gray-200">
                                <span className="font-bold text-gray-600">2</span>
                            </div>
                            <p className="text-xs font-semibold mt-1 text-center w-20 truncate">{topThree[1].full_name}</p>
                            <p className="text-[10px] text-muted-foreground">${topThree[1].total_revenue.toLocaleString()}</p>
                        </div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                        <div className="flex flex-col items-center z-10 -mx-2">
                            <div className="mb-1 text-yellow-500"><Trophy className="h-6 w-6 fill-yellow-500" /></div>
                            <Avatar className="h-16 w-16 border-4 border-yellow-400 shadow-xl">
                                <AvatarFallback className="bg-yellow-50 text-yellow-700 font-bold text-xl">{topThree[0].full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="h-24 w-20 bg-gradient-to-b from-yellow-50 to-white rounded-t-lg mt-2 flex flex-col items-center justify-center border border-yellow-200 shadow-sm">
                                <span className="font-bold text-2xl text-yellow-600">1</span>
                            </div>
                            <p className="text-sm font-bold mt-1 text-center w-24 truncate">{topThree[0].full_name}</p>
                            <p className="text-xs text-muted-foreground">${topThree[0].total_revenue.toLocaleString()}</p>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <div className="flex flex-col items-center">
                            <Avatar className="h-12 w-12 border-2 border-orange-300">
                                <AvatarFallback className="bg-orange-50 text-orange-700 font-bold">{topThree[2].full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="h-12 w-16 bg-orange-50 rounded-t-lg mt-2 flex flex-col items-center justify-center border-t border-x border-orange-200">
                                <span className="font-bold text-orange-700">3</span>
                            </div>
                            <p className="text-xs font-semibold mt-1 text-center w-20 truncate">{topThree[2].full_name}</p>
                            <p className="text-[10px] text-muted-foreground">${topThree[2].total_revenue.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* List for the rest */}
                <div className="space-y-4">
                    {others.map((agent, index) => (
                        <div key={agent.employee_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground font-mono w-4">{index + 4}</span>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">{agent.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{agent.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{agent.leads_count} Leads</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">${agent.total_revenue.toLocaleString()}</p>
                                <p className="text-xs text-emerald-600 flex items-center justify-end">
                                    {agent.won_count} Wins
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
