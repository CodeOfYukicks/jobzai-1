import React from 'react';
import { GraduationCap, Video, BookOpen, FileText, ExternalLink } from 'lucide-react';
import type { LearningPath } from '../../types/premiumATS';

interface LearningPathPanelProps {
  learningPath: LearningPath;
}

const TYPE_CONFIG = {
  video: {
    icon: Video,
    color: 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400',
    label: 'Video',
  },
  course: {
    icon: GraduationCap,
    color: 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
    label: 'Course',
  },
  article: {
    icon: FileText,
    color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    label: 'Article',
  },
  documentation: {
    icon: BookOpen,
    color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    label: 'Documentation',
  },
};

export default function LearningPathPanel({ learningPath }: LearningPathPanelProps) {
  // Ensure resources is an array
  const resources = Array.isArray(learningPath?.resources) ? learningPath.resources : [];
  
  return (
    <div className="space-y-6">
      {/* Header with One-Sentence Plan */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl border border-purple-200 dark:border-purple-900">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Your Learning Path
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
              {learningPath?.one_sentence_plan || 'No learning path available'}
            </p>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid gap-4">
        {resources.map((resource, index) => {
          // Get config with fallback to 'article' if type is invalid or missing
          const resourceType = resource.type && TYPE_CONFIG[resource.type] ? resource.type : 'article';
          const config = TYPE_CONFIG[resourceType];
          const Icon = config.icon;

          return (
            <a
              key={index}
              href={resource.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-5 bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title + Type Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {resource.name || 'Learning Resource'}
                    </h4>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.color} whitespace-nowrap`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Why Useful */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {resource.why_useful}
                  </p>

                  {/* Link indicator */}
                  <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    <span>Open resource</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Empty State */}
      {resources.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No learning resources available for this analysis.</p>
        </div>
      )}
    </div>
  );
}

