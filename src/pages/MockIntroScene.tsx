import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

type GameState = 'exploring' | 'sit-transition' | 'sitting' | 'called';

// ============================================
// CONSTANTS
// ============================================

// Scene dimensions (pixel art native resolution)
const SEGMENT_WIDTH = 320;
const SCENE_HEIGHT = 180;
const ASPECT_RATIO = SEGMENT_WIDTH / SCENE_HEIGHT;

// World segments (backgrounds in order from left to right)
const WORLD_SEGMENTS = [
  '/images/sprite%20interview%20game/bg_hallway.png',
  '/images/sprite%20interview%20game/bg_waiting_room_0.png',
  '/images/sprite%20interview%20game/bg_waiting_room_1.png',
  '/images/sprite%20interview%20game/bg_waiting_room_2.png',
];

const WORLD_WIDTH = SEGMENT_WIDTH * WORLD_SEGMENTS.length; // 1280px total

// Character sprites
const SPRITES = {
  idle: '/images/sprite%20interview%20game/char_idle.png',
  sitDown: '/images/sprite%20interview%20game/char_sit_down.png',
  sitting: '/images/sprite%20interview%20game/char_sitting.png',
};

const WALK_FRAMES = [
  '/images/sprite%20interview%20game/char_walk_1.png',
  '/images/sprite%20interview%20game/char_walk_2.png',
  '/images/sprite%20interview%20game/char_walk_3.png',
  '/images/sprite%20interview%20game/char_walk_4.png',
];

// Props sprites
const PROPS = {
  chair: '/images/sprite%20interview%20game/prop_office_chair.png',
  doorGlow: '/images/sprite%20interview%20game/door_glow.png',
};

// UI sprites
const UI_SPRITES = {
  callNotification: '/images/sprite%20interview%20game/ui_onvousappelle.png',
};

// Animation constants
const FRAME_DURATION = 120; // ms per walk frame
const WALK_SPEED = 2; // pixels per tick
const START_X = 50; // Starting position in world coordinates

// Chair zone constants (at the end of the world - last segment)
const CHAIR_X = 1150; // X position of the chair in world coordinates
const CHAIR_ZONE_START = 1100; // Start of interactive zone
const CHAIR_ZONE_END = 1200; // End of interactive zone
const SIT_TRANSITION_DURATION = 700; // ms for sit-down animation
const CALL_DELAY = 2000; // ms before call triggers after sitting

// Door zone constants (past the chair, at the far end)
const DOOR_X = 1220; // X position of door in world
const DOOR_ZONE_START = 1180;
const DOOR_ZONE_END = 1260;
const FADE_DURATION = 800; // ms for fade-out transition

// ============================================
// COMPONENT
// ============================================

