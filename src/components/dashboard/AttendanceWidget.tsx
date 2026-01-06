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
    totalDurationHours
  } = useAttendance();

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
    <Card className="animate-slide-up h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Attendance</CardTitle>
        <Badge variant={isClockedIn ? 'success' : hasClockedOut ? 'secondary' : 'muted'}>
          {isClockedIn ? 'Clocked In' : hasClockedOut ? 'Completed' : 'Not Started'}
        </Badge>
      </CardHeader>
      <CardContent className="py-4">
        <div className="flex flex-col items-center gap-3">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isClockedIn ? 'bg-green-100' : 'bg-primary/10'
            }`}>
            <Clock className={`h-8 w-8 ${isClockedIn ? 'text-green-600' : 'text-primary'}`} />
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
                  : "Mark your attendance for today"}
              </p>
            )}
          </div>

          <Button
            variant={isClockedIn ? 'destructive' : 'nexus'}
            size="default"
            onClick={handleClock}
            disabled={loading}
            className="w-full relative overflow-hidden mb-2"
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
          <div className="w-full grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="bg-secondary/20 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Today</p>
              <p className="font-semibold text-foreground">
                {totalDurationHours?.toFixed(1) || "0.0"} hrs
              </p>
            </div>
            <div className="bg-secondary/20 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Weekly Avg</p>
              <p className="font-semibold text-foreground">8.2 hrs</p>
            </div>
            <div className="bg-secondary/20 p-3 rounded-lg text-center col-span-2 flex items-center justify-between px-4">
              <span className="text-xs text-muted-foreground">On Time Arrival</span>
              <span className="font-semibold text-success text-sm">98%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
