import { useAuth } from '../contexts/AuthContext';

export default function SmartMatchingPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Smart Matching</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">
          Your job recommendations will appear here soon.
        </p>
      </div>
    </div>
  );
} 