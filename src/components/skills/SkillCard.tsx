import React from 'react';
import { Briefcase, HelpCircle } from 'lucide-react';

interface SkillCardProps {
  name: string;
  level: number;
  onRate: (level: number) => void;
  onAdvice: () => void;
  onPractice: () => void;
}

const feedbacks = [
  "À travailler !",
  "Débutant, continuez !",
  "En progrès !",
  "Bon niveau !",
  "Excellent, point fort !"
];

const SkillCard: React.FC<SkillCardProps> = ({ name, level, onRate, onAdvice, onPractice }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="w-5 h-5 text-purple-500" />
        <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            onClick={() => onRate(i)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${level >= i ? 'bg-purple-500 border-purple-500' : 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600'}`}
            aria-label={`Niveau ${i}`}
          >
            <span className="text-white font-bold">{i}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
        {feedbacks[level-1] || ''}
      </div>
      <div className="flex gap-2 mt-auto">
        <button onClick={onAdvice} className="flex-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium flex items-center gap-1 justify-center">
          <HelpCircle className="w-4 h-4" /> Conseils personnalisés
        </button>
        <button onClick={onPractice} className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">S'entraîner</button>
      </div>
    </div>
  );
};

export default SkillCard; 