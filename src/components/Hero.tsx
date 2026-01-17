import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useEffect, useState, useRef } from 'react';
import { Star } from 'lucide-react';

export default function Hero() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLogos, setShowLogos] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    // Defer video loading to not block initial render
    const timer = setTimeout(() => {
      const loadVideo = async () => {
        try {
          const storage = getStorage();
          const videoRef = ref(storage, 'images/campaign_hero.mp4');
          const url = await getDownloadURL(videoRef);
          setVideoUrl(url);
        } catch (error) {
          console.error('Error loading video:', error);
        }
      };
      loadVideo();
    }, 3000); // Load video 3s after initial render

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
      {/* Green Hero Section - Ends where video cuts off */}
      <section id="home" className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden bg-[#B3DE16] rounded-b-[40px] md:rounded-b-[60px]">
        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left Column - Text Content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left mt-4 lg:mt-6">

              {/* Main Headline - Two lines only */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 md:mb-6 whitespace-nowrap"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
              >
                You deserve answers.
                <br />
                We help you get them.
              </h1>

              {/* Subtitle */}
              <p className="text-base md:text-lg lg:text-xl text-gray-800 max-w-xl mb-6 md:mb-8 leading-relaxed">
                Send personalized applications at scale.
                <br className="hidden md:block" />
                Track every lead. Prepare smarter. Get interviews.
              </p>

              {/* CTAs */}
              <div className="flex flex-row items-center justify-center lg:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get started free
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="inline-flex items-center justify-center h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-medium text-gray-900 bg-white hover:bg-gray-50 rounded-full transition-all duration-200 shadow-md"
                >
                  How it works
                </button>
              </div>

              {/* Mini Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-gray-900 fill-gray-900" />
                  ))}
                </div>
                <span className="text-sm md:text-base text-gray-800 ml-1">
                  <span className="font-semibold text-gray-900">4.9</span> · 20K+ users
                </span>
              </div>
            </div>

            {/* Right Column - Video Preview */}
            <div className="relative video-hero-transform flex items-end justify-center lg:justify-end h-full mt-6 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative w-full lg:w-[120%] lg:-mr-[10%] lg:translate-y-12"
              >
                {/* Video directly with rounded corners and shadow */}
                <div className="relative rounded-2xl lg:rounded-t-xl lg:rounded-b-none shadow-2xl overflow-hidden mx-4 lg:mx-0">
                  {videoUrl ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto block"
                    >
                      <source src={videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="aspect-[16/9] bg-gray-900/10 flex items-center justify-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 border-3 border-gray-900/20 border-t-gray-900 rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Play/Pause Button */}
                  {videoUrl && (
                    <button
                      onClick={togglePlay}
                      className="absolute bottom-3 md:bottom-4 left-3 md:left-4 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-white/30 backdrop-blur-sm hover:bg-white/50 rounded-full shadow-lg transition-all duration-200"
                    >
                      {isPlaying ? (
                        <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 md:w-3.5 md:h-3.5 ml-0.5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Decorative shadow */}
                <div className="absolute -inset-6 -z-10 bg-black/10 rounded-3xl blur-3xl"></div>
              </motion.div>
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
                Our users landed offers at
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
