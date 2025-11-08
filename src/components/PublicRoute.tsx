import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D75E6]"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Permettre l'accès à /verify-email même si l'utilisateur est connecté
  const isVerifyEmailPage = location.pathname === '/verify-email';
  
  // Si l'utilisateur est connecté et son email est vérifié, rediriger vers le hub
  // Sauf pour la page de vérification d'email
  if (currentUser && currentUser.emailVerified && !isVerifyEmailPage) {
    return <Navigate to="/hub" replace />;
  }

  // Si l'utilisateur est connecté mais son email n'est pas vérifié et on n'est pas sur /verify-email
  // On laisse passer pour que PrivateRoute gère la redirection
  if (currentUser && !currentUser.emailVerified && !isVerifyEmailPage) {
    // On laisse passer pour que PrivateRoute gère la redirection vers /verify-email
  }

  return <>{children}</>;
} 
