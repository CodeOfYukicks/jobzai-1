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

  return (
    <div className="space-y-8">
      <div className="relative max-w-sm mx-auto lg:max-w-none">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location..."
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl
            focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]
            transition-all duration-200"
        />
      </div>

      <div className="text-center lg:text-left">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Locations</h3>
        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
          {popularLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocation(loc)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${location === loc 
                  ? 'bg-[#8D75E6] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-6 max-w-sm mx-auto lg:max-w-none">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => location.trim() && onNext({ location: location.trim() })}
          disabled={!location.trim()}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
