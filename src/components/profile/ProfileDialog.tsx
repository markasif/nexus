import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Upload, User, Camera, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileDialogProps {
    children: React.ReactNode;
}

export function ProfileDialog({ children }: ProfileDialogProps) {
    const { user, refreshProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        avatarUrl: '',
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
        }
    }, [isOpen, user]);

    async function fetchProfile() {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    fullName: data.full_name || '',
                    email: data.email || '',
                    role: data.role || '',
                    avatarUrl: data.avatar_url || '',
                });
                setPreviewUrl(data.avatar_url || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload logic will happen on Save
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            if (!user) return;

            let avatarPath = formData.avatarUrl;

            // Handle File Upload if changed
            if (fileInputRef.current?.files?.[0]) {
                const file = fileInputRef.current.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarPath = publicUrl;
            }

            // Update Profile in DB
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    avatar_url: avatarPath,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            toast.success('Profile updated successfully');

            // Re-fetch profile in context to update UI without reload
            await refreshProfile();
            setIsOpen(false);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] overflow-hidden p-0 gap-0 border-0 shadow-2xl">
                {/* Premium Header with Deep Ocean Gradient */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight text-white">Edit Profile</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium">
                            Manage your account details and profile picture.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-6 bg-background">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="relative group">
                            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl bg-muted ring-2 ring-nexus-primary/20">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-gray-50">
                                        <User className="h-14 w-14" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-nexus-primary text-white shadow-lg hover:bg-nexus-dark transition-all duration-300 transform hover:scale-110"
                                title="Change photo"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Profile Picture
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-nexus-primary" /> Full Name
                            </Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Your Name"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-nexus-primary" /> Email Address
                            </Label>
                            <Input
                                id="email"
                                value={formData.email}
                                disabled
                                className="h-11 border-gray-200 bg-gray-100 text-muted-foreground/70 font-medium cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Upload className="h-3.5 w-3.5 text-nexus-primary" /> Access Role
                            </Label>
                            <Input
                                id="role"
                                value={formData.role ?? 'Employee'}
                                disabled
                                className="h-11 border-gray-200 bg-gray-100 text-muted-foreground/70 font-medium cursor-not-allowed capitalize"
                            />
                        </div>
                        {/* Optional second column info or placeholder */}
                        <div className="space-y-2 opacity-50">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 text-nexus-primary" /> Account Status
                            </Label>
                            <div className="h-11 flex items-center px-3 rounded-md border border-gray-200 bg-gray-100 text-success font-semibold text-sm">
                                Active
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
                        <Button variant="outline" onClick={() => setIsOpen(false)} className="h-11 px-6 border-gray-200 hover:bg-gray-50 hover:text-nexus-dark font-medium transition-all">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="h-11 px-8 bg-nexus-dark hover:bg-nexus-primary text-white shadow-lg hover:shadow-nexus-primary/50 transition-all duration-300 font-semibold">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Profile
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
