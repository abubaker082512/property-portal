import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile } from '../types';
import { api, isDemoMode } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, role?: string) => Promise<Profile>;
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
  }, []);

  const login = async (email: string, role?: string): Promise<Profile> => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // In demo mode, we look for a profile matching the email or role keyword
        const profiles = await api.getProfiles();
        let matched = profiles.find(p => p.full_name.toLowerCase().includes(email.toLowerCase()) || p.role === role);
        if (!matched) {
          // fallback to first profile or create a default
          matched = profiles[0];
        }
        await api.switchUser(matched.id);
        setUser(matched);
        return matched;
      } else {
        // Real Supabase Auth would sign in with email/password
        // For local development simplicity in production mode, we try to fetch profile
        throw new Error('Supabase live email login needs supabase.auth.signInWithPassword. Configure environment variables.');
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
