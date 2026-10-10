import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

export const EXCLUSIVE_ADMIN_EMAIL = 'jeannmkt2@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  isBlocked: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        const isMasterAdmin = user.email?.toLowerCase() === EXCLUSIVE_ADMIN_EMAIL.toLowerCase();

        const userDocRef = doc(db, 'users', user.uid);
        const adminDocRef = doc(db, 'admins', user.uid);

        try {
          const snap = await getDoc(userDocRef);

          if (!snap.exists()) {
            // Document creation for new or first-time admin
            const initialRole: UserRole = isMasterAdmin ? 'admin' : 'buyer';
            const initialStatus: UserStatus = isMasterAdmin ? 'approved' : 'pending';

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              fullName: isMasterAdmin ? 'Administrador Dinâmico Pro' : (user.displayName || 'Comprador'),
              role: initialRole,
              status: initialStatus,
              createdAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile, { merge: true });

            if (isMasterAdmin) {
              await setDoc(adminDocRef, {
                email: user.email,
                createdAt: new Date().toISOString(),
              }, { merge: true });
            }
          } else if (isMasterAdmin) {
            // Ensure master admin stays approved and admin role
            const currentData = snap.data() as UserProfile;
            if (currentData.role !== 'admin' || currentData.status !== 'approved') {
              await setDoc(userDocRef, {
                role: 'admin',
                status: 'approved',
              }, { merge: true });
            }
            await setDoc(adminDocRef, {
              email: user.email,
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (e) {
          console.error('Erro ao verificar/inicializar perfil do usuário:', e);
        }

        // Attach real-time listener to user profile document for instant approval updates!
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Erro no listener do perfil:', err);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const isMasterAdmin = cred.user.email?.toLowerCase() === EXCLUSIVE_ADMIN_EMAIL.toLowerCase();

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        fullName: fullName.trim(),
        role: isMasterAdmin ? 'admin' : 'buyer',
        status: isMasterAdmin ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);

      if (isMasterAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          email: cred.user.email,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setUserProfile(null);
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const isMasterAdminEmail = currentUser?.email?.toLowerCase() === EXCLUSIVE_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isMasterAdminEmail || userProfile?.role === 'admin';
  const isApproved = isAdmin || userProfile?.status === 'approved';
  const isPending = !isAdmin && userProfile?.status === 'pending';
  const isBlocked = !isAdmin && userProfile?.status === 'blocked';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        isApproved,
        isPending,
        isBlocked,
        loading,
        login,
        signup,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
