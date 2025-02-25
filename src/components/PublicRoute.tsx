import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D75E6]"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connect├®, rediriger vers le dashboard
  if (currentUser) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
} 
