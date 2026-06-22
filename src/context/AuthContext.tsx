import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile } from '../types';
import { api, isDemoMode, supabase } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  login: (emailOrName: string, role?: string) => Promise<Profile>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<Profile>;
  logout: () => Promise<void>;
  switchDemoUser: (profileId: string) => Promise<Profile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to get current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // If using real Supabase, subscribe to auth state changes
    if (!isDemoMode && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            const { data } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setUser(data || null);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (emailOrName: string, _role?: string): Promise<Profile> => {
    setLoading(true);
    try {
      if (isDemoMode) {
        const profiles = await api.getProfiles();
        const q = emailOrName.toLowerCase();
        let matched = profiles.find(p =>
          (p.username && p.username.toLowerCase() === q) ||
          (p.email && p.email.toLowerCase() === q) ||
          p.full_name.toLowerCase().includes(q) ||
          p.role === emailOrName ||
          p.id === emailOrName
        );
        if (!matched) {
          throw new Error('User profile not found in demo registry.');
        }
        if (matched.password && matched.password !== _role) {
          throw new Error('Incorrect password for this demo account.');
        }
        await api.switchUser(matched.id);
        setUser(matched);
        return matched;
      } else {
        // Real Supabase auth
        if (!supabase) throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrName,
          password: _role || '', // password passed through role param for now
        });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Login failed — no user returned.');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        setUser(profile);
        return profile;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, phone?: string): Promise<Profile> => {
    setLoading(true);
    try {
      if (isDemoMode) {
        const newProfile = await api.createStaffAccount(fullName, email, 'customer', phone);
        await api.switchUser(newProfile.id);
        setUser(newProfile);
        return newProfile;
      } else {
        if (!supabase) throw new Error('Supabase not configured.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone } }
        });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Registration failed.');
        // Profile is created by DB trigger; fetch it
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        setUser(profile);
        return profile;
      }
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (profileId: string): Promise<Profile> => {
    setLoading(true);
    try {
      const newUser = await api.switchUser(profileId);
      setUser(newUser);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo: isDemoMode,
      login,
      register,
      logout,
      switchDemoUser,
      refreshUser
    }}>
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
