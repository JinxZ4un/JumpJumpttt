import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, ArrowRight, Play, Keyboard } from 'lucide-react';

import { LevelData } from '../types';
import { LEVELS } from '../constants/levels';

interface Props {
  onLevelSelect: (level: LevelData) => void;
  unlockedLevels: number[];
  completedLevels: number[];
}

export default function LevelSelector({ onLevelSelect, unlockedLevels, completedLevels }: Props) {
  const currentProgress = (completedLevels.length / LEVELS.length) * 100;

  return (
    <div className="flex flex-col h-screen w-full p-6 space-y-6 bg-slate-50">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M5 20v-4"/><path d="M9 20v-8"/><path d="M13 20v-12"/><path d="M17 20v-16"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase italic">Pathfinder <span className="text-cyan-600">Ultra</span></h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">MULTI-METHOD OBSTACLE CHALLENGE</p>
          </div>
        </div>
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">UNLOCKED</p>
            <p className="text-xl font-mono font-bold text-emerald-600">{unlockedLevels.length} / {LEVELS.length}</p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">COMPLETION</p>
            <p className="text-xl font-mono font-bold text-cyan-600">{Math.round(currentProgress)}%</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Sidebar: Methods */}
        <aside className="col-span-3 glass rounded-3xl p-6 flex flex-col space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">GAMEPLAY METHODS</h3>
            <div className="space-y-3">
              {[
                { name: 'Precision Parkour', active: true },
                { name: 'Speed Running', active: false },
                { name: 'Spatial Logic', active: false },
                { name: 'Gravity Reflex', active: false }
              ].map((method, i) => (
                <div key={i} className={`p-4 border rounded-xl flex items-center space-x-3 transition-opacity ${method.active ? 'bg-cyan-50 border-cyan-200 shadow-sm' : 'bg-slate-100/50 border-slate-200 opacity-40'}`}>
                  <div className={`w-2 h-2 rounded-full ${method.active ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-400'}`}></div>
                  <span className="text-sm font-medium tracking-tight text-slate-700">{method.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] text-slate-500 mb-2 font-medium tracking-wider uppercase">SECTOR PROGRESS</p>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                  className="bg-cyan-500 h-full shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                />
              </div>
              <p className="text-right text-[10px] mt-2 font-mono text-cyan-600 uppercase">{completedLevels.length} / {LEVELS.length} COMPLETED</p>
            </div>
          </div>
        </aside>

        {/* Center Section */}
        <section className="col-span-6 flex flex-col space-y-6">
          <div className="flex-1 glass rounded-[2.5rem] relative overflow-hidden group border-cyan-100 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10"></div>
            
            <div className="absolute inset-0 flex flex-col justify-center items-center space-y-6 z-20">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/30 cursor-pointer"
                onClick={() => {
                  const latest = LEVELS.find(l => !completedLevels.includes(l.id)) || LEVELS[0];
                  onLevelSelect(latest);
                }}
              >
                <Play className="h-10 w-10 text-white ml-1 fill-current" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-slate-900">Start Mission</h2>
                <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Continue Your Journey</p>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 z-20 flex justify-between items-end">
              <div className="space-y-2">
                <span className="method-tag px-3 py-1 bg-cyan-500/10 text-cyan-600 rounded-lg border border-cyan-200">Active Task</span>
                <h4 className="text-2xl font-bold tracking-tight text-slate-800">Ultra Obstacle Course</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Target Metrics</p>
                <p className="text-xl font-mono font-bold text-cyan-600">100% SYNC</p>
              </div>
            </div>

            {/* Background Grid Accent */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <div className="grid grid-cols-6 gap-4 transform rotate-12 scale-150">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="w-24 h-24 border border-cyan-500"></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="col-span-3 glass rounded-3xl p-6 flex flex-col space-y-4 overflow-hidden shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2">SECTOR DIRECTORY</h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {LEVELS.map((level) => {
              const isUnlocked = unlockedLevels.includes(level.id);
              const isCompleted = completedLevels.includes(level.id);
              
              return (
                <button
                  key={level.id}
                  disabled={!isUnlocked}
                  onClick={() => onLevelSelect(level)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 border
                    ${isCompleted 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' 
                      : isUnlocked 
                        ? 'bg-white border-cyan-400 border-2 shadow-lg shadow-cyan-100 text-slate-900' 
                        : 'bg-slate-100/50 border-slate-200 opacity-40 cursor-not-allowed text-slate-400'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-mono font-bold ${isCompleted ? 'text-emerald-500' : isUnlocked ? 'text-cyan-500' : 'text-slate-400'}`}>
                      {level.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm font-bold tracking-tight uppercase">{level.name.split(' ')[0]}</span>
                  </div>
                  {isCompleted ? (
                    <Trophy size={14} />
                  ) : !isUnlocked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  ) : (
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center py-4 px-8 bg-white/80 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-12">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">SERVER: ASIA-CENTRAL-01</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">SYNC: OPTIMAL</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 text-slate-600">
            <Keyboard size={14} className="text-cyan-500" />
            WASD - MOVEMENT
          </div>
          <button className="px-8 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-cyan-600 transition-colors">
            Leaderboard
          </button>
        </div>
      </footer>
    </div>
  );
}
