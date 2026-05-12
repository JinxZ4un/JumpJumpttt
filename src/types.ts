export type LevelStatus = 'locked' | 'unlocked' | 'completed';

export interface Obstacle {
  id: string;
  type: 'spike' | 'lava' | 'moving_wall';
  x: number; // percentage from left
  width: number;
  height: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'vanishing' | 'bouncy';
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  requiredScore: number;
  platforms: Platform[];
  obstacles: Obstacle[];
  hasDoubleJump?: boolean;
  hasDashing?: boolean;
  gravity?: number;
}
