'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from 'firebase/auth';
import { useAuthHook } from '@/hooks/authHook';
import { User as AppUser } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  error: Error | null;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    company: string,
    phone: string
  ) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
} 