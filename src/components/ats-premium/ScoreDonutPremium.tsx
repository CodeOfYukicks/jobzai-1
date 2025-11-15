import React, { useState, useEffect } from 'react';
import type { MatchScores } from '../../types/premiumATS';

interface ScoreDonutPremiumProps {
  matchScores: MatchScores;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animate?: boolean;
}

const SIZE_CONFIG = {
  small: { diameter: 120, strokeWidth: 10, fontSize: 'text-2xl' },
  medium: { diameter: 150, strokeWidth: 12, fontSize: 'text-3xl' },
  large: { diameter: 180, strokeWidth: 14, fontSize: 'text-4xl' },
};

const CATEGORY_COLORS = {
  Excellent: {
    stroke: 'url(#gradient-excellent)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Strong: {
    stroke: 'url(#gradient-strong)',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Medium: {
    stroke: 'url(#gradient-medium)',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Weak: {
    stroke: 'url(#gradient-weak)',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export default function ScoreDonutPremium({
  matchScores,
  size = 'large',
  showLabel = true,
  animate = true,
}: ScoreDonutPremiumProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : matchScores.overall_score);
  const config = SIZE_CONFIG[size];
  const colors = CATEGORY_COLORS[matchScores.category];

  // Animate score on mount
  useEffect(() => {
    if (!animate) return;

    const duration = 1000; // 1 second
    const steps = 60;
    const increment = matchScores.overall_score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(matchScores.overall_score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [matchScores.overall_score, animate]);

  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG Donut */}
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        <svg
          width={config.diameter}
          height={config.diameter}
          className="transform -rotate-90"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gradient-strong" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="gradient-medium" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="gradient-weak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            strokeWidth={config.strokeWidth}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-800"
            fill="transparent"
          />

          {/* Progress ring */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            stroke={colors.stroke}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${config.fontSize} font-bold text-gray-900 dark:text-gray-100`}>
            {Math.round(displayScore)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            out of 100
          </span>
        </div>
      </div>

      {/* Category Badge */}
      {showLabel && (
        <div
          className={`
            px-4 py-1.5 rounded-full text-sm font-semibold border
            ${colors.bg} ${colors.text} ${colors.border}
          `}
        >
          {matchScores.category} Match
        </div>
      )}
    </div>
  );
}