export default function MockIntroScene() {
  const navigate = useNavigate();
  
  // Scene scaling
  const [sceneScale, setSceneScale] = useState(1);
  
  // Character state
  const [characterX, setCharacterX] = useState(START_X);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  
  // Camera position
  const [cameraX, setCameraX] = useState(0);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('exploring');
  const [showNotification, setShowNotification] = useState(false);
  const [isInChairZone, setIsInChairZone] = useState(false);
  
  // Door state
  const [isInDoorZone, setIsInDoorZone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Input tracking
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // ============================================
  // VIEWPORT SCALING
  // ============================================
  
  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportRatio = viewportWidth / viewportHeight;

      let scale: number;
      if (viewportRatio > ASPECT_RATIO) {
        scale = viewportHeight / SCENE_HEIGHT;
      } else {
        scale = viewportWidth / SEGMENT_WIDTH;
      }

      setSceneScale(scale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // ============================================
  // KEYBOARD INPUT
  // ============================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input during fade out
      if (isFadingOut) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
      
      // Space to sit (only when in chair zone and exploring)
      if (e.key === ' ' && isInChairZone && gameState === 'exploring') {
        e.preventDefault();
        // Trigger sitting
        setCharacterX(CHAIR_X);
        setIsMoving(false);
        setGameState('sit-transition');
      }
      
      // E to enter door (only when in door zone and called)
      if ((e.key === 'e' || e.key === 'E') && isInDoorZone && gameState === 'called') {
        e.preventDefault();
        triggerDoorTransition();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keysPressed.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInChairZone, isInDoorZone, gameState, isFadingOut]);

  // ============================================
  // DOOR TRANSITION
  // ============================================
  
  const triggerDoorTransition = useCallback(() => {
    if (isFadingOut) return;
    
    setIsFadingOut(true);
    
    // Navigate after fade completes
    setTimeout(() => {
      navigate('/mock-interview');
    }, FADE_DURATION);
  }, [isFadingOut, navigate]);

  // ============================================
  // SITTING SEQUENCE
  // ============================================
  
  // Handle sit transition
  useEffect(() => {
    if (gameState !== 'sit-transition') return;

    const timeout = setTimeout(() => {
      setGameState('sitting');
    }, SIT_TRANSITION_DURATION);

    return () => clearTimeout(timeout);
  }, [gameState]);

  // Handle call trigger after sitting
  useEffect(() => {
    if (gameState !== 'sitting') return;

    const timeout = setTimeout(() => {
      setShowNotification(true);
      setGameState('called');
    }, CALL_DELAY);

    return () => clearTimeout(timeout);
  }, [gameState]);

  // ============================================
  // GAME LOOP
  // ============================================
  
  const canMove = (gameState === 'exploring' || gameState === 'called') && !isFadingOut;
  
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastFrameTimeRef.current;
    
    // Check if controls are enabled
    if (!canMove) {
      // Still update camera
      setCharacterX((currentX) => {
        const targetCameraX = currentX - SEGMENT_WIDTH / 2;
        const clampedCameraX = Math.max(0, Math.min(WORLD_WIDTH - SEGMENT_WIDTH, targetCameraX));
        setCameraX(clampedCameraX);
        return currentX;
      });
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Check movement input
    const movingRight = keysPressed.current.has('ArrowRight');
    const movingLeft = keysPressed.current.has('ArrowLeft');
    const moving = movingRight || movingLeft;
    
    setIsMoving(moving);
    
    if (moving) {
      // Update facing direction
      if (movingRight) setFacingRight(true);
      if (movingLeft) setFacingRight(false);
      
      // Update character position
      setCharacterX((prev) => {
        let newX = prev;
        if (movingRight) newX += WALK_SPEED;
        if (movingLeft) newX -= WALK_SPEED;
        
        // Clamp to world bounds
        newX = Math.max(20, Math.min(WORLD_WIDTH - 20, newX));
        
        // Check if in chair zone
        const inChairZone = newX >= CHAIR_ZONE_START && newX <= CHAIR_ZONE_END;
        setIsInChairZone(inChairZone);
        
        // Check if in door zone
        const inDoorZone = newX >= DOOR_ZONE_START && newX <= DOOR_ZONE_END;
        setIsInDoorZone(inDoorZone);
        
        return newX;
      });
      
      // Update walk animation frame
      if (deltaTime >= FRAME_DURATION) {
        setCurrentFrame((prev) => {
          // Walk cycle: 0 → 1 → 2 → 3 → 1 → 2 → 3...
          if (prev === 0) return 1;
          if (prev === 1) return 2;
          if (prev === 2) return 3;
          return 1;
        });
        lastFrameTimeRef.current = timestamp;
      }
    } else {
      // Reset to first frame when stopped
      setCurrentFrame(0);
      
      // Still check zones when not moving
      setCharacterX((prev) => {
        const inChairZone = prev >= CHAIR_ZONE_START && prev <= CHAIR_ZONE_END;
        setIsInChairZone(inChairZone);
        
        const inDoorZone = prev >= DOOR_ZONE_START && prev <= DOOR_ZONE_END;
        setIsInDoorZone(inDoorZone);
        
        return prev;
      });
    }
    
    // Update camera to follow character
    setCharacterX((currentX) => {
      const targetCameraX = currentX - SEGMENT_WIDTH / 2;
      // Clamp camera to world bounds
      const clampedCameraX = Math.max(0, Math.min(WORLD_WIDTH - SEGMENT_WIDTH, targetCameraX));
      setCameraX(clampedCameraX);
      return currentX;
    });
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [canMove]);

  useEffect(() => {
    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // ============================================
  // SPRITE SELECTION
  // ============================================
  
  const getCharacterSprite = () => {
    if (gameState === 'sit-transition') return SPRITES.sitDown;
    if (gameState === 'sitting' || gameState === 'called') return SPRITES.sitting;
    if (isMoving) return WALK_FRAMES[currentFrame];
    return SPRITES.idle;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
      {/* Viewport - clips the visible area */}
      <div
        style={{
          width: SEGMENT_WIDTH,
          height: SCENE_HEIGHT,
          transform: `scale(${sceneScale})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}
        className="relative"
      >
        {/* World Container - scrolls horizontally */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: WORLD_WIDTH,
            height: SCENE_HEIGHT,
            transform: `translateX(${-cameraX}px)`,
          }}
          className="flex"
        >
          {/* Background Segments */}
          {WORLD_SEGMENTS.map((segment, index) => (
            <img
              key={index}
              src={segment}
              alt={`Background ${index}`}
              style={{
                width: SEGMENT_WIDTH,
                height: SCENE_HEIGHT,
                imageRendering: 'pixelated',
                flexShrink: 0,
              }}
              draggable={false}
            />
          ))}
        </div>

        {/* Chair Prop - positioned at end of world */}
        <img
          src={PROPS.chair}
          alt="Chair"
          className="absolute"
          style={{
            imageRendering: 'pixelated',
            bottom: '8%',
            left: CHAIR_X - cameraX - 20, // Offset to center chair
            height: '35%',
            width: 'auto',
            zIndex: 5,
          }}
          draggable={false}
        />

        {/* Door Glow - only visible when called */}
        {gameState === 'called' && (
          <img
            src={PROPS.doorGlow}
            alt="Door Glow"
            className={`absolute ${isInDoorZone ? 'animate-pulse' : ''}`}
            style={{
              imageRendering: 'pixelated',
              bottom: '5%',
              left: DOOR_X - cameraX - 30,
              height: '70%',
              width: 'auto',
              zIndex: 4,
              opacity: isInDoorZone ? 1 : 0.7,
            }}
            draggable={false}
          />
        )}

        {/* Character - positioned in world, rendered relative to camera */}
        <img
          src={getCharacterSprite()}
          alt="Character"
          className="absolute"
          style={{
            imageRendering: 'pixelated',
            bottom: '8%',
            left: characterX - cameraX,
            height: '45%',
            width: 'auto',
            transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)',
            transformOrigin: 'center bottom',
            zIndex: 10,
          }}
          draggable={false}
        />

        {/* Sit Prompt - shows when in chair zone */}
        {isInChairZone && gameState === 'exploring' && (
          <div
            className="absolute animate-bounce"
            style={{
              bottom: '60%',
              left: CHAIR_X - cameraX,
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}
          >
            <div className="bg-black/80 px-2 py-1 rounded text-white text-xs font-mono whitespace-nowrap">
              Press SPACE to sit
            </div>
          </div>
        )}

        {/* Door Prompt - shows when in door zone and called */}
        {isInDoorZone && gameState === 'called' && (
          <div
            className="absolute animate-bounce"
            style={{
              bottom: '75%',
              left: DOOR_X - cameraX,
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}
          >
            <div className="bg-black/80 px-2 py-1 rounded text-white text-xs font-mono whitespace-nowrap">
              Press E to enter
            </div>
          </div>
        )}

        {/* Call Notification Overlay */}
        {showNotification && !isFadingOut && (
          <div
            className="absolute inset-0 flex items-center justify-center animate-pulse"
            style={{ pointerEvents: 'none', zIndex: 30 }}
          >
            <img
              src={UI_SPRITES.callNotification}
              alt="On vous appelle"
              style={{
                imageRendering: 'pixelated',
                height: '30%',
                width: 'auto',
              }}
              draggable={false}
            />
          </div>
        )}

        {/* Fade-out overlay */}
        {isFadingOut && (
          <div
            className="absolute inset-0 bg-black z-50"
            style={{
              animation: `fadeIn ${FADE_DURATION}ms ease-in-out forwards`,
            }}
          />
        )}
      </div>

      {/* Controls hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-lg">
        <p className="text-white text-sm font-mono" style={{ imageRendering: 'pixelated' }}>
          {gameState === 'exploring' && '← → Arrow keys to move'}
          {gameState === 'sit-transition' && 'Taking a seat...'}
          {gameState === 'sitting' && 'Waiting for interview...'}
          {gameState === 'called' && !isInDoorZone && '🔔 Walk to the glowing door →'}
          {gameState === 'called' && isInDoorZone && '🚪 Press E to enter interview'}
          {isFadingOut && 'Entering interview room...'}
        </p>
      </div>

      {/* Debug info (can be removed later) */}
      <div className="fixed top-4 left-4 bg-black/50 px-3 py-2 rounded-lg text-xs text-white font-mono">
        <p>State: {gameState}</p>
        <p>X: {Math.round(characterX)}</p>
        <p>Chair Zone: {CHAIR_ZONE_START}-{CHAIR_ZONE_END}</p>
        <p>Door Zone: {DOOR_ZONE_START}-{DOOR_ZONE_END}</p>
        <p>In Door: {isInDoorZone ? 'Yes' : 'No'}</p>
      </div>

      {/* CSS for fade animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
