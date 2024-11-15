import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WordRotator from './WordRotator';
import FirebaseImage from './FirebaseImage';

export default function Hero() {
  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = document.getElementById('how-it-works');
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
    <div id="home" className="relative isolate overflow-hidden bg-[#8D75E6] min-h-screen flex items-center">
      {/* Grid Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <div className="grid grid-cols-6 h-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border-l border-gray-300/30 h-full">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="border-t border-gray-300/30 h-[calc(100%/6)]" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 lg:px-8 lg:py-32 mt-16 sm:mt-20 lg:mt-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-6 text-center lg:text-left mb-12 lg:mb-0"
          >
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.2] break-words">
              <span className="block mb-2">Revolutionize Your</span>
              <span className="inline-flex flex-wrap items-center gap-x-2 mb-2">
                <WordRotator 
                  words={['Job', 'Internship', 'Apprenticeship']} 
                  className="min-h-[1.2em] inline-block"
                />
                <span>Search</span>
              </span>
              <span className="block">with AI</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-white/90 max-w-lg mx-auto lg:mx-0">
              Send <span className="font-bold">Hundreds of Personalized Applications</span> in Minutes
            </p>
            
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
              <Link
                to="/signup"
                className="btn-primary w-full sm:w-auto text-center whitespace-nowrap text-sm sm:text-base"
              >
                TRY FOR FREE
              </Link>
              <motion.a 
                href="#how-it-works" 
                onClick={scrollToHowItWorks}
                className="text-sm sm:text-base font-semibold text-white hover:text-white/80 transition-colors whitespace-nowrap"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn more <span aria-hidden="true">→</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Placeholder Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-6 relative"
          >
            <div className="relative mx-auto max-w-[640px]">
              {/* Placeholder Container */}
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-white/10 shadow-2xl ring-1 ring-white/20">
                {/* Placeholder Content */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
                      <div className="h-32 bg-white/10 rounded animate-pulse mt-8"></div>
                    </div>
                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="h-48 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
                      <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -inset-x-4 -inset-y-4 z-0 bg-gradient-to-r from-[#4D3E78]/30 to-[#6F58B8]/30 opacity-50 blur-2xl rounded-xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}