import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useEffect, useState, useRef } from 'react';
import { FileText, Calendar, Sparkles, Target, Mail } from 'lucide-react';

interface FloatingElementProps {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  delay: number;
  x: string | number;
  y: string | number;
  rotation?: number;
  scale?: number;
}

const FloatingElement = ({ icon: Icon, color, bgColor, delay, x, y, rotation = 0, scale = 1 }: FloatingElementProps) => {
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
      className="absolute hidden lg:flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: bgColor,
        zIndex: 0,
        rotate: rotation,
      }}
    >
      <motion.div
        animate={{ 
          y: [-8, 8, -8],
          rotate: [0, 5, 0, -5, 0]
        }}
        transition={{ 
          duration: 6, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: delay + 1
        }}
      >
        <Icon size={40} color={color} strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
};

export default function Hero() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
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
      icon: FileText,
      color: "#2563EB", // Blue 600
      bgColor: "#DBEAFE", // Blue 100
      x: "-380px",
      y: "-80px",
      delay: 0.2,
      rotation: -12,
    },
    {
      icon: Calendar,
      color: "#DC2626", // Red 600
      bgColor: "#FEE2E2", // Red 100
      x: "380px",
      y: "-100px",
      delay: 0.3,
      rotation: 12,
    },
    {
      icon: Sparkles,
      color: "#9333EA", // Purple 600
      bgColor: "#F3E8FF", // Purple 100
      x: "-320px",
      y: "140px",
      delay: 0.4,
      rotation: -6,
      scale: 0.9
    },
    {
      icon: Target,
      color: "#D97706", // Amber 600
      bgColor: "#FEF3C7", // Amber 100
      x: "340px",
      y: "120px",
      delay: 0.5,
      rotation: 8,
      scale: 0.9
    },
    {
      icon: Mail,
      color: "#059669", // Emerald 600
      bgColor: "#D1FAE5", // Emerald 100
      x: "0px",
      y: "-180px",
      delay: 0.6,
      rotation: 0,
      scale: 0.8
    }
  ];

  return (
    <div id="home" className="relative bg-white min-h-screen flex flex-col items-center pt-24 pb-16 overflow-hidden">
      
      {/* Decorative Grid Background - Optional but adds to Notion feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative w-full max-w-7xl mx-auto px-6 flex flex-col items-center">
        
        {/* Floating Elements Container - Centered relative to content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] pointer-events-none z-0">
          {floatingElements.map((el, index) => (
            <div key={index} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <FloatingElement {...el} />
            </div>
          ))}
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200 text-gray-700 text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Now with AI-powered job matching
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6"
          >
            Your job search.
            <br />
            <span className="text-gray-900">Supercharged.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Send hundreds of personalized applications in minutes.
            <br className="hidden sm:block" />
            Then track, optimize, and prepare for interviews — all from one dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Link 
              to="/signup"
              className="inline-flex items-center justify-center h-12 px-8 text-[16px] font-semibold text-white bg-[#000000] hover:bg-[#333333] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get started free
            </Link>
            <button
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center h-12 px-8 text-[16px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              See how it works
            </button>
          </motion.div>
        </div>

        {/* Video Preview - Full Width like Notion */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative w-full mt-2 z-10"
        >
          <div className="relative rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden border border-gray-200/80 bg-white">
            {/* Browser Chrome - macOS style */}
            <div className="flex items-center gap-3 px-4 py-2 bg-[#f8f8f8] border-b border-gray-100">
              {/* Traffic lights */}
              <div className="flex items-center gap-[6px]">
                <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                <div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                <div className="w-[10px] h-[10px] rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
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
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Play/Pause Button */}
              {videoUrl && (
                <button
                  onClick={togglePlay}
                  className="absolute bottom-6 left-6 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur hover:bg-white rounded-full shadow-lg border border-gray-200/50 transition-all duration-200"
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-0.5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
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

        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-24 w-full max-w-4xl mx-auto"
        >
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-semibold">
            Trusted by job seekers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* Improved placeholder logos */}
            <div className="h-8 w-24 bg-gray-800/20 rounded"></div>
            <div className="h-8 w-28 bg-gray-800/20 rounded"></div>
            <div className="h-9 w-9 bg-gray-800/20 rounded-full"></div>
            <div className="h-8 w-32 bg-gray-800/20 rounded"></div>
            <div className="h-8 w-24 bg-gray-800/20 rounded"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
