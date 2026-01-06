import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTasks } from "@/hooks/useTasks";
import { CheckSquare, Plus, Trash2 } from "lucide-react";

export function TaskListWidget() {
    const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks();
    const [newTask, setNewTask] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        await addTask(newTask);
        setNewTask("");
    };

    return (
        <Card className="h-full flex flex-col animate-slide-up">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-nexus-primary" />
                    My To-Do List
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input
                        placeholder="Add a new task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="h-9"
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-9 w-9 p-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </form>

                <ScrollArea className="flex-1 h-[250px] -mr-3 pr-3">
                    <div className="space-y-2">
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Loading tasks...</p>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No tasks yet.</p>
                                <p className="text-xs">Add one to get started!</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                        <Checkbox
                                            checked={task.is_completed}
                                            onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                                        />
                                        <span className={`text-sm truncate ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
