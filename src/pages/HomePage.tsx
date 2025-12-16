import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import { FeatureSection, FinalCTA } from '../components/landing';
import ShineBorder from '../components/ui/shine-border';
import { forceLightMode } from '../lib/theme';

const tiers = [
  {
    name: 'Free',
    price: '€0',
    period: 'month',
    description: 'Perfect for trying out the basics of Jobz.ai',
    features: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
    cta: 'Try Free',
    href: '/signup',
  },
  {
    name: 'Standard',
    price: '€39',
    period: 'month',
    description: 'Ideal for regular job seekers who need more credits.',
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Email Support',
    ],
    cta: 'Get Started',
    href: '/signup',
    mostPopular: true,
  },
  {
    name: 'Premium',
    price: '€69',
    period: 'month',
    description: 'Designed for power users needing high-volume applications.',
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
    cta: 'Get Started',
    href: '/signup',
    isDark: true,
  },
];

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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#f6f5f4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              Choose the plan that best fits your needs
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div key={tier.name}>
                {tier.name === 'Standard' ? (
                  <ShineBorder
                    borderRadius={16}
                    borderWidth={2}
                    duration={8}
                    color={["#4D3E78", "#7C3AED"]}
                    className="w-full h-full"
                  >
                    <PricingCard {...tier} noBorder />
                  </ShineBorder>
                ) : (
                  <PricingCard {...tier} />
                )}
              </div>
            ))}
          </div>

          {/* FAQ or additional info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-600">
              Need a custom plan for your team?{' '}
              <Link to="/contact" className="text-[#4D3E78] font-semibold hover:underline">
                Contact us
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
