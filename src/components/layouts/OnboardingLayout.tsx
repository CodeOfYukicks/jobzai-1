import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
}

export default function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps,
  title,
  subtitle 
}: OnboardingLayoutProps) {
  const { currentUser } = useAuth();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const logoRef = ref(storage, 'images/logo-dark.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    fetchLogo();
  }, []);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Main Content */}
      <main className="flex-1 min-h-screen w-full lg:max-w-[65%] relative">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 lg:right-[35%] bg-white z-50 border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 lg:max-w-none lg:px-6 flex justify-between items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Jobzai" 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
            )}
            {currentUser?.email && (
              <span className="text-sm text-gray-600">{currentUser.email}</span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="pt-20 px-4 pb-12 max-w-md mx-auto lg:px-8 lg:max-w-2xl">
          {/* Step Indicator */}
          <div className="mb-8 text-center lg:text-left">
            <div className="flex items-baseline justify-center lg:justify-start gap-2">
              <h2 className="text-3xl font-bold">Step {currentStep}</h2>
              <span className="text-xl text-gray-400">/{totalSteps}</span>
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Right Side Banner - Desktop only */}
      <div className="hidden lg:block w-[35%] bg-[#8D75E6] fixed right-0 top-0 bottom-0">
        <div className="h-full flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">
            LET'S SET UP YOUR
            <br />
            <span className="italic">SHINY</span> NEW ACCOUNT
          </h2>
          <p className="text-lg opacity-80">
            Complete your profile to get started with personalized job recommendations and connect with top companies.
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm opacity-80">Profile completion</span>
              <span className="text-sm font-medium">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                className="bg-white rounded-full h-2"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 