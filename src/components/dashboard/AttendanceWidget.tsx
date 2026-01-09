import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';

export function AttendanceWidget() {
  const {
    isClockedIn,
    hasClockedOut,
    clockInTime,
    clockOutTime,
    clockIn,
    clockOut,
    loading,
    totalDurationHours,
    stats
  } = useAttendance();

  // Skeleton Loading State
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Attendance</CardTitle>
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex flex-col items-center gap-2">
            {/* Clock Skeleton */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 animate-pulse">
              <div className="h-6 w-6 rounded-full bg-gray-200" />
            </div>

            {/* Text Skeleton */}
            <div className="space-y-1 w-full flex flex-col items-center">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Button Skeleton */}
            <div className="w-full h-9 bg-gray-200 rounded-md animate-pulse mb-1" />

            {/* Stats Grid Skeleton */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div className="bg-gray-50 p-2 rounded-lg text-center animate-pulse">
                <div className="h-2 w-12 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-4 w-10 bg-gray-200 rounded mx-auto" />
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center animate-pulse">
                <div className="h-2 w-12 bg-gray-200 rounded mx-auto mb-1" />
                <div className="h-4 w-10 bg-gray-200 rounded mx-auto" />
              </div>
              <div className="bg-gray-50 p-2 rounded-lg col-span-2 flex items-center justify-between px-3 animate-pulse">
                <div className="h-2 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClock = () => {
    if (isClockedIn) {
      clockOut();
    } else {
      clockIn();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="animate-slide-up w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Attendance</CardTitle>
        <Badge variant={isClockedIn ? 'success' : hasClockedOut ? 'secondary' : 'muted'}>
          {isClockedIn ? 'Clocked In' : hasClockedOut ? 'Completed' : 'Not Started'}
        </Badge>
      </CardHeader>
      <CardContent className="py-3">
        <div className="flex flex-col items-center gap-2">
          {/* ... existing clock UI ... */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isClockedIn ? 'bg-green-100' : 'bg-primary/10'
            }`}>
            <Clock className={`h-6 w-6 ${isClockedIn ? 'text-green-600' : 'text-primary'}`} />
          </div>

          <div className="text-center">
            {clockInTime ? (
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  Current Session: <span className="text-foreground">{formatTime(clockInTime)}</span>
                </p>
                <p className="text-xs text-muted-foreground animate-pulse">
                  Tracking time...
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {hasClockedOut
                  ? "Session paused. Resume tracking?"
                  : "Mark your attendance"}
              </p>
            )}
          </div>

          <Button
            variant={isClockedIn ? 'destructive' : 'nexus'}
            size="sm"
            onClick={handleClock}
            disabled={loading}
            className="w-full relative overflow-hidden mb-1 h-9"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isClockedIn ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Clock Out / Pause
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {hasClockedOut ? "Resume Work" : "Clock In"}
              </>
            )}
          </Button>

          {/* New Section to fill vertical space and provide value */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            <div className="bg-secondary/20 p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">Total Today</p>
              <p className="font-semibold text-foreground text-sm">
                {totalDurationHours?.toFixed(1) || "0.0"} hrs
              </p>
            </div>
            <div className="bg-secondary/20 p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">Weekly Avg</p>
              <p className="font-semibold text-foreground text-sm">
                {(() => {
                  const daysPassed = (stats?.totalWorkingDays || 0) / 8;
                  const avg = daysPassed > 0 ? (stats?.totalPresent || 0) / daysPassed : 0;
                  return avg.toFixed(1);
                })()} hrs
              </p>
            </div>
            <div className="bg-secondary/20 p-2 rounded-lg text-center col-span-2 flex items-center justify-between px-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Time Bank</span>
              <span className={`font-semibold text-sm ${stats?.onTimePercentage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats?.onTimePercentage > 0 ? '+' : ''}{stats?.onTimePercentage?.toFixed(2) || "0.00"} hrs
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
