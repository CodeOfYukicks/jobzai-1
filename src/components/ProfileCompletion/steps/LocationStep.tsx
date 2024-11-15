import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';

interface LocationStepProps {
  value: string;
  onNext: (data: { location: string }) => void;
  onBack: () => void;
}

const popularLocations = [
  'Remote',
  'London, UK',
  'New York, USA',
  'Paris, France',
  'Berlin, Germany',
  'Amsterdam, Netherlands'
];

export default function LocationStep({ value, onNext, onBack }: LocationStepProps) {
  const [location, setLocation] = useState(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onNext({ location: location.trim() });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Preferred Location</h2>
        <p className="mt-1 text-sm text-gray-500">
          Where would you like to work? You can specify a city, country, or "Remote"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Locations</h3>
          <div className="flex flex-wrap gap-2">
            {popularLocations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  location === loc
                    ? 'bg-[#8D75E6] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!location.trim()}
            className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}