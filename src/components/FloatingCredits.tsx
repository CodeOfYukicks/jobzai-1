import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FloatingCredit {
  id: number;
  value: number;
  x: number;
  y: number;
}

interface FloatingCreditsProps {
  value: number;
  triggerPosition: { x: number; y: number };
}

export default function FloatingCredits({ value, triggerPosition }: FloatingCreditsProps) {
  const [credits, setCredits] = useState<FloatingCredit[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (value !== 0) {
      const newCredit: FloatingCredit = {
        id: counter,
        value: value,
        x: triggerPosition.x,
        y: triggerPosition.y,
      };
      setCredits(prev => [...prev, newCredit]);
      setCounter(prev => prev + 1);

      // Remove the credit after animation completes
      setTimeout(() => {
        setCredits(prev => prev.filter(credit => credit.id !== newCredit.id));
      }, 1000);
    }
  }, [value, triggerPosition]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {credits.map(credit => (
          <motion.div
            key={credit.id}
            initial={{ 
              opacity: 0,
              scale: 0.5,
              x: credit.x,
              y: credit.y
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
              x: credit.x,
              y: credit.y - 100
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1,
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1]
            }}
            className="absolute flex items-center justify-center"
          >
            <span className={`text-lg font-bold ${
              credit.value > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {credit.value > 0 ? '+' : ''}{credit.value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}