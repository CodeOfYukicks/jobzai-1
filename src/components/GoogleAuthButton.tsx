import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/lib/notify';
import { Loader2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';

export default function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signInWithGoogle();
      notify.success('Successfully signed in with Google!');
      navigate('/hub');
    } catch (error: any) {
      console.error('Google auth error:', error);
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          notify.error('Sign in cancelled');
          break;
        case 'auth/popup-blocked':
          notify.error('Please allow popups for this website');
          break;
        case 'auth/account-exists-with-different-credential':
          notify.error('An account already exists with this email');
          break;
        default:
          notify.error('Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <img
            className="h-5 w-5 mr-2"
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
          />
          Continue with Google
        </>
      )}
    </button>
  );
} 
