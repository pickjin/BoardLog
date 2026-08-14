import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { storage } from '../services/storage';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nickname: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  updateTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    try {
      const session = await storage.getActiveSession();
      if (session) {
        setUser(session);
      } else {
        // Auto sign in as guest on first load for friction-free UX
        const guest = await storage.signInAnonymously();
        setUser(guest);
      }
    } catch (err) {
      console.error('Auth initialization error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const signIn = async (email: string, pass: string) => {
    const loggedIn = await storage.signIn(email, pass);
    setUser(loggedIn);
  };

  const signUp = async (email: string, pass: string, nickname: string) => {
    const newUser = await storage.signUp(email, pass, nickname);
    setUser(newUser);
  };

  const signInAnonymously = async () => {
    const guest = await storage.signInAnonymously();
    setUser(guest);
  };

  const signOut = async () => {
    await storage.signOut();
    // After sign out, create a clean guest session or keep user as null
    const guest = await storage.signInAnonymously();
    setUser(guest);
  };

  const updateTheme = async (theme: 'light' | 'dark' | 'auto') => {
    if (!user) return;
    const updated = await storage.updateProfile(user.uid, { theme });
    setUser(updated);
  };

  const updateNickname = async (nickname: string) => {
    if (!user) return;
    const updated = await storage.updateProfile(user.uid, { nickname });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInAnonymously,
        signOut,
        updateTheme,
        updateNickname
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
