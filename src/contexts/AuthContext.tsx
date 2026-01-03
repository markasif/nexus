import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContextType, User, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Race between checkSession and a 5-second timeout to prevent indefinite loading
    const initAuth = async () => {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000));
      try {
        await Promise.race([checkSession(), timeoutPromise]);
      } catch (error) {
        console.warn("Auth initialization timed out or failed, forcing app load.", error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // We might already have the user, but refreshing profile is safer on login
        await fetchProfile(session.user.id, session.user.email);
        setIsLoading(false)
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    // Helper to fetch with timeout
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
        // Fallback: Use existing state if available, otherwise default
        setUser(prev => {
          if (prev && prev.id === userId) {
            return prev;
          }
          return {
            id: userId,
            email: email || "",
            name: email?.split("@")[0] || "User",
            role: 'employee',
            status: 'active',
            createdAt: new Date(),
          };
        });
        return;
      }

      if (data) {
        setUser({
          id: userId,
          email: email || "",
          name: data.full_name || email?.split("@")[0] || "User",
          role: (data.role as UserRole) || 'employee',
          status: (data.status as 'active' | 'inactive') || 'active',
          avatar_url: data.avatar_url,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        });
      }
    } catch (error) {
      console.error("Profile fetch failed/timed out:", error);
      // Fallback: If we have an existing user, keep their role/data. Otherwise default to employee.
      setUser(prev => {
        if (prev && prev.id === userId) {
          return prev;
        }
        return {
          id: userId,
          email: email || "",
          name: email?.split("@")[0] || "User",
          role: 'employee',
          status: 'active',
          createdAt: new Date(),
        };
      });
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email);

        // Wait for state update or check profile directly
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (profile?.status === 'inactive') {
          await supabase.auth.signOut();
          setUser(null);
          throw new Error("Your account is deactivated. Please contact the administrator.");
        }
      }
    } catch (err) {
      console.error("Login critical failure:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
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
