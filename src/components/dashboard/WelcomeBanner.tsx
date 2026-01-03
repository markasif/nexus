import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';

export function WelcomeBanner() {
    const { user } = useAuth();
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-nexus-primary via-nexus-secondary to-purple-600 p-8 text-white shadow-xl animate-slide-up">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10 blur-2xl"></div>

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm font-medium">{date}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
                    </h1>
                    <p className="max-w-xl text-nexus-light/90">
                        Here's what's happening in your business today. You have pending alerts and new revenue data to review.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md">
                        View Reports
                    </Button>
                    <Button className="bg-white text-nexus-primary hover:bg-nexus-light shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        New Action
                    </Button>
                </div>
            </div>
        </div>
    );
}
