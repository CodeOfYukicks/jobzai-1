import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

// Minimalist coin icon component
const CoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const pricingTiers = [
  {
    nameKey: 'pricing.plans.free.name',
    price: { monthly: 0, biMonthly: 0 },
    credits: '10',
    descriptionKey: 'pricing.plans.free.description',
    features: [
      'pricing.features.basicPageAccess',
      'pricing.features.resumeAnalysis1',
    ],
    ctaKey: 'pricing.plans.free.cta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nameKey: 'pricing.plans.premium.name',
    price: { monthly: 39, biMonthly: 75 },
    credits: '250',
    descriptionKey: 'pricing.plans.premium.description',
    features: [
      'pricing.features.personalizedJobBoard',
      'pricing.features.trackApplicationsOutreach',
      'pricing.features.calendarFollowUp',
      'pricing.features.fullInterviewPrep',
      'pricing.features.mockInterviews2',
      'pricing.features.resumeAnalyses10',
      'pricing.features.premiumResumeTemplates',
      'pricing.features.campaigns2',
      'pricing.features.aiRecommendations',
      'pricing.features.prioritySupport',
    ],
    ctaKey: 'pricing.plans.premium.cta',
    popular: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    nameKey: 'pricing.plans.pro.name',
    price: { monthly: 79, biMonthly: 139 },
    credits: '500',
    descriptionKey: 'pricing.plans.pro.description',
    features: [
      'pricing.features.personalizedJobBoard',
      'pricing.features.trackApplicationsOutreach',
      'pricing.features.calendarFollowUp',
      'pricing.features.aiInterviewCoaching',
      'pricing.features.mockInterviews5',
      'pricing.features.resumeAnalyses20',
      'pricing.features.premiumResumeTemplates',
      'pricing.features.campaigns5',
      'pricing.features.aiRecommendations',
      'pricing.features.prioritySupport',
    ],
    ctaKey: 'pricing.plans.pro.cta',
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
  const { t } = useTranslation();

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
      className={`bg-white rounded-3xl p-7 md:p-8 relative transition-all duration-300 grid h-full ${tier.popular
        ? 'shadow-[0_0_40px_-10px_rgba(158,240,26,0.3)] scale-[1.02] border-2 border-[#9EF01A] z-10'
        : 'shadow-xl border border-[#004B23]/5'
        } ${!isMobile && !tier.popular ? 'hover:shadow-2xl hover:scale-[1.01] hover:border-[#004B23]/10' : ''}`}
      style={{
        gridTemplateRows: 'auto auto auto auto 1fr',
        minHeight: isMobile ? '420px' : undefined
      }}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-5 py-2 bg-[#9EF01A] text-[#004B23] text-[11px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg">
            {t('pricing.mostPopular')}
          </span>
        </div>
      )}

      {/* Row 1: Title + Description */}
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-2 text-[#004B23]">
          {t(tier.nameKey)}
        </h3>
        <p className="text-sm text-[#004B23]/70 leading-relaxed">
          {t(tier.descriptionKey)}
        </p>
      </div>

      {/* Row 2: Price + Credits */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-[13px] text-[#004B23]/60 font-medium">€</span>
          <span className="text-5xl md:text-6xl font-bold text-[#004B23] tracking-tight">
            {isBiMonthly ? tier.price.biMonthly : tier.price.monthly}
          </span>
          <span className="text-sm font-medium text-[#004B23]/50 ml-1">
            {tier.price.monthly === 0 ? t('pricing.forever') : isBiMonthly ? t('pricing.per2Months') : t('pricing.perMonth')}
          </span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#004B23]/5 text-[#004B23]"
        >
          <CoinIcon className="w-3.5 h-3.5" />
          <span>{tier.credits} {t('pricing.creditsPerMonth')}</span>
        </div>
      </div>

      {/* Row 3: CTA Button */}
      <Link
        to="/signup"
        className={`w-full py-3.5 rounded-full text-sm font-bold transition-all text-center mb-6 block ${tier.popular
          ? 'bg-[#007200] text-white hover:bg-[#004B23] shadow-lg shadow-[#007200]/20'
          : 'bg-white text-[#004B23] border-2 border-[#004B23]/10 hover:border-[#004B23] hover:bg-[#004B23]/5'
          }`}
      >
        {t(tier.ctaKey)}
      </Link>

      {/* Row 4: Features list */}
      <div className="space-y-4">
        <p className="text-sm font-bold text-[#004B23]">
          {index === 0 ? t('pricing.includes') : `${t('pricing.everythingIn')} ${t(pricingTiers[index - 1].nameKey)} ${t('pricing.plus')}`}
        </p>
        <ul className="space-y-2">
          {tier.features.slice(0, isMobile ? 7 : tier.features.length).map((featureKey) => (
            <li key={featureKey} className="group relative flex items-start gap-2 text-[12px] leading-tight text-[#004B23]/80">
              <span className="w-3.5 h-3.5 rounded-full bg-[#38B000]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-2 h-2 text-[#38B000]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>{t(featureKey)}</span>
            </li>
          ))}
          {isMobile && tier.features.length > 7 && (
            <li className="text-[11px] text-gray-400 pl-5">
              +{tier.features.length - 7} {t('pricing.more')}
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <section id="pricing" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        {/* Sticker 5: OK Hand - Outside container, on top of border */}
        <img
          src="/images/stickers/5.png"
          alt=""
          className="absolute -top-6 -right-0 md:-right-2 w-20 md:w-28 lg:w-36 rotate-[15deg] z-30 pointer-events-none hidden md:block"
        />
        {/* Rounded container */}
        <div
          className="rounded-3xl md:rounded-[40px] px-4 md:px-8 lg:px-12 py-12 md:py-16 relative overflow-hidden"
        >
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/images/pricing-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Subtle overlay for readability */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 relative z-10">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('pricing.title')}
            </h2>
            <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
              {t('pricing.subtitle')}
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center mt-10 md:mt-12">
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                <button
                  onClick={() => setIsBiMonthly(false)}
                  className={`px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!isBiMonthly
                    ? 'bg-[#007200] text-white shadow-sm'
                    : 'text-[#004B23]/70 hover:text-[#004B23]'
                    }`}
                >
                  {t('pricing.payMonthly')}
                </button>
                <button
                  onClick={() => setIsBiMonthly(true)}
                  className={`px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${isBiMonthly
                    ? 'bg-[#007200] text-white shadow-sm'
                    : 'text-[#004B23]/70 hover:text-[#004B23]'
                    }`}
                >
                  <span>{t('pricing.payBiMonthly')}</span>
                  <span className={`${isBiMonthly ? 'text-[#9EF01A]' : 'text-[#007200]'} font-bold`}>{t('pricing.save')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative z-10">
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
                  key={tier.nameKey}
                  className="flex-shrink-0 w-[85vw] snap-center pr-3 first:pl-0 flex"
                  style={{ scrollSnapAlign: 'center', minHeight: 'auto' }}
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
                  key={tier.nameKey}
                  onClick={() => {
                    const carousel = carouselRef.current;
                    if (carousel) {
                      const cardWidth = carousel.querySelector('div')?.offsetWidth || 0;
                      carousel.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === index
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/70'
                    }`}
                  aria-label={`Go to ${t(tier.nameKey)} plan`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4 max-w-6xl mx-auto relative z-10">
            {pricingTiers.map((tier, index) => (
              <div key={tier.nameKey} className={`${tier.popular ? 'pt-3' : 'pt-6'}`}>
                <PricingCard tier={tier} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
