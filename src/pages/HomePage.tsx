import { useEffect } from 'react';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { FeatureSection, FinalCTA } from '../components/landing';
import { forceLightMode } from '../lib/theme';


export default function HomePage() {
  // Force light mode on landing page
  useEffect(() => {
    forceLightMode();
  }, []);

  return (
    <div className="bg-[#f6f5f4]">
      {/* Hero Section */}
      <Hero />

      {/* Features Section with Card Grid */}
      <FeatureSection />


      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
