import { useEffect, lazy, Suspense } from 'react';
import Hero from '../components/Hero';
import { forceLightMode } from '../lib/theme';

// Lazy-load below-fold sections to reduce initial bundle
// Note: These all use default exports
const FeatureSection = lazy(() => import('../components/landing/FeatureSection'));
const FinalCTA = lazy(() => import('../components/landing/FinalCTA'));
const PricingSection = lazy(() => import('../components/landing/PricingSection'));
const Footer = lazy(() => import('../components/Footer'));

// Simple loading fallback for below-fold content
const SectionLoader = () => (
  <div className="w-full py-20 flex justify-center">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
  </div>
);

export default function HomePage() {
  // Force light mode on landing page
  useEffect(() => {
    forceLightMode();
  }, []);

  return (
    <div className="bg-[#f6f5f4] overflow-x-hidden">
      {/* Hero Section - Critical, renders immediately */}
      <Hero />

      {/* Below-fold sections - Lazy loaded */}
      <Suspense fallback={<SectionLoader />}>
        <FeatureSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <PricingSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <FinalCTA />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
}

