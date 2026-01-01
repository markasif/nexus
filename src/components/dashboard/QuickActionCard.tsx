import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  action: string;
  actionLabel: string;
  highlight?: boolean;
}

export function QuickActionCard({
  title,
  description,
  icon,
  action,
  actionLabel,
  highlight = false,
}: QuickActionCardProps) {
  return (
    <Card variant="interactive" className="group animate-slide-up">
      <CardContent className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <Button variant={highlight ? "nexus" : "surface"} size="sm" asChild className="group/btn">
          <Link to={action}>
            {actionLabel}
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
