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
  onClick
}: QuickActionCardProps & { onClick?: () => void }) {
  const ButtonContent = (
    <>
      {actionLabel}
      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
    </>
  );

  return (
    <Card variant="interactive" className="group animate-slide-up h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground flex-1">{description}</p>

        {onClick ? (
          <Button variant={highlight ? "nexus" : "surface"} size="sm" onClick={onClick} className="w-fit group/btn mt-auto">
            {ButtonContent}
          </Button>
        ) : (
          <Button variant={highlight ? "nexus" : "surface"} size="sm" asChild className="w-fit group/btn mt-auto">
            <Link to={action}>
              {ButtonContent}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
