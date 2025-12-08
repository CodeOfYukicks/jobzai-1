import { motion } from 'framer-motion';
import { Zap, TrendingUp, BookOpen, ExternalLink } from 'lucide-react';

interface CriticalSkill {
  name: string;
  currentLevel: number; // 0-100
  requiredLevel: number; // 0-100
  importance: 'critical' | 'high' | 'medium';
  salaryImpact?: string;
}

interface TrendingSkill {
  name: string;
  demandGrowth: string;
  relevance: string;
}

interface Resource {
  title: string;
  type: 'course' | 'certification' | 'book' | 'tutorial';
  url?: string;
  duration?: string;
}

interface SkillsData {
  summary: string;
  criticalCount: number;
  criticalSkills: CriticalSkill[];
  trendingSkills: TrendingSkill[];
  recommendedResources: Resource[];
}

interface SkillsInsightProps {
  data?: SkillsData | null;
}

export default function SkillsInsight({ data }: SkillsInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to discover your skill gaps.
        </p>
      </div>
    );
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '🎓';
      case 'certification':
        return '📜';
      case 'book':
        return '📚';
      default:
        return '💡';
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Critical Skills */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" />
          Skills to Develop
        </h4>
        
        <div className="space-y-4">
          {data.criticalSkills?.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {skill.name}
                    </h5>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${getImportanceColor(skill.importance)}`}>
                      {skill.importance}
                    </span>
                  </div>
                  {skill.salaryImpact && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Potential salary impact: <span className="text-green-600 dark:text-green-400 font-medium">{skill.salaryImpact}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Current: {skill.currentLevel}%</span>
                  <span>Required: {skill.requiredLevel}%</span>
                </div>
                <div className="relative h-2 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                  {/* Current Level */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.currentLevel}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                  />
                  {/* Required Level Marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500"
                    style={{ left: `${skill.requiredLevel}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Skills */}
      {data.trendingSkills && data.trendingSkills.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Trending in Your Market
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.trendingSkills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="p-3 border border-gray-200 dark:border-[#3d3c3e]/50 rounded-lg
                  hover:border-indigo-200 dark:hover:border-indigo-800/50
                  transition-colors duration-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {skill.name}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {skill.demandGrowth}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {skill.relevance}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Resources */}
      {data.recommendedResources && data.recommendedResources.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Recommended Resources
          </h4>
          
          <div className="space-y-2">
            {data.recommendedResources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg
                  hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-200 cursor-pointer group"
              >
                <span className="text-lg">{getResourceIcon(resource.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {resource.title}
                  </p>
                  {resource.duration && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {resource.duration}
                    </p>
                  )}
                </div>
                {resource.url && (
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


