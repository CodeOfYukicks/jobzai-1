import React from 'react';

interface SkillEntry {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  showOnCV: boolean;
}

interface SkillEntryCardProps {
  skill: SkillEntry;
  index: number;
  onUpdate: (skill: SkillEntry) => void;
  onDelete: () => void;
}

const SKILL_LEVELS: Array<{ value: SkillEntry['level']; label: string }> = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' },
];

export default function SkillEntryCard({ skill, index, onUpdate, onDelete }: SkillEntryCardProps) {
  return (
    <div className="px-4 py-4 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Skill #{index + 1}
        </span>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-all"
          title="Delete skill"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Skill Name Input */}
        <div>
          <input
            type="text"
            value={skill.name}
            onChange={(e) => onUpdate({ ...skill, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
            placeholder="e.g. Agile & Scrum Methodologies"
          />
        </div>

        {/* Level Select */}
        <div>
          <select
            value={skill.level}
            onChange={(e) => onUpdate({ ...skill, level: e.target.value as SkillEntry['level'] })}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A0A0B] border border-gray-200/60 dark:border-gray-700/70 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all"
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

