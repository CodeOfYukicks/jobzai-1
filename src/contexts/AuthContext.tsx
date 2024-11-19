import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<any>;
  updateUserProfile: (firstName: string, lastName: string, photoURL?: string) => Promise<void>;
  // Ajoutez d'autres m├®thodes n├®cessaires
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  signup: async (email: string, password: string) => {},
  updateUserProfile: async () => {},
  // Ajoutez d'autres m├®thodes n├®cessaires
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      
      const userDoc = await getDoc(userRef);
      const isNewUser = !userDoc.exists();
      
      await setDoc(userRef, {
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: isNewUser ? new Date().toISOString() : userDoc.data()?.createdAt,
        lastLogin: new Date().toISOString(),
        profileCompleted: false
      }, { merge: true });

      if (isNewUser) {
        navigate('/complete-profile');
      } else {
        navigate('/hub');
      }
      
      return result;
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign Out Error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        email: result.user.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileCompleted: false,
        emailVerified: false
      });

      await sendEmailVerification(result.user, {
        url: window.location.origin + '/hub',
        handleCodeInApp: false
      });

      navigate('/complete-profile');
      
      return result;
    } catch (error) {
      console.error('Signup Error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (firstName: string, lastName: string, photoURL?: string) => {
    if (!auth.currentUser) return;
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}`,
        photoURL: photoURL || auth.currentUser.photoURL,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
    signup,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
