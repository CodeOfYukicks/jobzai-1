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
          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location..."
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl
            bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]
            transition-all duration-200
            shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
            focus:shadow-md dark:focus:shadow-[0_4px_8px_rgba(141,117,230,0.2),0_2px_4px_rgba(0,0,0,0.3)]"
        />
      </div>

      <div className="text-center lg:text-left">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Popular Locations</h3>
        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
          {popularLocations.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocation(loc)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${location === loc 
                  ? 'bg-[#8D75E6] text-white shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
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
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => location.trim() && onNext({ location: location.trim() })}
          disabled={!location.trim()}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-all duration-200
            shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
            hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
