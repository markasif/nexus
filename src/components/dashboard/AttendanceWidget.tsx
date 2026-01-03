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
    loading
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
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full transition-colors ${isClockedIn ? 'bg-green-100' : 'bg-primary/10'
            }`}>
            <Clock className={`h-10 w-10 ${isClockedIn ? 'text-green-600' : 'text-primary'}`} />
          </div>

          <div className="text-center">
            {clockInTime ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Started: <span className="text-foreground">{formatTime(clockInTime)}</span>
                </p>
                {clockOutTime && (
                  <p className="text-sm text-muted-foreground">
                    Ended: {formatTime(clockOutTime)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mark your attendance for today
              </p>
            )}
          </div>

          <Button
            variant={isClockedIn ? 'destructive' : 'nexus'}
            size="lg"
            onClick={handleClock}
            disabled={loading || hasClockedOut}
            className="w-full relative overflow-hidden"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isClockedIn ? (
              <>
                <LogOut className="mr-2 h-5 w-5" />
                Clock Out
              </>
            ) : hasClockedOut ? (
              "Shift Completed"
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Clock In
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
