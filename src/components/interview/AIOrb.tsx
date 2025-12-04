import { motion } from 'framer-motion';
import { useMemo } from 'react';

export type OrbState = 'idle' | 'listening' | 'speaking';

interface AIOrbProps {
  state: OrbState;
  audioLevel?: number;
  className?: string;
}

export function AIOrb({ state, audioLevel = 0, className = '' }: AIOrbProps) {
  // Calculate dynamic values based on state and audio level
  const config = useMemo(() => {
    const baseScale = 1 + audioLevel * 0.15;
    
    switch (state) {
      case 'speaking':
        return {
          coreDuration: 0.8 + (1 - audioLevel) * 0.4,
          glowIntensity: 0.6 + audioLevel * 0.4,
          pulseScale: baseScale * 1.1,
          ringOpacity: 0.4 + audioLevel * 0.3,
          particleCount: 8,
          primaryColor: 'rgb(139, 92, 246)', // violet-500
          secondaryColor: 'rgb(167, 139, 250)', // violet-400
          glowColor: 'rgba(139, 92, 246, 0.5)',
        };
      case 'listening':
        return {
          coreDuration: 1.5,
          glowIntensity: 0.4 + audioLevel * 0.3,
          pulseScale: baseScale * 1.05,
          ringOpacity: 0.3 + audioLevel * 0.2,
          particleCount: 0,
          primaryColor: 'rgb(6, 182, 212)', // cyan-500
          secondaryColor: 'rgb(103, 232, 249)', // cyan-300
          glowColor: 'rgba(6, 182, 212, 0.4)',
        };
      default: // idle
        return {
          coreDuration: 3,
          glowIntensity: 0.2,
          pulseScale: 1.02,
          ringOpacity: 0.15,
          particleCount: 0,
          primaryColor: 'rgb(139, 92, 246)', // violet-500
          secondaryColor: 'rgb(99, 102, 241)', // indigo-500
          glowColor: 'rgba(139, 92, 246, 0.25)',
        };
    }
  }, [state, audioLevel]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, config.pulseScale, 1],
          opacity: [config.glowIntensity * 0.5, config.glowIntensity, config.glowIntensity * 0.5],
        }}
        transition={{
          duration: config.coreDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring 3 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '160%',
          height: '160%',
          border: `1px solid ${config.primaryColor}`,
          opacity: config.ringOpacity * 0.3,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [config.ringOpacity * 0.2, config.ringOpacity * 0.4, config.ringOpacity * 0.2],
        }}
        transition={{
          duration: config.coreDuration * 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring 2 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '140%',
          height: '140%',
          border: `1px solid ${config.secondaryColor}`,
          opacity: config.ringOpacity * 0.5,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [config.ringOpacity * 0.3, config.ringOpacity * 0.6, config.ringOpacity * 0.3],
        }}
        transition={{
          duration: config.coreDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
      />

      {/* Outer ring 1 - main pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '120%',
          height: '120%',
          border: `2px solid ${config.primaryColor}`,
          boxShadow: `0 0 20px ${config.glowColor}, inset 0 0 20px ${config.glowColor}`,
        }}
        animate={{
          scale: [1, config.pulseScale, 1],
          opacity: [config.ringOpacity, config.ringOpacity * 1.5, config.ringOpacity],
        }}
        transition={{
          duration: config.coreDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner glow layer */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '110%',
          height: '110%',
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: config.coreDuration * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Core orb */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.3) 0%, transparent 40%),
            linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 50%, ${config.primaryColor} 100%)
          `,
          boxShadow: `
            0 0 40px ${config.glowColor},
            0 0 80px ${config.glowColor},
            inset 0 0 40px rgba(255,255,255,0.1),
            inset 0 -20px 40px rgba(0,0,0,0.2)
          `,
        }}
        animate={{
          scale: [1, config.pulseScale * 0.98, 1],
        }}
        transition={{
          duration: config.coreDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glass highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />
        
        {/* Animated shine */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: config.coreDuration * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Inner pulse for speaking */}
        {state === 'speaking' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 0.5 + (1 - audioLevel) * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Floating particles for speaking state */}
      {state === 'speaking' && config.particleCount > 0 && (
        <>
          {Array.from({ length: config.particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                background: config.primaryColor,
                filter: 'blur(1px)',
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: [0, Math.cos((i * 360 / config.particleCount) * Math.PI / 180) * 100],
                y: [0, Math.sin((i * 360 / config.particleCount) * Math.PI / 180) * 100],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Rotating ring for listening */}
      {state === 'listening' && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '130%',
            height: '130%',
            border: '2px solid transparent',
            borderTopColor: config.primaryColor,
            borderRightColor: `${config.primaryColor}50`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

export default AIOrb;


