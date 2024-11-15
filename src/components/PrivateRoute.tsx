import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailVerificationPage from '../pages/EmailVerificationPage';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6]"></div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but email not verified - show verification page
  if (!currentUser.emailVerified) {
    return <EmailVerificationPage />;
  }

  // Logged in and verified - render protected content
  return <Outlet />;
}