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
        const logoRef = ref(storage, 'images/logo-only.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    fetchLogo();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Main Content */}
      <main className="flex-1 min-h-screen w-full lg:max-w-[65%] relative flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 lg:right-[35%] bg-white dark:bg-gray-900 z-50 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-[540px] mx-auto px-6 py-4 flex justify-between items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Cubbbe"
                className="h-7 w-auto object-contain"
              />
            ) : (
              <div className="h-7 w-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            )}
            {currentUser?.email && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</span>
            )}
          </div>
        </header>

        {/* Content - Vertically centered */}
        <div className="flex-1 flex flex-col justify-center pt-16 pb-8 px-6">
          <div className={`w-full mx-auto ${title.toLowerCase().includes('subscription') || title.toLowerCase().includes('plan')
            ? 'max-w-5xl' // Full width for subscription page
            : 'max-w-[540px]' // Premium width for other pages
            }`}>
            {/* Step Indicator - Subtle */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Step {currentStep}</span>
                <span className="text-sm text-gray-300 dark:text-gray-600">of {totalSteps}</span>
              </div>
            </div>

            {/* Title and Subtitle */}
            {(title.toLowerCase().includes('subscription') || title.toLowerCase().includes('plan')) ? (
              null
            ) : (
              <div className="mb-10">
                <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-gray-500 dark:text-gray-400 text-[15px]">{subtitle}</p>
                )}
              </div>
            )}

            {/* Form Content - No card, transparent */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Right Side Banner - Desktop only */}
      <div className="hidden lg:block w-[35%] bg-[#004b23] fixed right-0 top-0 bottom-0">
        <div className="h-full flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">
            LET'S SET UP YOUR
            <br />
            <span className="italic text-[#B3DE16]">SHINY</span> NEW ACCOUNT
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
                className="bg-[#B3DE16] rounded-full h-2"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 