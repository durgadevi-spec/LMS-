import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  login: (code: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Do not persist user to localStorage; keep session in memory only.
    setIsLoading(false);
  }, []);

  const login = async (code: string, password?: string) => {
    // Query Supabase users table for matching code and optional password
    try {
      const normalizedCode = code.toString().trim();

      // Try to find existing user by username
      const selectQuery = supabase.from('users').select('*').eq('username', normalizedCode).limit(1);
      if (password) selectQuery.eq('password', password);
      const { data, error } = await selectQuery.maybeSingle();

      if (error) {
        console.error('Supabase login error', error);
        return false;
      }

      let dbUser: any = data;

      // If user not found, create a minimal employee row so employee logins persist to DB
      if (!dbUser) {
        const insertPayload = {
          user_id: normalizedCode,
          username: normalizedCode,
          role: 'employee',
          password: password ?? null,
        };

        // Use upsert to avoid duplicate-key errors when multiple clients
        // attempt to create the same user concurrently.
        const { data: inserted, error: insertErr } = await supabase
          .from('users')
          .upsert(insertPayload, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (insertErr) {
          console.error('Supabase upsert user error', insertErr);
          return false;
        }
        dbUser = inserted;
      }

      // Map DB role (which may be lowercase) to app Role type
      const dbRole = (dbUser?.role || 'employee').toString().toLowerCase();
      const mappedRole: Role = dbRole === 'admin' ? 'Admin' : dbRole === 'hr' ? 'HR' : 'Employee';

      const foundUser: User = {
        id: String(dbUser?.user_id || dbUser?.username || ''),
        code: dbUser?.username || dbUser?.user_id || '',
        name: dbUser?.name || dbUser?.username || '',
        role: mappedRole,
        designation: dbUser?.designation || '',
        email: dbUser?.email || undefined,
      };

      setUser(foundUser);
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // Do not use localStorage; session cleared in memory.
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
