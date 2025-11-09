import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword, sendEmailVerification, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { applyTheme, loadThemeFromStorage, forceLightMode, type Theme } from '../lib/theme';
import { syncUserToBrevo } from '../services/brevo';

interface UserData {
  email: string;
  name?: string;
  photoURL?: string;
  credits: number;
  profileCompleted: boolean;
  createdAt: string;
  lastLogin: string;
  theme?: 'light' | 'dark' | 'system';
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  isProfileCompleted: boolean;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfile: (firstName: string, lastName: string, photoURL?: string) => Promise<void>;
  completeProfile: (profileData: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isProfileCompleted: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
  login: async (email: string, password: string) => {},
  signup: async (email: string, password: string, firstName?: string, lastName?: string) => {},
  resetPassword: async (email: string) => {},
  resendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  completeProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() as UserData;
        setUserData(userData);
        setIsProfileCompleted(userData?.profileCompleted ?? false);
        
        // Load and apply theme from Firestore if available (only when logged in)
        if (userData?.theme) {
          applyTheme(userData.theme as Theme);
        } else {
          // If no theme in Firestore, load from localStorage
          const theme = loadThemeFromStorage();
          applyTheme(theme);
        }
      } else {
        setUserData(null);
        // Force light mode when logged out
        forceLightMode();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const completeProfile = async (profileData: any) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      });

      // Sync to Brevo (non-blocking)
      try {
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        await syncUserToBrevo(
          {
            email: currentUser.email || '',
            firstName: profileData.firstName || userData?.firstName || '',
            lastName: profileData.lastName || userData?.lastName || '',
            phone: profileData.phone || '',
            company: profileData.company || '',
            jobtitle: profileData.jobTitle || profileData.title || '',
            city: profileData.city || '',
            state: profileData.state || '',
            country: profileData.country || '',
            jobzai_user_id: currentUser.uid,
            jobzai_profile_completed: true,
            ...profileData,
          },
          'profile_completed',
          {
            userId: currentUser.uid,
            completedAt: new Date().toISOString(),
          }
        );
      } catch (brevoError) {
        console.warn('Brevo sync failed (non-critical):', brevoError);
      }

      setIsProfileCompleted(true);
      navigate('/hub');
      toast.success('Profile completed successfully!');
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile');
      throw error;
    }
  };

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
      const isProfileComplete = userDoc.data()?.profileCompleted ?? false;
      
      await setDoc(userRef, {
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: isNewUser ? new Date().toISOString() : userDoc.data()?.createdAt,
        lastLogin: new Date().toISOString(),
        profileCompleted: isNewUser ? false : isProfileComplete
      }, { merge: true });

      // Sync to Brevo (non-blocking)
      if (isNewUser) {
        try {
          const displayName = result.user.displayName || '';
          const nameParts = displayName.split(' ');
        await syncUserToBrevo(
          {
            email: result.user.email || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            jobzai_user_id: result.user.uid,
            jobzai_signup_date: new Date().toISOString(),
            jobzai_profile_completed: false,
            jobzai_source: 'google',
          },
          'user_signed_up',
          {
            userId: result.user.uid,
            source: 'google',
          }
        );
      } catch (brevoError) {
        console.warn('Brevo sync failed (non-critical):', brevoError);
        }
      }

      if (isNewUser || !isProfileComplete) {
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

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Vérifier si l'email est vérifié
      if (!result.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error('Please verify your email before logging in');
      }
      
      // Mettre à jour lastLogin dans Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString()
      });
      
      return result;
    } catch (error: any) {
      console.error('Login Error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + '/complete-profile',
        handleCodeInApp: false
      });
    } catch (error: any) {
      console.error('Resend Verification Email Error:', error);
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

  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le displayName dans Firebase Auth si firstName et lastName sont fournis
      if (firstName && lastName) {
        try {
          await updateProfile(result.user, {
            displayName: `${firstName} ${lastName}`,
          });
        } catch (profileError) {
          console.error('Error updating profile:', profileError);
          // Ne pas bloquer l'inscription si la mise à jour du profil échoue
        }
      }
      
      // Envoyer l'email de vérification immédiatement après la création du compte
      try {
        await sendEmailVerification(result.user, {
          url: window.location.origin + '/complete-profile',
          handleCodeInApp: false
        });
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Ne pas bloquer l'inscription si l'envoi d'email échoue
        // L'utilisateur pourra demander un renvoi plus tard
      }
      
      // Sauvegarder les données utilisateur dans Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userData: any = {
        email: result.user.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileCompleted: false,
        emailVerified: false
      };

      // Ajouter firstName et lastName si fournis
      if (firstName) {
        userData.firstName = firstName;
      }
      if (lastName) {
        userData.lastName = lastName;
      }
      if (firstName && lastName) {
        userData.name = `${firstName} ${lastName}`;
      }

      await setDoc(userRef, userData);

      // Sync to Brevo (non-blocking)
      try {
        await syncUserToBrevo(
          {
            email: result.user.email || '',
            firstName: firstName,
            lastName: lastName,
            jobzai_user_id: result.user.uid,
            jobzai_signup_date: new Date().toISOString(),
            jobzai_profile_completed: false,
            jobzai_source: 'email',
          },
          'user_signed_up',
          {
            userId: result.user.uid,
            source: 'email',
          }
        );
      } catch (brevoError) {
        console.warn('Brevo sync failed (non-critical):', brevoError);
      }

      console.log("Redirecting to verify-email after signup");
      navigate('/verify-email');
      
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
    userData,
    loading,
    isProfileCompleted,
    signInWithGoogle,
    logout,
    login,
    signup,
    resetPassword,
    resendVerificationEmail,
    updateUserProfile,
    completeProfile,
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
