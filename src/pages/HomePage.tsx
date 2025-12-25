import { useEffect } from 'react';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { FeatureSection, FinalCTA } from '../components/landing';
import PricingSection from '../components/landing/PricingSection';
import { forceLightMode } from '../lib/theme';


export default function HomePage() {
  // Force light mode on landing page
  useEffect(() => {
    forceLightMode();
  }, []);

  return (
    <div className="bg-[#f6f5f4] overflow-x-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Features Section with Card Grid */}
      <FeatureSection />

      {/* Pricing Section */}
      <PricingSection />


      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
