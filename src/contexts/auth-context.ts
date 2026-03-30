import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'neury' | null;

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
