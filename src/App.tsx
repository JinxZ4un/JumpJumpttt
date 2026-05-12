/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LevelSelector from './components/LevelSelector';
import GameCanvas from './components/GameCanvas';
import { LevelData } from './types';
import { LEVELS } from './constants/levels';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  // Load progress from localStorage
  useEffect(() => {
    const savedUnlocked = localStorage.getItem('unlockedLevels');
    const savedCompleted = localStorage.getItem('completedLevels');
    if (savedUnlocked) setUnlockedLevels(JSON.parse(savedUnlocked));
    if (savedCompleted) setCompletedLevels(JSON.parse(savedCompleted));
  }, []);

  const handleLevelComplete = () => {
    if (!currentLevel) return;
    
    const nextLevelId = currentLevel.id + 1;
    
    setCompletedLevels(prev => {
      const next = prev.includes(currentLevel.id) ? prev : [...prev, currentLevel.id];
      localStorage.setItem('completedLevels', JSON.stringify(next));
      return next;
    });

    if (nextLevelId <= LEVELS.length) {
      setUnlockedLevels(prev => {
        const next = prev.includes(nextLevelId) ? prev : [...prev, nextLevelId];
        localStorage.setItem('unlockedLevels', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleNextLevel = () => {
    if (!currentLevel) return;
    const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
    if (nextLevel) {
      setCurrentLevel(nextLevel);
    }
  };

  if (currentLevel) {
    return (
      <GameCanvas 
        key={currentLevel.id}
        level={currentLevel} 
        onExit={() => { setCurrentLevel(null); }}
        onComplete={handleLevelComplete}
        onNextLevel={handleNextLevel}
        isLastLevel={currentLevel.id === LEVELS.length}
      />
    );
  }

  return (
    <LevelSelector 
      onLevelSelect={setCurrentLevel} 
      unlockedLevels={unlockedLevels}
      completedLevels={completedLevels}
    />
  );
}

