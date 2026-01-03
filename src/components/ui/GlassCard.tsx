
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-sm transition-all duration-300",
                hoverEffect && "hover:bg-white/20 hover:shadow-card-hover hover:scale-[1.01] hover:border-white/30",
                "dark:bg-black/20 dark:border-white/10 dark:hover:bg-black/30",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
