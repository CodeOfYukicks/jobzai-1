import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Minimalist coin icon component
const CoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Feature descriptions for tooltips
const featureDescriptions: Record<string, string> = {
  'Basic page access': 'Access core features to explore the platform and start your job search.',
  'Access to Job Board': 'Browse thousands of job listings from top companies, updated daily.',
  'Application Tracking': 'Keep track of all your applications in one organized dashboard.',
  'Calendar Follow-up View': 'Never miss a follow-up with integrated calendar reminders.',
  'Full Interview Prep': 'Access comprehensive interview preparation materials and tips.',
  '1 Resume Analysis / month': 'Get AI-powered feedback to improve your resume.',
  '4 Resume Templates': 'Choose from professionally designed resume templates.',
  'Professional Profile': 'Build a compelling professional profile to showcase your skills.',
  'Analytics Dashboard': 'Track your job search performance with detailed analytics.',
  'Personalized Job Board': 'Get job recommendations tailored to your skills and preferences.',
  'Track Applications + Outreach': 'Manage both job applications and networking outreach in one place.',
  '2 Mock Interviews / month': 'Practice with AI-powered mock interviews to build confidence.',
  '10 Resume Analyses / month': 'Get unlimited AI feedback to perfect your resume.',
  'Premium Resume Templates': 'Access exclusive premium resume designs.',
  '2 Campaigns (200 contacts)': 'Launch targeted outreach campaigns to hiring managers.',
  'AI Recommendations': 'Receive smart suggestions to optimize your job search strategy.',
  'Priority Support': 'Get faster responses from our dedicated support team.',
  'AI Interview Coaching': 'Personalized AI coaching to ace any interview question.',
  '5 Mock Interviews / month': 'More practice sessions to master your interview skills.',
  '20 Resume Analyses / month': 'Comprehensive resume optimization for every application.',
  '5 Campaigns (500 contacts)': 'Scale your outreach with larger campaign capacity.',
};

