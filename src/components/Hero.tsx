import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [videoUrl, setVideoUrl] = useState<string>('');

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

  return (
    <div id="home" className="relative bg-white min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Now with AI-powered job matching
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6"
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
          className="text-lg sm:text-xl text-gray-900 max-w-2xl mx-auto mb-8"
        >
          Send hundreds of personalized applications in minutes.
          <br />
          Then track, optimize, and prepare for interviews — all from one dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
        >
          <Link 
            to="/signup"
            className="inline-flex items-center justify-center h-11 px-5 text-[15px] font-medium text-white bg-[#0275de] hover:bg-[#0266c7] rounded-lg transition-colors duration-200"
          >
            Get started free
          </Link>
          <button
            onClick={scrollToFeatures}
            className="inline-flex items-center justify-center h-11 px-5 text-[15px] font-medium text-[#0275de] bg-[#e6f3fe] hover:bg-[#d6ebfd] rounded-lg transition-colors duration-200"
          >
            Request a demo
          </button>
        </motion.div>

      </div>

      {/* Video Preview - Full Width like Notion */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="relative w-full max-w-7xl mx-auto mt-2 px-6"
      >
        <div className="relative rounded-xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Browser Chrome - like Notion */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            {/* Traffic lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
            </div>
            {/* Navigation arrows */}
            <div className="flex gap-1 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {/* Tab */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-gray-200 text-sm text-gray-600">
              <div className="w-4 h-4 rounded bg-[#635BFF] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">J</span>
              </div>
              <span>Jobz.ai</span>
            </div>
            <div className="text-gray-400 text-lg">+</div>
          </div>
          
          {/* Video Content */}
          {videoUrl ? (
            <video
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
            <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Subtle shadow underneath */}
        <div className="absolute -inset-x-4 -bottom-4 h-20 -z-10 bg-gradient-to-b from-transparent to-gray-100/50 blur-xl"></div>
      </motion.div>

      {/* Trusted By Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-20 w-full max-w-4xl mx-auto"
      >
        <p className="text-center text-sm text-gray-500 mb-6 uppercase tracking-wider font-medium">
          Trusted by job seekers worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
          {/* Placeholder logos - can be replaced with actual partner/press logos */}
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
          <div className="h-8 w-28 bg-gray-300 rounded"></div>
          <div className="h-8 w-20 bg-gray-300 rounded"></div>
          <div className="h-8 w-32 bg-gray-300 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>
      </motion.div>
    </div>
  );
}
