import React from 'react';
import { X } from 'lucide-react';

interface SkillAdviceModalProps {
  open: boolean;
  onClose: () => void;
  skillName: string;
  level: number;
  conseils: string[];
}

const SkillAdviceModal: React.FC<SkillAdviceModalProps> = ({ open, onClose, skillName, level, conseils }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Conseils pour {skillName}</h3>
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">Niveau actuel : {level}/5</div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
          {conseils.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default SkillAdviceModal; 