const pricingTiers = [
  {
    name: 'Free',
    price: { monthly: 0, biMonthly: 0 },
    credits: '10 credits',
    description: 'Start your job search journey with essential tools',
    features: [
      'Basic page access',
      '1 Resume Analysis / month',
    ],
    cta: 'Sign up',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Premium',
    price: { monthly: 39, biMonthly: 75 },
    credits: '250 credits',
    description: 'Supercharge your applications with AI power',
    features: [
      'Personalized Job Board',
      'Track Applications + Outreach',
      'Calendar Follow-up View',
      'Full Interview Prep',
      '2 Mock Interviews / month',
      '10 Resume Analyses / month',
      'Premium Resume Templates',
      '2 Campaigns (200 contacts)',
      'AI Recommendations',
      'Priority Support',
    ],
    cta: 'Get started',
    popular: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Pro',
    price: { monthly: 79, biMonthly: 139 },
    credits: '500 credits',
    description: 'The ultimate toolkit for ambitious professionals',
    features: [
      'Personalized Job Board',
      'Track Applications + Outreach',
      'Calendar Follow-up View',
      'AI Interview Coaching',
      '5 Mock Interviews / month',
      '20 Resume Analyses / month',
      'Premium Resume Templates',
      '5 Campaigns (500 contacts)',
      'AI Recommendations',
      'Priority Support',
    ],
    cta: 'Get started',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PricingSection() {
  const [isBiMonthly, setIsBiMonthly] = useState(false);
  const [activeSlide, setActiveSlide] = useState(1); // Start with Premium (index 1)
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handle scroll to update active indicator
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveSlide(Math.min(Math.max(newIndex, 0), pricingTiers.length - 1));
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to Premium card on mount (mobile only)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      const cardWidth = carousel.offsetWidth;
      carousel.scrollTo({ left: cardWidth * 1, behavior: 'auto' });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Pricing card component to avoid duplication
  const PricingCard = ({ tier, index, isMobile = false }: { tier: typeof pricingTiers[0], index: number, isMobile?: boolean }) => (
    <div
      className={`bg-[#f6f5f4] rounded-2xl p-6 md:p-8 relative transition-all duration-300 ${!isMobile ? 'hover:scale-[1.02]' : ''} grid h-full`}
      style={{
        gridTemplateRows: 'auto auto auto auto 1fr',
        minHeight: isMobile ? '420px' : undefined
      }}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 text-white text-[11px] font-medium rounded-full uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: '#220041' }}>
            Most Popular
          </span>
        </div>
      )}

      {/* Row 1: Title + Description */}
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1 text-gray-900">
          {tier.name} Cubbber
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {tier.description}
        </p>
      </div>

      {/* Row 2: Price + Credits */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl md:text-5xl font-black text-gray-900">
            €{isBiMonthly ? tier.price.biMonthly : tier.price.monthly}
          </span>
          <span className="text-sm font-medium text-gray-500">
            {tier.price.monthly === 0 ? '/forever' : isBiMonthly ? '/2 months' : '/month'}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-200/80 text-gray-600">
          <CoinIcon className="w-3.5 h-3.5" />
          <span>{tier.credits}/month</span>
        </div>
      </div>

      {/* Row 3: CTA Button */}
      <Link
        to="/signup"
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all text-center mb-5 block ${tier.popular
          ? 'text-white hover:opacity-90'
          : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
        style={tier.popular ? { backgroundColor: '#220041' } : undefined}
      >
        {tier.cta}
      </Link>

      {/* Row 4: Features list */}
      <div className="space-y-3">
        <p className="text-[13px] font-bold text-gray-900">
          {index === 0 ? 'Includes:' : `Everything in ${pricingTiers[index - 1].name} +`}
        </p>
        <ul className="space-y-2">
          {tier.features.slice(0, isMobile ? 5 : tier.features.length).map((feature) => (
            <li key={feature} className="group relative flex items-start gap-2 text-[13px] leading-tight text-gray-600">
              <span className="mt-0.5 flex-shrink-0" style={{ color: '#220041' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>{feature}</span>
            </li>
          ))}
          {isMobile && tier.features.length > 5 && (
            <li className="text-[13px] text-gray-400 pl-6">
              +{tier.features.length - 5} more features
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <section id="pricing" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            One tool for your whole career.
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center mt-8 md:mt-12">
            <div className="inline-flex items-center bg-[#f0f0f0] p-1 rounded-full">
              <button
                onClick={() => setIsBiMonthly(false)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-bold transition-all duration-200 ${!isBiMonthly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Pay monthly
              </button>
              <button
                onClick={() => setIsBiMonthly(true)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-bold transition-all duration-200 flex items-center gap-1 md:gap-2 ${isBiMonthly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>Pay every 2 months</span>
                <span className="font-medium" style={{ color: '#220041' }}>save ~10%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div
            ref={carouselRef}
            className="flex items-stretch overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {pricingTiers.map((tier, index) => (
              <div
                key={tier.name}
                className="flex-shrink-0 w-[85vw] snap-center pr-3 first:pl-0 flex"
                style={{ scrollSnapAlign: 'center', height: '520px' }}
              >
                <div className={`pt-4 ${tier.popular ? 'pt-6' : ''} flex-1 flex`}>
                  <div className="flex-1">
                    <PricingCard tier={tier} index={index} isMobile={true} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {pricingTiers.map((tier, index) => (
              <button
                key={tier.name}
                onClick={() => {
                  const carousel = carouselRef.current;
                  if (carousel) {
                    const cardWidth = carousel.querySelector('div')?.offsetWidth || 0;
                    carousel.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === index
                  ? 'w-6 bg-gray-900'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                aria-label={`Go to ${tier.name} plan`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div key={tier.name} className={`${tier.popular ? 'pt-3' : 'pt-6'}`}>
              <PricingCard tier={tier} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
