import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (firstName?: string, lastName?: string, photoURL?: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, firstName: string, lastName: string) {
    try {
      // Create the user account
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const displayName = `${firstName} ${lastName}`;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Initialize user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        firstName,
        lastName,
        email,
        credits: 150,
        jobPreferences: '',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        emailVerified: false,
        plan: 'free'
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user if email is not verified
        await signOut(auth);
        throw new Error('Please verify your email before logging in');
      }

      // Update Firestore emailVerified status if needed
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && !userDoc.data().emailVerified) {
        await setDoc(userRef, {
          emailVerified: true,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function resendVerificationEmail() {
    if (!currentUser) throw new Error('No user logged in');
    await sendEmailVerification(currentUser);
  }

  async function updateUserProfile(firstName?: string, lastName?: string, photoURL?: string) {
    if (!currentUser) throw new Error('No user logged in');
    
    const updates: { displayName?: string; photoURL?: string } = {};
    
    if (firstName && lastName) {
      updates.displayName = `${firstName} ${lastName}`;
    }
    if (photoURL) {
      updates.photoURL = photoURL;
    }

    if (Object.keys(updates).length > 0) {
      await updateProfile(currentUser, updates);
    }

    // Update Firestore if name changed
    if (firstName || lastName) {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Force email verification check on auth state change
        await user.reload();
        
        // Update Firestore when email is verified
        if (user.emailVerified) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { 
            emailVerified: true,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    resendVerificationEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}