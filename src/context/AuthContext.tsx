import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { login as apiLogin, loginWithGoogle as apiLoginWithGoogle, checkNeedsOwnerSetup, setupInitialOwner } from '../lib/api';
import { auth, db } from '../lib/firebase';
import { isKnownOwnerEmail } from '../lib/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  needsOwnerSetup: boolean;
  refreshOwnerSetupStatus: () => Promise<boolean>;
  setupOwner: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  isLoading: true,
  needsOwnerSetup: false,
  refreshOwnerSetupStatus: async () => false,
  setupOwner: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOwnerSetup, setNeedsOwnerSetup] = useState(false);

  const refreshOwnerSetupStatus = useCallback(async (): Promise<boolean> => {
    try {
      const needs = await checkNeedsOwnerSetup();
      setNeedsOwnerSetup(needs);
      return needs;
    } catch {
      return false;
    }
  }, []);

  // Check setup status on boot
  useEffect(() => {
    refreshOwnerSetupStatus();
  }, [refreshOwnerSetupStatus]);

  // Synchronize with Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const email = (fbUser.email || '').toLowerCase().trim();
          const isOwner = isKnownOwnerEmail(email);

          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          let profile: UserProfile;

          if (userDoc.exists()) {
            profile = { id: fbUser.uid, ...userDoc.data() } as UserProfile;
            if (isOwner && profile.role !== 'owner') {
              profile.role = 'owner';
              try {
                await setDoc(doc(db, 'users', fbUser.uid), { role: 'owner' }, { merge: true });
              } catch (e) {
                console.warn('Error updating owner role in doc:', e);
              }
            }
          } else {
            profile = {
              id: fbUser.uid,
              email: email,
              name: fbUser.displayName || (isOwner ? 'Proprietário Líder Barbers' : 'Membro da Equipe'),
              role: isOwner ? 'owner' : 'admin',
              active: true,
            };
            try {
              await setDoc(doc(db, 'users', fbUser.uid), {
                ...profile,
                created_at: new Date().toISOString(),
              });
            } catch (e) {
              console.warn('Notice writing user doc in AuthContext:', e);
            }
          }

          setUser(profile);
          localStorage.setItem('liberdade_user', JSON.stringify(profile));

          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('liberdade_token', idToken);
        } else {
          // If no Firebase Auth user, clear state
          setUser(null);
          setToken(null);
          localStorage.removeItem('liberdade_user');
          localStorage.removeItem('liberdade_token');
        }
      } catch (e) {
        console.warn('Notice loading Firebase Auth user profile:', e);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiLogin(email, pass);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('liberdade_user', JSON.stringify(res.user));
    localStorage.setItem('liberdade_token', res.token);
    setNeedsOwnerSetup(false);
  };

  const loginWithGoogle = async () => {
    const res = await apiLoginWithGoogle();
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('liberdade_user', JSON.stringify(res.user));
    localStorage.setItem('liberdade_token', res.token);
    setNeedsOwnerSetup(false);
  };

  const setupOwner = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await setupInitialOwner(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('liberdade_user', JSON.stringify(res.user));
    localStorage.setItem('liberdade_token', res.token);
    setNeedsOwnerSetup(false);
  };

  const logout = () => {
    try {
      signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('liberdade_user');
    localStorage.removeItem('liberdade_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        needsOwnerSetup,
        refreshOwnerSetupStatus,
        setupOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
