import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { sendCustomVerificationEmail, sendCustomPasswordResetEmail, sendWelcomeEmail } from '../services/customAuthEmails';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/lib/notify';
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
  signInWithGoogle: async () => { },
  logout: async () => { },
  login: async (email: string, password: string) => { },
  signup: async (email: string, password: string, firstName?: string, lastName?: string) => { },
  resetPassword: async (email: string) => { },
  resendVerificationEmail: async () => { },
  updateUserProfile: async () => { },
  completeProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async user => {
      setCurrentUser(user);

      // Unsubscribe from previous Firestore listener if exists
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (user) {
        // Listen to Firestore changes for real-time updates
        unsubscribeFirestore = onSnapshot(
          doc(db, 'users', user.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data() as UserData;
              setUserData(userData);
              setIsProfileCompleted(userData?.profileCompleted ?? false);

              // Load and apply theme from Firestore if available (only when logged in)
              if (userData?.theme) {
                // Firestore has theme - use it and sync to localStorage
                // Skip if already applied to avoid unnecessary DOM manipulation
                applyTheme(userData.theme as Theme, true);
              } else {
                // No theme in Firestore - check localStorage and current DOM state
                const currentIsDark = document.documentElement.classList.contains('dark');
                const localStorageTheme = loadThemeFromStorage();

                // Determine which theme to use
                let themeToApply: Theme;
                if (localStorageTheme !== 'system') {
                  themeToApply = localStorageTheme;
                } else if (currentIsDark) {
                  // Preserve dark mode if already set in DOM
                  themeToApply = 'dark';
                } else {
                  // Default to light if nothing is set
                  themeToApply = 'light';
                }

                // Apply theme only if different from current state
                applyTheme(themeToApply, true);

                // Save to Firestore for future consistency (non-blocking)
                updateDoc(doc(db, 'users', user.uid), {
                  theme: themeToApply
                }).catch((error) => {
                  console.error('Error saving theme to Firestore:', error);
                  // Non-critical error, continue
                });
              }
            }
            setLoading(false);
          },
          (error) => {
            // Handle permission errors gracefully
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
              console.warn('⚠️ Permission denied when listening to user document. This may be expected if Firestore rules restrict access.');
            } else {
              console.error('Error listening to user document:', error);
            }
            // On error, preserve current theme from DOM or localStorage
            const currentIsDark = document.documentElement.classList.contains('dark');
            const localStorageTheme = loadThemeFromStorage();
            if (localStorageTheme !== 'system') {
              applyTheme(localStorageTheme);
            } else if (currentIsDark) {
              applyTheme('dark');
            }
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setIsProfileCompleted(false);
        // Load theme from localStorage when logged out (pages publiques peuvent forcer le mode clair individuellement)
        const theme = loadThemeFromStorage();
        applyTheme(theme);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const completeProfile = async (profileData: any) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      // Filter out undefined values as Firebase doesn't accept them
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(userRef, {
        ...cleanProfileData,
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

      // Update context state immediately
      setIsProfileCompleted(true);

      // Wait for Firestore snapshot to update the context
      // This ensures that onSnapshot has time to update the context state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Double check that profileCompleted is set in Firestore
      const userDoc = await getDoc(userRef);
      const finalData = userDoc.data();
      if (finalData?.profileCompleted) {
        setIsProfileCompleted(true);

        // Send welcome email after profile completion (non-blocking)
        try {
          const displayName = profileData.firstName && profileData.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : currentUser.displayName || undefined;
          await sendWelcomeEmail(currentUser.email || '', displayName);
          console.log('Welcome email sent successfully');
        } catch (welcomeEmailError) {
          console.warn('Welcome email failed (non-critical):', welcomeEmailError);
        }

        navigate('/hub');
        notify.success('Profile completed successfully!');
      } else {
        // If profileCompleted is not set, try again
        console.warn('Profile completed flag not set, retrying...');
        await updateDoc(userRef, {
          profileCompleted: true,
        });
        setIsProfileCompleted(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate('/hub');
        notify.success('Profile completed successfully!');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      notify.error('Failed to complete profile');
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
      // Use custom branded email via Brevo
      const result = await sendCustomPasswordResetEmail(email, window.location.origin + '/login');
      if (!result.success) {
        throw new Error(result.message || 'Failed to send password reset email');
      }
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
      // Use custom branded email via Brevo
      const result = await sendCustomVerificationEmail(
        auth.currentUser.email || '',
        auth.currentUser.displayName || undefined,
        window.location.origin + '/complete-profile'
      );
      if (!result.success) {
        throw new Error(result.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Resend Verification Email Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      notify.success('Successfully signed out');
    } catch (error) {
      console.error('Sign Out Error:', error);
      notify.error('Failed to sign out');
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
      // Using custom branded email via Brevo
      try {
        const displayName = firstName && lastName ? `${firstName} ${lastName}` : undefined;
        const emailResult = await sendCustomVerificationEmail(
          result.user.email || '',
          displayName,
          window.location.origin + '/complete-profile'
        );
        if (emailResult.success) {
          console.log('Custom verification email sent successfully via Brevo');
        } else {
          console.warn('Custom email failed, verification may still work:', emailResult.message);
        }
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
