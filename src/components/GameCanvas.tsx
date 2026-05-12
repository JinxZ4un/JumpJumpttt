import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, RefreshCcw, ArrowRight, Play, ChevronRight, Star, Heart, Trophy } from 'lucide-react';
import { LevelData } from '../types';

interface Props {
  level: LevelData;
  onExit: () => void;
  onComplete: () => void;
  onNextLevel?: () => void;
  isLastLevel?: boolean;
}

const GRAVITY = 0.6;
const FRICTION = 0.8;
const MOVE_SPEED = 0.8;
const MAX_SPEED = 8;
const JUMP_FORCE = -12;

export const GameCanvas: React.FC<Props> = ({ level, onExit, onComplete, onNextLevel, isLastLevel }) => {
  const [gameState, setGameState] = useState<'playing' | 'failed' | 'success'>('playing');
  const [lives, setLives] = useState(3);
  
  // Use refs for physics state to avoid "setState while rendering" and closure stale issues
  const playerRef = useRef({
    x: 50,
    y: 500,
    vx: 0,
    vy: 0,
    width: 32,
    height: 32,
    isJumping: false,
    jumpCount: 0,
  });

  const [playerPos, setPlayerPos] = useState({ x: 50, y: 500 });
  const [vanishedPlatforms, setVanishedPlatforms] = useState<Set<string>>(new Set());
  const [obstacleOffsets, setObstacleOffsets] = useState<{ [key: string]: number }>({});
  const [showDoubleJumpEffect, setShowDoubleJumpEffect] = useState(false);
  
  const keys = useRef<{ [key: string]: boolean }>({});
  const gameLoopRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const vanishingTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const frameCount = useRef(0);

  const resetPlayer = useCallback((dead = false) => {
    // Clear vanishing timers
    Object.values(vanishingTimers.current).forEach(clearTimeout);
    vanishingTimers.current = {};
    setVanishedPlatforms(new Set());

    // Find first platform for safe spawn
    const firstPlatform = level.platforms[0];
    const width = containerRef.current?.offsetWidth || 800;
    const height = containerRef.current?.offsetHeight || 600;
    const spawnX = firstPlatform ? (firstPlatform.x / 100) * width + 10 : 50;
    const spawnY = firstPlatform ? (firstPlatform.y / 100) * height - 40 : 500;

    playerRef.current = {
      ...playerRef.current,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      isJumping: false,
      jumpCount: 0,
    };
    setPlayerPos({ x: spawnX, y: spawnY });
    
    if (dead) {
      setLives(l => Math.max(0, l - 1));
    }
  }, [level.platforms]);

  // Handle initialization properly
  useEffect(() => {
    // Small delay to ensure containerRef is available
    const timer = setTimeout(() => resetPlayer(), 50);
    return () => clearTimeout(timer);
  }, [resetPlayer]);

  useEffect(() => {
    if (lives <= 0) {
      setGameState('failed');
    }
  }, [lives]);

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    const p = playerRef.current;
    let { x, y, vx, vy, jumpCount, isJumping } = p;

    // Update Obstacle Offsets (for moving walls)
    frameCount.current += 1;
    const newOffsets: { [key: string]: number } = {};
    level.obstacles.forEach(obstacle => {
      if (obstacle.type === 'moving_wall' && obstacle.speed) {
        const amplitude = 100; // pixels
        const speedFactor = 0.02 * (obstacle.speed || 1);
        newOffsets[obstacle.id] = Math.sin(frameCount.current * speedFactor) * amplitude;
      }
    });
    setObstacleOffsets(newOffsets);

    // Apply controls
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) vx -= MOVE_SPEED;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) vx += MOVE_SPEED;

    // Vertical physics
    vy += pathGRAVITY(level); // Dynamic gravity if needed (level.gravity)
    
    // Friction and speed limits
    vx *= FRICTION;
    if (vx > MAX_SPEED) vx = MAX_SPEED;
    if (vx < -MAX_SPEED) vx = -MAX_SPEED;

    // Update positions
    x += vx;
    y += vy;

    // Container constraints
    const width = containerRef.current?.offsetWidth || 1000;
    const height = containerRef.current?.offsetHeight || 600;
    const groundY = height - 50;
    
    if (x < 0) { x = 0; vx = 0; }
    if (x > width - p.width) {
      x = width - p.width;
      vx = 0;
    }

    // Check Platforms
    let onPlatform = false;
    level.platforms.forEach(platform => {
      if (vanishedPlatforms.has(platform.id)) return;

      const px = (platform.x / 100) * width;
      const py = (platform.y / 100) * height;
      const pw = (platform.width / 100) * width;

      // Top collision
      if (
        vy >= 0 &&
        x + p.width > px &&
        x < px + pw &&
        p.y + p.height <= py &&
        y + p.height >= py
      ) {
        y = py - p.height;
        vy = (platform.type === 'bouncy') ? -15 : 0;
        isJumping = false;
        jumpCount = 0;
        onPlatform = true;

        // Vanishing logic
        if (platform.type === 'vanishing' && !vanishingTimers.current[platform.id]) {
          vanishingTimers.current[platform.id] = setTimeout(() => {
            setVanishedPlatforms(prev => new Set(prev).add(platform.id));
          }, 1000);
        }
      }
    });

    // Ground collision
    if (!onPlatform && y > groundY) {
      y = groundY;
      vy = 0;
      isJumping = false;
      jumpCount = 0;
    }

    // Check Obstacles
    let isDead = false;
    level.obstacles.forEach(obstacle => {
      if (isDead) return;
      const offset = obstacleOffsets[obstacle.id] || 0;
      const ox = (obstacle.x / 100) * width + (obstacle.direction === 'horizontal' ? offset : 0);
      const ow = (obstacle.width / 100) * width;
      const oh = (obstacle.height / 100) * height;
      const oy = groundY - oh + (obstacle.direction === 'vertical' ? offset : 0);

      if (
        x + p.width > ox &&
        x < ox + ow &&
        y + p.height > oy &&
        y < oy + oh
      ) {
        isDead = true;
      }
    });

    if (isDead) {
      resetPlayer(true);
      gameLoopRef.current = requestAnimationFrame(update);
      return; 
    }

    // Victory Condition
    if (x > width - 100) {
      setGameState('success');
      onComplete();
      return;
    }

    // Update the ref for physics and state for rendering
    playerRef.current = { ...p, x, y, vx, vy, isJumping, jumpCount };
    setPlayerPos({ x, y });

    gameLoopRef.current = requestAnimationFrame(update);
  }, [gameState, level, onComplete, resetPlayer]);

  // Helper for gravity
  const pathGRAVITY = (level: LevelData) => level.gravity || GRAVITY;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (gameState === 'playing' ) {
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
          const p = playerRef.current;
          const canJump = !p.isJumping || (level.hasDoubleJump && p.jumpCount < 2);
          if (canJump) {
            if (p.jumpCount === 1) {
              setShowDoubleJumpEffect(true);
              setTimeout(() => setShowDoubleJumpEffect(false), 500);
            }
            playerRef.current.vy = JUMP_FORCE;
            playerRef.current.isJumping = true;
            playerRef.current.jumpCount += 1;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoopRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [update, gameState, level.hasDoubleJump]);

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden flex flex-col font-sans">
      {/* UI Overlay */}
      <div className="flex justify-between items-center p-6 bg-white/50 backdrop-blur-xl border-b border-slate-200 z-20 shadow-sm">
        <div className="flex items-center space-x-6">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onExit}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:border-cyan-200 transition-all shadow-sm"
          >
            <Home size={18} />
          </motion.button>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <span className="method-tag text-cyan-600 mb-1 block tracking-widest uppercase">SECTOR {level.id.toString().padStart(2, '0')}</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">{level.name}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">SYSTEM INTEGRITY</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm transform rotate-45 border transition-all duration-500 ${i < lives ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-200 border-slate-300'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Stage */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden"
      >
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />

        {/* Platforms */}
        {level.platforms.map((p) => (
          <motion.div
            key={p.id}
            initial={false}
            animate={{ 
              opacity: vanishedPlatforms.has(p.id) ? 0 : 1,
              scale: vanishedPlatforms.has(p.id) ? 0.95 : 1
            }}
            className={`absolute rounded-xl border-b-2 shadow-sm transition-all
              ${p.type === 'static' ? 'bg-white border-slate-200' : p.type === 'vanishing' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}
            `}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.width}%`,
              height: '14px'
            }}
          >
             <div className="p-1 opacity-40">
               <span className="text-[8px] font-bold text-slate-400 uppercase">{p.type}</span>
            </div>
          </motion.div>
        ))}

        {/* Obstacles */}
        {level.obstacles.map((o) => {
          const offset = obstacleOffsets[o.id] || 0;
          return (
            <div
              key={o.id}
              className={`absolute flex items-end justify-center
                ${o.type === 'spike' ? 'bg-rose-500/10' : o.type === 'lava' ? 'bg-orange-500/10' : 'bg-slate-900/10 shadow-xl'}
              `}
              style={{
                left: `${o.x}%`,
                bottom: '50px',
                width: `${o.width}%`,
                height: `${o.height}%`,
                transform: o.type === 'moving_wall' 
                  ? `translate(${o.direction === 'horizontal' ? offset : 0}px, ${o.direction === 'vertical' ? -offset : 0}px)` 
                  : 'none',
                clipPath: o.type === 'spike' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
              }}
            >
              {o.type === 'lava' && <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-rose-600 via-orange-500 to-transparent" />}
              {o.type === 'spike' && <div className="absolute inset-0 bg-rose-500" style={{ clipPath: 'polygon(50% 10%, 0% 100%, 100% 100%)' }} />}
              {o.type === 'moving_wall' && (
                <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-700">
                   <div className="w-full h-1 bg-white/10" />
                </div>
              )}
            </div>
          );
        })}

        {/* Goal */}
        <div 
          className="absolute right-0 bottom-[50px] w-32 h-64 flex flex-col items-center justify-center bg-gradient-to-l from-emerald-500/5 to-transparent border-r-8 border-emerald-500/30"
        >
          <div className="p-4 bg-white border border-emerald-500/30 rounded-2xl animate-bounce shadow-lg shadow-emerald-500/10">
            <Trophy className="text-emerald-500" size={32} />
          </div>
          <span className="text-[10px] font-black tracking-widest text-emerald-600 mt-4 uppercase">Sector Exit</span>
        </div>

        {/* Player */}
        <motion.div
           animate={{ x: playerPos.x, y: playerPos.y }}
           transition={{ type: 'spring', bounce: 0, duration: 0.05 }}
           className="absolute z-10"
        >
          <div className="relative group">
             {/* Double Jump Burst */}
             <AnimatePresence>
               {showDoubleJumpEffect && (
                 <motion.div
                   initial={{ scale: 0.5, opacity: 0.8 }}
                   animate={{ scale: 2, opacity: 0 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-cyan-400 rounded-full blur-md -z-10"
                 />
               )}
             </AnimatePresence>
             
             <div className="w-8 h-8 bg-cyan-600 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center border border-white/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                <div className="w-4 h-1 bg-white/40 rounded-full blur-[1px] absolute top-1"></div>
             </div>
          </div>
        </motion.div>

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-[50px] bg-slate-100 border-t border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-12 rounded-[3rem] max-w-lg w-full text-center shadow-2xl border border-slate-100"
            >
              <div className={`mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg
                ${gameState === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}
              `}>
                {gameState === 'success' ? <Trophy className="text-white" size={48} /> : <RefreshCcw className="text-white" size={48} />}
              </div>

              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-slate-900">
                {gameState === 'success' ? 'Sector Clear' : 'Mission Failed'}
              </h2>
              <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed">
                {gameState === 'success' 
                  ? 'Objective completed. Syncing data stream for the next sector deployment.' 
                  : 'Physical integrity compromised. Security protocols require a system re-initialization.'
                }
              </p>

              <div className="space-y-4">
                {gameState === 'success' && !isLastLevel && (
                  <button 
                    onClick={onNextLevel}
                    className="w-full py-5 bg-cyan-600 text-white font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-cyan-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20"
                  >
                    Next Mission <ChevronRight size={22} strokeWidth={3} />
                  </button>
                )}
                <button 
                  onClick={() => { setGameState('playing'); resetPlayer(); setLives(3); }}
                  className="w-full py-5 bg-slate-900 text-white font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all border border-slate-700 shadow-xl"
                >
                  Re-Initialize <RefreshCcw size={20} />
                </button>
                <button 
                  onClick={onExit}
                  className="w-full py-5 bg-transparent text-slate-400 font-bold uppercase tracking-widest rounded-2xl hover:text-slate-600 transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameCanvas;
