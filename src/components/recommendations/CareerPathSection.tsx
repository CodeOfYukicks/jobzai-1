import { motion } from 'framer-motion';
import { TrendingUp, Calendar, DollarSign, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CareerPath {
  name: string;
  description: string;
  timeline: {
    '6_months': { position: string; skills: string[]; actions: string[] };
    '1_year': { position: string; skills: string[]; actions: string[] };
    '3_years': { position: string; skills: string[]; actions: string[] };
    '5_years': { position: string; skills: string[]; actions: string[] };
  };
  skills_to_acquire?: Array<{
    skill: string;
    importance: string;
    resources: string[];
    time_to_master: string;
  }>;
  expected_salaries?: {
    '6_months': string;
    '1_year': string;
    '3_years': string;
    '5_years': string;
  };
  success_probability?: string;
  success_explanation?: string;
  challenges?: string[];
}

interface CareerPathSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function CareerPathSection({
  data,
  isLoading,
  error,
  onRefresh
}: CareerPathSectionProps) {
  const [selectedPath, setSelectedPath] = useState<number>(0);
  const careerPaths: CareerPath[] = data?.career_paths || [];

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Career Path
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized career trajectories tailored to your goals
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Career Path
            </h2>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!careerPaths || careerPaths.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Career Path
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized career trajectories tailored to your goals
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No career paths available. Complete your profile to get recommendations.</p>
        </div>
      </section>
    );
  }

  const currentPath = careerPaths[selectedPath];

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Career Path
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {careerPaths.length} personalized career trajectories
          </p>
        </div>
      </div>

      {/* Path Selector */}
      {careerPaths.length > 1 && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {careerPaths.map((path, index) => (
            <button
              key={index}
              onClick={() => setSelectedPath(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedPath === index
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {path.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected Path Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Path Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {currentPath.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {currentPath.description}
          </p>
          {currentPath.success_probability && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Success Probability:
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentPath.success_probability.toLowerCase() === 'high'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : currentPath.success_probability.toLowerCase() === 'medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {currentPath.success_probability}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Career Timeline
          </h4>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-800"></div>

            {/* Timeline Items */}
            <div className="space-y-8">
              {(['6_months', '1_year', '3_years', '5_years'] as const).map((period, index) => {
                const milestone = currentPath.timeline[period];
                const salary = currentPath.expected_salaries?.[period];
                const periodLabel = period === '6_months' ? '6 Months' :
                                  period === '1_year' ? '1 Year' :
                                  period === '3_years' ? '3 Years' : '5 Years';

                return (
                  <div key={period} className="relative pl-12">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-2 w-8 h-8 bg-blue-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {periodLabel}
                          </h5>
                          <p className="text-base font-medium text-blue-600 dark:text-blue-400">
                            {milestone.position}
                          </p>
                        </div>
                        {salary && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-semibold text-gray-900 dark:text-white">{salary}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {milestone.skills && milestone.skills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Skills to Acquire:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {milestone.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {milestone.actions && milestone.actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Key Actions:
                          </p>
                          <ul className="space-y-1">
                            {milestone.actions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skills to Acquire */}
        {currentPath.skills_to_acquire && currentPath.skills_to_acquire.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Skills to Acquire
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPath.skills_to_acquire.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {skill.skill}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {skill.importance}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Time: {skill.time_to_master}</span>
                    {skill.resources && skill.resources.length > 0 && (
                      <span>{skill.resources.length} resources</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        {currentPath.challenges && currentPath.challenges.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Key Challenges
            </h4>
            <div className="space-y-2">
              {currentPath.challenges.map((challenge, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">{challenge}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}







