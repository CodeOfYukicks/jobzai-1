import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, Loader2, AlertCircle, Network, FileText } from 'lucide-react';
import { useState } from 'react';

interface JobStrategySectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function JobStrategySection({
  data,
  isLoading,
  error,
  onRefresh
}: JobStrategySectionProps) {
  const [activeTab, setActiveTab] = useState<'skills' | 'ats' | 'networking' | 'application'>('skills');
  const strategy = data?.strategy;

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Job Search Strategy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Optimize your applications and skills
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
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
              <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Job Search Strategy
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

  if (!strategy) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Job Search Strategy
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Optimize your applications and skills
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No strategy available. Complete your profile to get recommendations.</p>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'skills' as const, label: 'Skills', icon: CheckCircle },
    { id: 'ats' as const, label: 'ATS Optimization', icon: FileText },
    { id: 'networking' as const, label: 'Networking', icon: Network },
    { id: 'application' as const, label: 'Application', icon: Lightbulb },
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            Job Search Strategy
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive strategy to maximize your job search success
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Highlight Skills */}
            {strategy.highlight_skills && strategy.highlight_skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Skills to Highlight
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategy.highlight_skills.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.skill}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Develop Skills */}
            {strategy.develop_skills && strategy.develop_skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Skills to Develop
                </h3>
                <div className="space-y-4">
                  {strategy.develop_skills.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.skill}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.reason}
                      </p>
                      {item.resource && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Resources: {item.resource}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATS Tab */}
        {activeTab === 'ats' && strategy.ats_optimization && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ATS Optimization
              </h3>
              {strategy.ats_optimization.score && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {strategy.ats_optimization.score}%
                  </div>
                  <div className="text-xs text-gray-500">ATS Score</div>
                </div>
              )}
            </div>
            {strategy.ats_optimization.resume_tips && (
              <div className="space-y-3">
                {strategy.ats_optimization.resume_tips.map((tip: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Networking Tab */}
        {activeTab === 'networking' && strategy.networking && (
          <div className="space-y-6">
            {strategy.networking.strategy && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Networking Strategy
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {strategy.networking.strategy}
                </p>
              </div>
            )}

            {strategy.networking.target_groups && strategy.networking.target_groups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Target Groups & Communities
                </h3>
                <div className="space-y-3">
                  {strategy.networking.target_groups.map((group: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {group.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {strategy.networking.events && strategy.networking.events.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recommended Events
                </h3>
                <div className="space-y-2">
                  {strategy.networking.events.map((event: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">{event}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Tab */}
        {activeTab === 'application' && strategy.application_strategy && (
          <div className="space-y-6">
            {strategy.application_strategy.approach && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Application Approach
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {strategy.application_strategy.approach}
                </p>
              </div>
            )}

            {strategy.application_strategy.optimization_tips && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Optimization Tips
                </h3>
                <div className="space-y-3">
                  {strategy.application_strategy.optimization_tips.map((tip: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                    >
                      <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}








