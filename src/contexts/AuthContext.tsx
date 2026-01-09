import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContextType, User, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage to avoid "spinner hell" on refresh
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from storage", e);
      return null;
    }
  });

  // If we have a user in storage, we are NOT loading initially.
  // We will re-validate in the background.
  const [isLoading, setIsLoading] = useState(!user);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('nexus_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('nexus_user');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // If we have a session, fetch profile (background validation)
          const profileData = await fetchProfile(session.user.id, session.user.email);
          // If fetchProfile returns null (error/inactive), it handles the signOut/setUser(null) internally
        } else {
          // No session found
          if (user) {
            // If we thought we had a user but Supabase says no, clear it.
            console.warn("Session invalid, clearing user.");
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Race logic is still useful for the *initial* load if we didn't have a user.
    // If we DID have a user, checkSession runs in the background.
    const initAuth = async () => {
      if (!user) {
        // Only block UI if we don't have a cached user
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 10000));
        try {
          await Promise.race([checkSession(), timeoutPromise]);
        } catch (error) {
          console.warn("Auth init timed out", error);
          setIsLoading(false);
        }
      } else {
        // We have a user, just revalidate silently
        checkSession();
      }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (session?.user) {
        // Optionally refresh profile on token refresh or sign in
        if (event === 'SIGNED_IN') {
          await fetchProfile(session.user.id, session.user.email);
        }
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    const fetchWithTimeout = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    };

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchWithTimeout(), timeoutPromise]);

      if (error) {
        console.error("Error fetching profile:", error);
        // If we can't verify profile, we shouldn't necessarily kill the session if it's just a network blip,
        // UNLESS we are strictly tight security. For now, let's keep the existing user state if it exists, 
        // or failing that (if null), fail closed.
        // But to fix "redirect loop", if we are already logged in (optimistic), we might want to keep it.
        // However, for strict security requested:
        if (!user) {
          return null;
        }
        return user; // Return stale user if network fails? Or maybe null? Let's return nothing/void.
      }

      if (data) {
        if (data.status === 'inactive') {
          console.warn("User is inactive, signing out.");
          await supabase.auth.signOut();
          setUser(null);
          throw new Error("Your account is deactivated. Please contact the administrator.");
        }

        const updatedUser: User = {
          id: userId,
          email: email || "",
          name: data.full_name || email?.split("@")[0] || "User",
          role: (data.role as UserRole) || 'employee',
          status: (data.status as 'active' | 'inactive') || 'active',
          avatar_url: data.avatar_url,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        };

        // Update state (and storage)
        setUser(updatedUser);
        return updatedUser;
      }
    } catch (error: any) {
      console.error("Profile fetch exception:", error);
      if (error.message === "Your account is deactivated. Please contact the administrator.") {
        throw error;
      }
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error (suppressed):", error);
    } finally {
      // Always clear local state
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
