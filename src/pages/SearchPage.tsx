import { useSearchParams } from 'react-router-dom';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Search Results
      </h1>
      <p className="text-gray-600 mb-8">
        Showing results for: "{query}"
      </p>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">
          Search results will appear here soon.
        </p>
      </div>
    </div>
  );
} 