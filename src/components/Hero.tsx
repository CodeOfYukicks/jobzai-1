import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useEffect, useState, useRef } from 'react';
import { FileText, Calendar, Sparkles, Target, Mail, Star } from 'lucide-react';

interface FloatingElementProps {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  barColor: string;
  delay: number;
  x: string | number;
  y: string | number;
  rotation?: number;
  scale?: number;
}

const FloatingElement = ({ icon: Icon, color, bgColor, barColor, delay, x, y, rotation = 0, scale = 1 }: FloatingElementProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: 1,
        scale: scale,
        x: x,
        y: y,
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        type: "spring",
        stiffness: 50
      }}
      className="absolute flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: bgColor,
        zIndex: 0,
        rotate: rotation,
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: barColor }}
      />
      <Icon size={32} color={color} strokeWidth={1.5} />
    </motion.div>
  );
};

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

  const floatingElements = [
    {
      icon: Mail,
      color: "#059669",
      bgColor: "#ECFDF5",
      barColor: "#10B981",
      x: "-500px",
      y: "-100px",
      delay: 0.2,
      rotation: -12,
    },
    {
      icon: Calendar,
      color: "#DC2626",
      bgColor: "#FEF2F2",
      barColor: "#EF4444",
      x: "500px",
      y: "-100px",
      delay: 0.3,
      rotation: 12,
    },
    {
      icon: FileText,
      color: "#2563EB",
      bgColor: "#EFF6FF",
      barColor: "#3B82F6",
      x: "-560px",
      y: "100px",
      delay: 0.4,
      rotation: -15,
    },
    {
      icon: Target,
      color: "#D97706",
      bgColor: "#FFFBEB",
      barColor: "#F59E0B",
      x: "560px",
      y: "100px",
      delay: 0.5,
      rotation: 15,
      scale: 0.9
    }
  ];

  return (
    <div id="home" className="relative bg-white min-h-screen flex flex-col items-center pt-20 md:pt-24 pb-8 md:pb-16 overflow-x-hidden">

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center">

        {/* Content Wrapper */}
        <div className="relative z-10 max-w-4xl mx-auto text-center pointer-events-none">
          {/* Floating Elements - Hidden on mobile */}
          <div className="absolute inset-0 hidden lg:flex items-center justify-center z-[-1] pointer-events-none">
            {floatingElements.map((el, index) => (
              <div key={index} className="absolute">
                <FloatingElement {...el} />
              </div>
            ))}
          </div>

          {/* Trust Badge - Rendered instantly (no animation delay) */}
          <div className="mt-6 md:mt-16 mb-3 md:mb-4 pointer-events-auto">
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-100 text-gray-600 text-xs md:text-sm font-medium">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></span>
              Trusted by 20,000+ job seekers
            </span>
          </div>

          {/* Main Headline - LCP Element - NO ANIMATION for instant render */}
          <h1
            className="text-[2.5rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 mb-4 md:mb-6 pointer-events-auto"
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}
          >
            Stop applying.
            <br />
            <span className="text-gray-900">Start getting answers.</span>
          </h1>

          {/* Subtitle - Instant render */}
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-xl md:max-w-2xl mx-auto mb-5 md:mb-8 leading-relaxed pointer-events-auto px-2">
            <span className="hidden md:inline">
              <span className="font-semibold text-gray-900">Send</span> high-quality personalized spontaneous applications — at scale.
              <br />
              <span className="font-semibold text-gray-900">Track</span> every lead. <span className="font-semibold text-gray-900">Prepare</span> smarter. <span className="font-semibold text-gray-900">Get</span> more interviews.
            </span>
            <span className="md:hidden">
              AI writes and sends personalized applications for you. Track. Prepare. Get hired.
            </span>
          </p>

          {/* CTAs - Instant render */}
          <div className="flex flex-row items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6 pointer-events-auto">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center h-11 md:h-12 px-5 md:px-8 text-sm md:text-[16px] font-semibold text-white bg-[#000000] hover:bg-[#333333] rounded-xl md:rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get started free
            </Link>
            <button
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center h-11 md:h-12 px-5 md:px-8 text-sm md:text-[16px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl md:rounded-lg transition-all duration-200"
            >
              How it works
            </button>
          </div>

          {/* Mini Social Proof - Instant render */}
          <div className="flex items-center justify-center gap-1.5 mb-6 md:mb-10 pointer-events-auto">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-xs md:text-sm text-gray-500 ml-1">
              <span className="font-semibold text-gray-700">4.9</span> · 20K+ users
            </span>
          </div>
        </div>

        {/* Video Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative w-full z-10"
        >
          <div className="relative rounded-xl md:rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden border border-gray-200/80 bg-white">
            {/* Browser Chrome - Smaller on mobile */}
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-[#f8f8f8] border-b border-gray-100">
              <div className="flex items-center gap-1 md:gap-[6px]">
                <div className="w-2 h-2 md:w-[10px] md:h-[10px] rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                <div className="w-2 h-2 md:w-[10px] md:h-[10px] rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                <div className="w-2 h-2 md:w-[10px] md:h-[10px] rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
              </div>
            </div>

            {/* Video Content */}
            <div className="relative bg-gray-50">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}

              {/* Play/Pause Button - Smaller on mobile */}
              {videoUrl && (
                <button
                  onClick={togglePlay}
                  className="absolute bottom-3 md:bottom-6 left-3 md:left-6 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/90 backdrop-blur hover:bg-white rounded-full shadow-lg border border-gray-200/50 transition-all duration-200"
                >
                  {isPlaying ? (
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 md:w-4 md:h-4 ml-0.5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Subtle shadow underneath */}
          <div className="absolute -inset-x-4 -bottom-4 h-24 -z-10 bg-gradient-to-b from-transparent to-gray-100/60 blur-2xl"></div>
        </motion.div>

        {/* Company Logos Section - Deferred loading */}
        {showLogos && (
          <div className="mt-12 md:mt-24 w-full animate-fade-in">
            <p className="text-center text-xs md:text-sm text-gray-500 mb-4 md:mb-8 uppercase tracking-wider font-semibold">
              Our users landed offers at
            </p>

            {/* Logo Marquee */}
            <div className="relative overflow-hidden py-2 md:py-4">
              {/* Fade gradients */}
              <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

              {/* Marquee track */}
              <div
                className="flex items-center gap-10 md:gap-20 animate-marquee"
                style={{
                  width: 'max-content',
                }}
              >
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex items-center gap-10 md:gap-20">
                    <img src="https://img.logo.dev/google.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Google" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/apple.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Apple" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/microsoft.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Microsoft" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/amazon.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Amazon" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/netflix.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Netflix" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/jpmorgan.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="JPMorgan" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/spotify.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Spotify" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/tesla.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Tesla" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/adobe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Adobe" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/stripe.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Stripe" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/uber.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Uber" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                    <img src="https://img.logo.dev/airbnb.com?token=pk_X4tX0jIHR9eTOuPeazGMYg" alt="Airbnb" className="h-6 md:h-10 w-auto opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* CSS for marquee animation */}
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 30s linear infinite;
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
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
}
