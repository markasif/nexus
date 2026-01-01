import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut } from 'lucide-react';

export function AttendanceWidget() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const handleClock = () => {
    if (!isClockedIn) {
      setClockInTime(new Date());
      setIsClockedIn(true);
    } else {
      setClockInTime(null);
      setIsClockedIn(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Attendance</CardTitle>
        <Badge variant={isClockedIn ? 'success' : 'muted'}>
          {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          {isClockedIn && clockInTime && (
            <p className="text-sm text-muted-foreground">
              Started at {formatTime(clockInTime)}
            </p>
          )}
          <Button
            variant={isClockedIn ? 'destructive' : 'nexus'}
            size="lg"
            onClick={handleClock}
            className="w-full"
          >
            {isClockedIn ? (
              <>
                <LogOut className="mr-2 h-5 w-5" />
                Clock Out
              </>
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
