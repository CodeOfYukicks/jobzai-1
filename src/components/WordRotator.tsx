import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordRotatorProps {
  words: string[];
  className?: string;
}

export default function WordRotator({ words, className = '' }: WordRotatorProps) {
  const [currentWord, setCurrentWord] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const typingSpeed = 100;
    const deletingSpeed = 75;
    const pauseDuration = 1500;
    const completeWordPause = 3000;

    const typeWriter = () => {
      const currentFullWord = words[currentIndex];

      if (!isDeleting) {
        if (currentWord.length < currentFullWord.length) {
          const nextChar = currentFullWord.charAt(currentWord.length);
          setCurrentWord(prev => prev + nextChar);
          setIsPaused(false);
          return typingSpeed + Math.random() * 40;
        } else if (!isPaused) {
          setIsPaused(true);
          return completeWordPause;
        } else {
          setIsDeleting(true);
          setIsPaused(false);
          return deletingSpeed;
        }
      } else {
        if (currentWord.length > 0) {
          setCurrentWord(prev => prev.slice(0, -1));
          return deletingSpeed + Math.random() * 20;
        } else {
          setIsDeleting(false);
          setCurrentIndex((current) => (current + 1) % words.length);
          return pauseDuration;
        }
      }
    };

    const timeout = setTimeout(typeWriter,
      isPaused ? completeWordPause :
      isDeleting ? deletingSpeed :
      typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [currentWord, currentIndex, isDeleting, isPaused, words]);

  return (
    <span className={`inline-block text-[#C1AAF8] ${className}`}>
      <motion.span
        key={currentWord}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="inline-block"
      >
        {currentWord}
        <motion.span
          animate={{
            opacity: [1, 0],
            scaleY: [1, 0.8]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="inline-block w-[2px] h-[1.1em] bg-[#C1AAF8] ml-[2px] align-middle"
        />
      </motion.span>
    </span>
  );
}