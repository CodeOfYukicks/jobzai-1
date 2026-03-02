import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function Hero() {
  const [showLogos, setShowLogos] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  // Trigger entrance animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <>
      {/* ===== HERO SECTION — Centered, Craft-inspired ===== */}
      <section
        id="home"
        className="hero-section relative overflow-hidden mx-3 md:mx-4 lg:mx-6 mt-3 rounded-[24px] md:rounded-[32px]"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            backgroundImage: `url('/images/hero-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />

        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/60 rounded-[inherit]" />

        {/* ===== CENTERED CONTENT ===== */}
        <div className="relative z-10 flex flex-col items-center text-center pt-28 md:pt-36 lg:pt-40 pb-6 md:pb-10 px-4 sm:px-6">

          {/* Headline — clean, confident, no effects */}
          <div className={`hero-reveal hero-delay-1 mb-6 md:mb-8 ${isVisible ? 'hero-revealed' : ''}`}>
            <p
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-gray-800 mb-1 md:mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('hero.headline1')}
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, lineHeight: 1.05 }}
            >
              {t('hero.headline2')}
            </h1>
          </div>

          {/* Subtitle */}
          <p className={`hero-reveal hero-delay-2 text-base md:text-lg text-gray-600 max-w-lg mb-8 md:mb-10 leading-relaxed font-light ${isVisible ? 'hero-revealed' : ''}`}>
            {t('hero.subtitle1')} {t('hero.subtitle2')}
          </p>

          {/* CTA — small, confident */}
          <div className={`hero-reveal hero-delay-3 mb-4 md:mb-5 ${isVisible ? 'hero-revealed' : ''}`}>
            <Link
              to="/signup"
              className="hero-cta group inline-flex items-center gap-2 h-10 md:h-11 px-5 md:px-6 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03]"
            >
              {t('hero.ctaPrimary')}
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Social Proof — minimal */}
          <div className={`hero-reveal hero-delay-4 mb-6 md:mb-8 ${isVisible ? 'hero-revealed' : ''}`}>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50">
              {/* Avatar Stack */}
              <div className="flex -space-x-2">
                {[
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&backgroundColor=c0aede',
                  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
                ].map((src, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">4.9</span> · {t('hero.socialProof')}
                </span>
              </div>
            </div>
          </div>

          {/* ===== PRODUCT SHOWCASE — Full width, THE star ===== */}
          <div className={`hero-reveal hero-delay-5 w-full max-w-5xl mx-auto ${isVisible ? 'hero-revealed' : ''}`}>
            <div
              className="hero-product-frame relative rounded-xl md:rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Wistia Player */}
              <div className="relative bg-gray-100">
                <style dangerouslySetInnerHTML={{
                  __html: `
                  wistia-player[media-id='jepmag5p6q']:not(:defined) { 
                    background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/jepmag5p6q/swatch'); 
                    display: block; 
                    filter: blur(5px); 
                    padding-top: 56.25%; 
                  }
                `}} />
                {/* @ts-ignore - Wistia custom element */}
                <wistia-player media-id="jepmag5p6q" aspect="1.7777777777777777"></wistia-player>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== COMPANY LOGOS — Clean ===== */}
      {showLogos && (
        <div className="bg-white py-8 md:py-12 w-full animate-fade-in border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <p className="text-sm md:text-base text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
                {t('hero.logoSection')}
              </p>

              <div className="relative overflow-hidden flex-1">
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

                <div
                  className="flex items-center gap-8 md:gap-14 animate-marquee"
                  style={{ width: 'max-content' }}
                >
                  {[...Array(2)].map((_, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-8 md:gap-14">
                      <img src="https://img.logo.dev/google.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Google" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/apple.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Apple" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/microsoft.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Microsoft" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/amazon.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Amazon" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/netflix.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Netflix" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/jpmorgan.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="JPMorgan" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/spotify.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Spotify" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/tesla.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Tesla" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/adobe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Adobe" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/stripe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Stripe" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/uber.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Uber" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                      <img src="https://img.logo.dev/airbnb.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Airbnb" className="h-8 w-auto grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500 hover:scale-110" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MINIMAL CSS ===== */}
      <style>{`
        /* ===== REVEAL ANIMATIONS ===== */
        .hero-reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-reveal.hero-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-delay-1 { transition-delay: 0ms; }
        .hero-delay-2 { transition-delay: 150ms; }
        .hero-delay-3 { transition-delay: 280ms; }
        .hero-delay-4 { transition-delay: 400ms; }
        .hero-delay-5 { transition-delay: 550ms; }

        /* ===== PRODUCT FRAME ===== */
        .hero-product-frame {
          transition: transform 0.4s ease;
        }
        .hero-product-frame:hover {
          transform: scale(1.005);
        }

        /* ===== MARQUEE ===== */
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

        /* ===== FADE IN ===== */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </>
  );
}
