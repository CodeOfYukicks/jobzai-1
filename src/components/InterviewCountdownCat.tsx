import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface InterviewCountdownCatProps {
  daysUntil: number;
  hoursUntil: number;
  isPast: boolean;
}

type CatState = 'relaxed' | 'starting' | 'working' | 'intense' | 'sleeping';

export default function InterviewCountdownCat({ daysUntil, hoursUntil, isPast }: InterviewCountdownCatProps) {
  const [catState, setCatState] = useState<CatState>('relaxed');

  useEffect(() => {
    if (isPast) {
      setCatState('sleeping');
    } else if (daysUntil === 0 && hoursUntil < 24) {
      setCatState('intense');
    } else if (daysUntil <= 1) {
      setCatState('working');
    } else if (daysUntil <= 3) {
      setCatState('starting');
    } else {
      setCatState('relaxed');
    }
  }, [daysUntil, hoursUntil, isPast]);

  // Animation variants for different states
  const catVariants = {
    relaxed: {
      scale: [1, 1.03, 1],
      rotate: [0, 1.5, -1.5, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    starting: {
      y: [0, -3, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    working: {
      x: [0, 1.5, 0, -1.5, 0],
      y: [0, -0.5, 0],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    intense: {
      x: [0, 2.5, 0, -2.5, 0],
      y: [0, -1.5, 0, -0.5, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    sleeping: {
      y: [0, 3, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Eye blink animation
  const eyeBlink = {
    scaleY: [1, 0.05, 1],
    transition: {
      duration: 0.15,
      repeat: Infinity,
      repeatDelay: 4
    }
  };

  // Typing animation for working states
  const typingAnimation = {
    scale: [1, 1.15, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatDelay: 0.3
    }
  };

  // Zzz animation for sleeping
  const zzzAnimation = {
    y: [0, -12, 0],
    opacity: [0.4, 1, 0.4],
    scale: [0.9, 1.1, 0.9],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
      <motion.svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="absolute inset-0 drop-shadow-sm"
        variants={catVariants}
        animate={catState}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {/* Cat body - sitting position */}
        <motion.ellipse
          cx="40"
          cy="50"
          rx="20"
          ry="15"
          fill="currentColor"
          className="text-purple-500 dark:text-purple-400"
          variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Cat head */}
        <motion.circle
          cx="40"
          cy="30"
          r="18"
          fill="currentColor"
          className="text-purple-500 dark:text-purple-400"
          variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Ears */}
        <motion.polygon
          points="25,20 30,10 35,20"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-500"
          variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.polygon
          points="45,20 50,10 55,20"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-500"
          variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Eyes */}
        {catState === 'sleeping' ? (
          // Closed eyes when sleeping
          <>
            <motion.line
              x1="32"
              y1="28"
              x2="38"
              y2="28"
              stroke="currentColor"
              strokeWidth="2"
              className="text-purple-700 dark:text-purple-600"
            />
            <motion.line
              x1="42"
              y1="28"
              x2="48"
              y2="28"
              stroke="currentColor"
              strokeWidth="2"
              className="text-purple-700 dark:text-purple-600"
            />
          </>
        ) : (
          // Open eyes
          <>
            <motion.ellipse
              cx="35"
              cy="28"
              rx="3"
              ry="4"
              fill="currentColor"
              className="text-purple-800 dark:text-purple-700"
              variants={eyeBlink}
            />
            <motion.ellipse
              cx="45"
              cy="28"
              rx="3"
              ry="4"
              fill="currentColor"
              className="text-purple-800 dark:text-purple-700"
              variants={eyeBlink}
            />
          </>
        )}
        
        {/* Nose */}
        <motion.polygon
          points="40,32 38,36 42,36"
          fill="currentColor"
          className="text-purple-600 dark:text-purple-500"
          variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Mouth */}
        {catState !== 'sleeping' && (
          <motion.path
            d="M 40 36 Q 38 38 36 36"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-purple-700 dark:text-purple-600"
            variants={catState === 'sleeping' ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Computer/Laptop for working states */}
        {(catState === 'working' || catState === 'intense' || catState === 'starting') && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Laptop base */}
            <motion.rect
              x="20"
              y="55"
              width="40"
              height="8"
              rx="2"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-500"
            />
            {/* Laptop screen */}
            <motion.rect
              x="22"
              y="45"
              width="36"
              height="12"
              rx="1"
              fill="currentColor"
              className="text-gray-300 dark:text-gray-600"
            />
            {/* Screen content - typing effect */}
            <motion.rect
              x="26"
              y="48"
              width="28"
              height="2"
              rx="1"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              variants={typingAnimation}
            />
            <motion.rect
              x="26"
              y="52"
              width="20"
              height="2"
              rx="1"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              variants={typingAnimation}
              transition={{ delay: 0.2 }}
            />
            <motion.rect
              x="26"
              y="56"
              width="24"
              height="2"
              rx="1"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              variants={typingAnimation}
              transition={{ delay: 0.4 }}
            />
          </motion.g>
        )}
        
        {/* Zzz bubbles for sleeping */}
        {catState === 'sleeping' && (
          <>
            <motion.text
              x="50"
              y="20"
              fontSize="14"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              variants={zzzAnimation}
            >
              Z
            </motion.text>
            <motion.text
              x="56"
              y="14"
              fontSize="14"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              variants={zzzAnimation}
              transition={{ delay: 0.4 }}
            >
              Z
            </motion.text>
            <motion.text
              x="62"
              y="17"
              fontSize="14"
              fill="currentColor"
              className="text-purple-500 dark:text-purple-400"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              variants={zzzAnimation}
              transition={{ delay: 0.8 }}
            >
              Z
            </motion.text>
          </>
        )}
      </motion.svg>
    </div>
  );
}

