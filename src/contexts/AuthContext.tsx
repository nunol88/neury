import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'neury' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isActive: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  verifyRole: () => Promise<AppRole>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Valid roles that can be returned from the database
const VALID_ROLES: readonly string[] = ['admin', 'neury'] as const;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  // Secure role fetching with validation
  const fetchUserRole = useCallback(async (userId: string): Promise<{ role: AppRole; active: boolean }> => {
    try {
      if (!userId || typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
        console.error('Invalid user ID format');
        return { role: null, active: false };
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error.message);
        return { role: null, active: false };
      }

      const roleValue = data?.role;
      if (roleValue && VALID_ROLES.includes(roleValue)) {
        return { role: roleValue as AppRole, active: data?.is_active ?? true };
      }

      return { role: null, active: false };
    } catch (error) {
      console.error('Error fetching role:', error);
      return { role: null, active: false };
    }
  }, []);

  // Function to verify role on-demand (for sensitive operations)
  const verifyRole = useCallback(async (): Promise<AppRole> => {
    if (!user?.id) return null;
    const result = await fetchUserRole(user.id);
    setRole(result.role);
    setIsActive(result.active);
    return result.role;
  }, [user?.id, fetchUserRole]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout
        if (session?.user) {
          setTimeout(async () => {
            const result = await fetchUserRole(session.user.id);
            setRole(result.role);
            setIsActive(result.active);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setIsActive(true);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(result => {
          setRole(result.role);
          setIsActive(result.active);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setIsActive(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isActive, loading, signIn, signUp, signOut, verifyRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
