import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BouncingLoader from './ui/BouncingLoader';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#333234]">
        <BouncingLoader />
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
