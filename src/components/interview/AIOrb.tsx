import React, { useMemo } from 'react';
import styled from 'styled-components';

export type OrbState = 'idle' | 'listening' | 'speaking';

interface AIOrbProps {
  state: OrbState;
  audioLevel?: number;
  className?: string;
}

export function AIOrb({ state, audioLevel = 0, className = '' }: AIOrbProps) {
  // Calculate color palette based on state
  const colorPalette = useMemo(() => {
    switch (state) {
      case 'speaking':
        return {
          blob1: '#a78bfa', // violet-400
          blob2: '#8b5cf6', // violet-500
          blob3: '#7c3aed', // violet-600
          blob4: '#6366f1', // indigo-500
        };
      case 'listening':
        return {
          blob1: '#67e8f9', // cyan-300
          blob2: '#06b6d4', // cyan-500
          blob3: '#0891b2', // cyan-600
          blob4: '#22d3ee', // cyan-400
        };
      default: // idle
        return {
          blob1: '#8b5cf6', // violet-500
          blob2: '#6366f1', // indigo-500
          blob3: '#7c3aed', // violet-600
          blob4: '#a78bfa', // violet-400
        };
    }
  }, [state]);

  // Calculate animation speed based on audio level
  const animationSpeed = useMemo(() => {
    const baseSpeed = 30;
    // Faster animation when audio level is higher (min 20s, max 30s)
    return Math.max(20, baseSpeed - (audioLevel * 10));
  }, [audioLevel]);

  // Calculate breath intensity based on audio level
  const breathIntensity = useMemo(() => {
    // Scale from 1.05 (idle) to 1.15 (high audio)
    return 1.05 + (audioLevel * 0.1);
  }, [audioLevel]);

  // Calculate blob animation speeds based on audio level
  const blobSpeeds = useMemo(() => {
    const baseSpeed1 = 7;
    const baseSpeed2 = 9;
    const baseSpeed3 = 11;
    const baseSpeed4 = 13;
    // Faster animations when audio level is higher
    return {
      speed1: Math.max(4, baseSpeed1 - (audioLevel * 2)),
      speed2: Math.max(5, baseSpeed2 - (audioLevel * 2.5)),
      speed3: Math.max(6, baseSpeed3 - (audioLevel * 3)),
      speed4: Math.max(7, baseSpeed4 - (audioLevel * 3.5)),
    };
  }, [audioLevel]);

  return (
    <StyledWrapper 
      className={className}
        style={{
        '--blob-1': colorPalette.blob1,
        '--blob-2': colorPalette.blob2,
        '--blob-3': colorPalette.blob3,
        '--blob-4': colorPalette.blob4,
        '--animation-speed': `${animationSpeed}s`,
        '--breath-scale': breathIntensity,
        '--blob-speed-1': `${blobSpeeds.speed1}s`,
        '--blob-speed-2': `${blobSpeeds.speed2}s`,
        '--blob-speed-3': `${blobSpeeds.speed3}s`,
        '--blob-speed-4': `${blobSpeeds.speed4}s`,
      } as React.CSSProperties}
    >
      <div className="container palette">
        <div className="orb-glass">
          <div className="blobs">
            <svg viewBox="0 0 1200 1200">
              <g className="blob blob-1">
                <path d="M 100 600 q 0 -500, 500 -500 t 500 500 t -500 500 T 100 600 z" />
              </g>
              <g className="blob blob-2">
                <path d="M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z" />
              </g>
              <g className="blob blob-3">
                <path d="M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z" />
              </g>
              <g className="blob blob-4">
                <path d="M 150 600 q 0 -650, 500 -500 t 500 580 t -500 500 T 150 600 z" />
              </g>
            </svg>
          </div>
        </div>
    </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;

  .palette {
    --blob-1: #ff007b;
    --blob-2: #00faff;
    --blob-3: #ff00ff;
    --blob-4: #00ff9d;
  }

  .container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: visible;
  }

  .orb-glass {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(2.5rem) saturate(250%);
    -webkit-backdrop-filter: blur(2.5rem) saturate(250%);
    box-shadow:
      inset 0 0 80px rgba(255, 255, 255, 0.06),
      0 0 120px rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: orbBreath 10s infinite ease-in-out;
    overflow: visible;
  }

  @keyframes orbBreath {
    0%,
    100% {
      transform: scale(1);
      box-shadow:
        inset 0 0 80px rgba(255, 255, 255, 0.06),
        0 0 120px rgba(255, 255, 255, 0.15);
    }
    50% {
      transform: scale(var(--breath-scale, 1.05));
      box-shadow:
        inset 0 0 120px rgba(255, 255, 255, 0.1),
        0 0 180px rgba(255, 255, 255, 0.3);
    }
  }

  .blobs {
    width: 90%;
    height: 90%;
    position: relative;
    overflow: visible;
  }
  
  .blobs svg {
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
    overflow: visible;
  }

  .blob {
    animation:
      rotate var(--animation-speed, 30s) infinite alternate ease-in-out,
      blobPulse 4s infinite ease-in-out;
    transform-origin: 50% 50%;
    opacity: 0.7;
  }
  
  .blob path {
    transform-origin: 50% 50%;
    transform: scale(0.8);
  }

  .blob-1 path {
    fill: var(--blob-1);
    filter: blur(2rem) drop-shadow(0 0 25px var(--blob-1));
    animation: blobScale1 var(--blob-speed-1, 7s) infinite alternate ease-in-out;
  }
  
  .blob-2 path {
    fill: var(--blob-2);
    filter: blur(1.5rem) drop-shadow(0 0 25px var(--blob-2));
    animation: blobScale2 var(--blob-speed-2, 9s) infinite alternate ease-in-out;
  }
  
  .blob-3 path {
    fill: var(--blob-3);
    filter: blur(1.2rem) drop-shadow(0 0 30px var(--blob-3));
    animation: blobScale3 var(--blob-speed-3, 11s) infinite alternate ease-in-out;
  }
  
  .blob-4 path {
    fill: var(--blob-4);
    filter: blur(5rem) drop-shadow(0 0 50px var(--blob-4));
    animation: blobScale4 var(--blob-speed-4, 13s) infinite alternate ease-in-out;
  }

  @keyframes blobScale1 {
    0% {
      transform: scale(0.8);
    }
    100% {
      transform: scale(1.1);
    }
  }

  @keyframes blobScale2 {
    0% {
      transform: scale(0.75);
    }
    100% {
      transform: scale(1.05);
    }
  }

  @keyframes blobScale3 {
    0% {
      transform: scale(0.72);
    }
    100% {
      transform: scale(1.0);
    }
  }

  @keyframes blobScale4 {
    0% {
      transform: scale(0.5);
    }
    100% {
      transform: scale(0.7);
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes blobPulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

export default AIOrb;
