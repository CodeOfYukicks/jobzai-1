/**
 * WeatherCard Component
 * Displays real-time weather based on user's geolocation
 * Uses Open-Meteo API (free, no API key required)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, CloudOff } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  timestamp: number;
  latitude: number;
  longitude: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'weatherData';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// WMO Weather interpretation codes
const getWeatherInfo = (code: number): { condition: string; type: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' } => {
  if (code === 0) return { condition: 'Clear sky', type: 'clear' };
  if (code <= 3) return { condition: 'Partly cloudy', type: 'cloudy' };
  if (code <= 49) return { condition: 'Foggy', type: 'cloudy' };
  if (code <= 59) return { condition: 'Drizzle', type: 'rain' };
  if (code <= 69) return { condition: 'Rain', type: 'rain' };
  if (code <= 79) return { condition: 'Snow', type: 'snow' };
  if (code <= 84) return { condition: 'Rain showers', type: 'rain' };
  if (code <= 94) return { condition: 'Snow showers', type: 'snow' };
  if (code <= 99) return { condition: 'Thunderstorm', type: 'storm' };
  return { condition: 'Unknown', type: 'cloudy' };
};

// Weather SVG components for different conditions
const ClearSunSVG = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16">
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" y2="28.33" y1="19.67" x2="21.5" x1="16.5" id="sun-grad">
        <stop stopColor="#fbbf24" offset={0} />
        <stop stopColor="#fbbf24" offset=".45" />
        <stop stopColor="#f59e0b" offset={1} />
      </linearGradient>
    </defs>
    <circle strokeWidth=".5" strokeMiterlimit={10} stroke="#f8af18" fill="url(#sun-grad)" r={12} cy={32} cx={32} />
    <path 
      d="M32 12v-6m0 52v-6m14.14-28.14l4.24-4.24M13.62 50.38l4.24-4.24m0-28.28l-4.24-4.24m36.76 36.76l-4.24-4.24M52 32h6M6 32h6" 
      strokeWidth={3} 
      strokeMiterlimit={10} 
      strokeLinecap="round" 
      stroke="#fbbf24" 
      fill="none"
    >
      <animateTransform values="0 32 32; 360 32 32" type="rotate" repeatCount="indefinite" dur="45s" attributeName="transform" />
    </path>
  </svg>
);

const CloudySVG = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16">
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" y2="50.8" y1="21.96" x2="39.2" x1="22.56" id="cloud-grad">
        <stop stopColor="#f3f7fe" offset={0} />
        <stop stopColor="#f3f7fe" offset=".45" />
        <stop stopColor="#deeafb" offset={1} />
      </linearGradient>
    </defs>
    <path 
      d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z" 
      strokeWidth=".5" 
      strokeMiterlimit={10} 
      stroke="#e6effc" 
      fill="url(#cloud-grad)"
    >
      <animateTransform values="-3 0; 3 0; -3 0" type="translate" repeatCount="indefinite" dur="7s" attributeName="transform" />
    </path>
  </svg>
);

const RainSVG = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16">
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" y2="28.33" y1="19.67" x2="21.5" x1="16.5" id="rain-sun">
        <stop stopColor="#fbbf24" offset={0} />
        <stop stopColor="#fbbf24" offset=".45" />
        <stop stopColor="#f59e0b" offset={1} />
      </linearGradient>
      <linearGradient gradientUnits="userSpaceOnUse" y2="50.8" y1="21.96" x2="39.2" x1="22.56" id="rain-cloud">
        <stop stopColor="#f3f7fe" offset={0} />
        <stop stopColor="#f3f7fe" offset=".45" />
        <stop stopColor="#deeafb" offset={1} />
      </linearGradient>
      <linearGradient gradientUnits="userSpaceOnUse" y2="48.05" y1="42.95" x2="25.47" x1="22.53" id="rain-drop">
        <stop stopColor="#4286ee" offset={0} />
        <stop stopColor="#4286ee" offset=".45" />
        <stop stopColor="#0950bc" offset={1} />
      </linearGradient>
    </defs>
    <circle strokeWidth=".5" strokeMiterlimit={10} stroke="#f8af18" fill="url(#rain-sun)" r={5} cy={24} cx={19} />
    <path 
      d="M19 15.67V12.5m0 23v-3.17m5.89-14.22l2.24-2.24M10.87 32.13l2.24-2.24m0-11.78l-2.24-2.24m16.26 16.26l-2.24-2.24M7.5 24h3.17m19.83 0h-3.17" 
      strokeWidth={2} 
      strokeMiterlimit={10} 
      strokeLinecap="round" 
      stroke="#fbbf24" 
      fill="none"
    >
      <animateTransform values="0 19 24; 360 19 24" type="rotate" repeatCount="indefinite" dur="45s" attributeName="transform" />
    </path>
    <path 
      d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z" 
      strokeWidth=".5" 
      strokeMiterlimit={10} 
      stroke="#e6effc" 
      fill="url(#rain-cloud)" 
    />
    <path d="M24.39 43.03l-.78 4.94" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" stroke="url(#rain-drop)" fill="none">
      <animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" attributeName="transform" />
    </path>
    <path d="M31.39 43.03l-.78 4.94" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" stroke="url(#rain-drop)" fill="none">
      <animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" begin="-0.4s" attributeName="transform" />
    </path>
    <path d="M38.39 43.03l-.78 4.94" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" stroke="url(#rain-drop)" fill="none">
      <animateTransform values="1 -5; -2 10" type="translate" repeatCount="indefinite" dur="0.7s" begin="-0.2s" attributeName="transform" />
    </path>
  </svg>
);

const SnowSVG = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16">
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" y2="50.8" y1="21.96" x2="39.2" x1="22.56" id="snow-cloud">
        <stop stopColor="#f3f7fe" offset={0} />
        <stop stopColor="#f3f7fe" offset=".45" />
        <stop stopColor="#deeafb" offset={1} />
      </linearGradient>
    </defs>
    <path 
      d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z" 
      strokeWidth=".5" 
      strokeMiterlimit={10} 
      stroke="#e6effc" 
      fill="url(#snow-cloud)" 
    />
    <g>
      <circle fill="#96b4db" r={1.5} cy={46} cx={24} />
      <circle fill="#96b4db" r={1.5} cy={50} cx={31} />
      <circle fill="#96b4db" r={1.5} cy={46} cx={38} />
      <animateTransform values="0 -6; 0 8; 0 -6" type="translate" repeatCount="indefinite" dur="1.5s" attributeName="transform" />
    </g>
  </svg>
);

const StormSVG = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16">
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" y2="50.8" y1="21.96" x2="39.2" x1="22.56" id="storm-cloud">
        <stop stopColor="#d4d8dd" offset={0} />
        <stop stopColor="#d4d8dd" offset=".45" />
        <stop stopColor="#b8bdc4" offset={1} />
      </linearGradient>
    </defs>
    <path 
      d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z" 
      strokeWidth=".5" 
      strokeMiterlimit={10} 
      stroke="#b8bdc4" 
      fill="url(#storm-cloud)" 
    />
    <polygon fill="#f6a823" points="30 36 26 48 32 46 28 58 38 44 32 46 36 36">
      <animate values="1; 0.8; 1; 0.6; 1" attributeName="opacity" dur="0.5s" repeatCount="indefinite" />
    </polygon>
  </svg>
);

const WeatherIcon = ({ type }: { type: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' }) => {
  switch (type) {
    case 'clear': return <ClearSunSVG />;
    case 'cloudy': return <CloudySVG />;
    case 'rain': return <RainSVG />;
    case 'snow': return <SnowSVG />;
    case 'storm': return <StormSVG />;
    default: return <CloudySVG />;
  }
};

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchWeather = useCallback(async (location: GeoLocation) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        timestamp: Date.now(),
        latitude: location.latitude,
        longitude: location.longitude,
      };

      // Cache the data
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weatherData));
      } catch (e) {
        // Ignore localStorage errors
      }

      setWeather(weatherData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: WeatherData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setWeather(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        // Fallback to Paris coordinates
        fetchWeather({ latitude: 48.8566, longitude: 2.3522 });
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  }, [fetchWeather]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Loading state
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-[#DCDFE4] dark:bg-[#22272B] rounded-2xl p-4 h-full min-h-[180px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading weather...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !weather) {
    return (
      <div className="relative overflow-hidden bg-[#DCDFE4] dark:bg-[#22272B] rounded-2xl p-4 h-full min-h-[180px] flex flex-col items-center justify-center">
        <CloudOff className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">{error}</span>
        <button
          onClick={getLocation}
          className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const weatherInfo = getWeatherInfo(weather.weatherCode);

  return (
    <motion.div
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden cursor-pointer h-full"
    >
      <motion.div
        animate={{ 
          width: isExpanded ? '100%' : '100%',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          relative overflow-hidden bg-[#DCDFE4] dark:bg-[#22272B] rounded-2xl p-4 h-full min-h-[180px]
          transition-colors duration-300
          ${isExpanded ? 'bg-blue-100 dark:bg-[#0C66E4]' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Today</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
          </div>
        </div>

        {/* Weather Icon */}
        <div className="flex items-center justify-center">
          <WeatherIcon type={weatherInfo.type} />
        </div>

        {/* Temperature */}
        <motion.div 
          className="flex items-center justify-center"
          animate={{
            y: isExpanded ? -8 : 0,
            scale: isExpanded ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-4xl font-bold text-gray-800 dark:text-white">
            {weather.temperature}°
          </span>
        </motion.div>

        {/* Expanded Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isExpanded ? 1 : 0,
            y: isExpanded ? 0 : 10,
          }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-white/80">{weatherInfo.condition}</p>
          <p className="text-xs text-gray-500 dark:text-white/60">{weather.humidity}% humidity</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

