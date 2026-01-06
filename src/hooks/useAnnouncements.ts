import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type Announcement = {
    id: string;
    title: string;
    content: string;
    created_at: string;
    is_active: boolean;
};

export function useAnnouncements() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchAnnouncements();
    }, [user]);

    const addAnnouncement = async (title: string, content: string) => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .insert({
                    title,
                    content,
                    created_by: user?.id,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            setAnnouncements(prev => [data, ...prev]);
            toast({ title: "Published", description: "Announcement sent to all employees." });
            return true;
        } catch (err) {
            toast({ title: "Error", description: "Failed to publish announcement", variant: "destructive" });
            return false;
        }
    };

    const deleteAnnouncement = async (id: string) => {
        try {
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            await supabase.from('announcements').delete().eq('id', id);
            toast({ title: "Deleted", description: "Announcement removed." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    }

    return { announcements, loading, addAnnouncement, deleteAnnouncement };
}
