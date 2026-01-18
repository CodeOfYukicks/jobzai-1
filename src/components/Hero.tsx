import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function Hero() {
  const [showLogos, setShowLogos] = useState(false);
  const { t } = useTranslation();

  // Defer logo loading to not block critical render path
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setShowLogos(true));
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setShowLogos(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToFeatures = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const section = document.getElementById('features');
    if (section) {
      const navHeight = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Hero Section - Dark Green Background */}
      <section
        id="home"
        className="relative pt-24 pb-8 md:pt-28 md:pb-12 lg:pt-32 lg:pb-16 overflow-hidden mx-3 md:mx-4 lg:mx-6 mt-3 rounded-[24px] md:rounded-[32px]"
        style={{
          backgroundColor: '#004b23',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.2), 0 4px 30px rgba(0,0,0,0.1)'
        }}
      >

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Two Column Grid - Stack on mobile, side by side on lg+ */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-12 xl:gap-16 lg:items-center">

            {/* Left Column - Text Content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left mt-4 lg:mt-0">

              {/* Main Headline - Huntr Style */}
              <div className="mb-5 md:mb-8">
                {/* First line - lighter, smaller */}
                <p
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-medium text-white/90 mb-1 md:mb-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {t('hero.headline1')}
                </p>
                {/* Second line - bigger, bolder */}
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.1 }}
                >
                  {t('hero.headline2')}
                </h1>
              </div>

              {/* Subtitle - larger, more readable */}
              <p className="text-lg md:text-xl lg:text-xl text-white/80 max-w-md mb-8 md:mb-10 leading-relaxed font-light">
                {t('hero.subtitle1')} {t('hero.subtitle2')}
              </p>

              {/* CTAs - Superhuman style */}
              <div className="flex flex-row items-center justify-center lg:justify-start gap-4 mb-6 md:mb-8">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 h-11 md:h-12 px-5 md:px-6 text-sm font-bold text-[#004b23] bg-[#9EF01A] hover:bg-[#8BE009] rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  {t('hero.ctaPrimary')}
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="inline-flex items-center justify-center h-11 md:h-12 px-5 md:px-6 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-full transition-all duration-200 shadow-sm hover:shadow"
                >
                  {t('hero.ctaSecondary')}
                </button>
              </div>

              {/* Mini Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
                  ))}
                </div>
                <span className="text-sm md:text-base text-white/80 ml-1">
                  <span className="font-semibold text-white">4.9</span> · {t('hero.socialProof')}
                </span>
              </div>
            </div>

            {/* Right Column - Wistia Video Player */}
            <div className="relative mt-10 lg:mt-0 lg:translate-x-10 xl:translate-x-16">
              {/* Premium Container with Glassmorphism */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-3xl blur-2xl opacity-50" />

                {/* Video Container */}
                <div
                  className="relative rounded-lg md:rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Wistia Player */}
                  <div className="relative bg-gray-900">
                    <style dangerouslySetInnerHTML={{
                      __html: `
                      wistia-player[media-id='vrx34hsq5n']:not(:defined) { 
                        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/vrx34hsq5n/swatch'); 
                        display: block; 
                        filter: blur(5px); 
                        padding-top: 56.25%; 
                      }
                    `}} />
                    {/* @ts-ignore - Wistia custom element */}
                    <wistia-player media-id="vrx34hsq5n" aspect="1.7777777777777777"></wistia-player>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Company Logos Section - White background */}
      {showLogos && (
        <div className="bg-white py-8 md:py-12 w-full animate-fade-in border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Flex layout: text left, logos marquee right */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">

              {/* Left: Text */}
              <p className="text-sm md:text-base text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
                {t('hero.logoSection')}
              </p>

              {/* Right: Logo Marquee */}
              <div className="relative overflow-hidden flex-1">
                {/* Fade gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                {/* Marquee track */}
                <div
                  className="flex items-center gap-8 md:gap-14 animate-marquee"
                  style={{ width: 'max-content' }}
                >
                  {[...Array(2)].map((_, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-8 md:gap-14">
                      <img src="https://img.logo.dev/google.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Google" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/apple.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Apple" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/microsoft.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Microsoft" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/amazon.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Amazon" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/netflix.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Netflix" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/jpmorgan.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="JPMorgan" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/spotify.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Spotify" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/tesla.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Tesla" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/adobe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Adobe" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/stripe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Stripe" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/uber.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Uber" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                      <img src="https://img.logo.dev/airbnb.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Airbnb" className="h-8 w-auto grayscale hover:scale-110 transition-transform duration-300" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .video-hero-transform {
          transform: none;
        }
        @media (min-width: 1024px) {
          .video-hero-transform {
            transform: translateX(60px) translateY(40px) scale(1.1);
            transform-origin: top left;
          }
        }
        @media (min-width: 1280px) {
          .video-hero-transform {
            transform: translateX(80px) translateY(40px) scale(1.15);
            transform-origin: top left;
          }
        }
      `}</style>
    </>
  );
}
