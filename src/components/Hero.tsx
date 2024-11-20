import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WordRotator from './WordRotator';
import FirebaseImage from './FirebaseImage';
import { RainbowButton } from './ui/rainbow-button';
import { ArrowRight } from 'lucide-react';
import AnimatedGridPattern from './ui/animated-grid-pattern';
import AnimatedGradientText from './ui/animated-gradient-text';

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
    <div id="home" className="relative isolate overflow-hidden bg-[#2A2831] min-h-screen flex items-center transition-colors duration-200">
      <AnimatedGridPattern
        width={40}
        height={40}
        x={0}
        y={0}
        className="absolute inset-0 h-full w-full fill-white/[0.1] stroke-white/[0.1]"
        strokeDasharray="4 4"
        numSquares={40}
        maxOpacity={0.3}
        duration={3}
        repeatDelay={0.3}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 lg:px-8 lg:py-32 mt-16 sm:mt-20 lg:mt-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-6 text-center lg:text-left mb-12 lg:mb-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-4"
            >
              <a 
                href="#how-it-works" 
                onClick={scrollToHowItWorks}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 
                rounded-full text-white transition-all duration-200"
              >
                <span className="mr-1">✨</span>
                Discover how it works
                <ArrowRight className="w-3 h-3" />
              </a>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.2] break-words text-center lg:text-left">
              <span className="block mb-2">Revolutionize Your</span>
              <span className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-2 mb-2 w-full">
                <WordRotator
                  words={['Job', 'Internship', 'Apprenticeship']}
                  className="min-h-[1.2em] inline-block"
                />
                <span>Search</span>
              </span>
              <span className="block">with AI</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-lg text-white/90 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
              Send <span className="font-bold">Hundreds of Personalized Applications</span> in Minutes
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/signup">
                <RainbowButton
                  className="text-base font-bold tracking-wide"
                >
                  TRY FOR FREE
                </RainbowButton>
              </Link>
            </div>
          </motion.div>

          {/* Image sans l'effet de bord transparent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-6 relative"
          >
            <div className="relative mx-auto max-w-[640px]">
              <FirebaseImage
                path="images/fond-hero.png"
                alt="Hero illustration"
                className="relative rounded-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}