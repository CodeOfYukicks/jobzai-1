import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children?: React.ReactNode;
  requireProfileCompleted?: boolean;
}

export default function PrivateRoute({ children, requireProfileCompleted = true }: PrivateRouteProps) {
  const { currentUser, loading, isProfileCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isGoogleUser = currentUser.providerData.some(
    (provider) => provider.providerId === 'google.com'
  );
  const isCompletingProfile = location.pathname === '/complete-profile';

  if (!currentUser.emailVerified && !isGoogleUser && !isCompletingProfile) {
    return <Navigate to="/verify-email" replace />;
  }

  if (requireProfileCompleted && !isProfileCompleted && !isCompletingProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (isCompletingProfile && isProfileCompleted) {
    return <Navigate to="/hub" replace />;
  }

  return (
    <>
      {children || <Outlet />}
    </>
  );
}
