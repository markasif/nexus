import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type Task = {
    id: string;
    title: string;
    is_completed: boolean;
};

export function useTasks() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const addTask = async (title: string) => {
        if (!title.trim()) return;
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({ user_id: user?.id, title, is_completed: false })
                .select()
                .single();

            if (error) throw error;
            setTasks(prev => [data, ...prev]);
        } catch (err) {
            toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
        }
    };

    const toggleTask = async (id: string, is_completed: boolean) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed } : t));

            const { error } = await supabase
                .from('tasks')
                .update({ is_completed })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
            fetchTasks(); // Revert on error
        }
    };

    const deleteTask = async (id: string) => {
        try {
            setTasks(prev => prev.filter(t => t.id !== id));
            await supabase.from('tasks').delete().eq('id', id);
        } catch (err) {
            fetchTasks();
        }
    }

    return { tasks, loading, addTask, toggleTask, deleteTask };
}
