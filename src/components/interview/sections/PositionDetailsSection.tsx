import { memo } from 'react';
import { Target, Code, Users, Lightbulb, Rocket, Shield, Award, Zap } from 'lucide-react';
import { JobApplication, Interview } from '../../../types/interview';

interface PositionDetailsSectionProps {
  application: JobApplication;
  interview: Interview;
}

const responsibilityIcons = [Target, Code, Users, Lightbulb, Rocket, Shield, Award, Zap];

const PositionDetailsSection = memo(function PositionDetailsSection({
  application,
  interview,
}: PositionDetailsSectionProps) {
  const positionDetails = interview?.preparation?.positionDetails;
  
  // Extract first sentence as headline
  const headline = positionDetails?.split('.')[0] || `The ${application.position} role involves key responsibilities in the organization`;
  
  // Extract remaining sentences as individual responsibilities
  const sentences = positionDetails?.split('.').slice(1).filter(s => s.trim().length > 0) || [];

  return (
    <article className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 ring-1 ring-inset ring-purple-100 dark:ring-purple-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">
              Position Details
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Role expectations for</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{application.position}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {/* Headline */}
        <div className="relative pl-5 border-l-4 border-purple-500/30 dark:border-purple-400/30">
          <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed italic">
            "{headline}."
          </p>
        </div>

        {/* Key Responsibilities Grid */}
        {sentences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentences.slice(0, 6).map((responsibility, index) => {
              const Icon = responsibilityIcons[index % responsibilityIcons.length];
              
              return (
                <div
                  key={index}
                  className="group/card relative overflow-hidden rounded-xl bg-gray-50/50 dark:bg-gray-800/50 p-5 transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:shadow-purple-500/5 border border-transparent hover:border-purple-100 dark:hover:border-purple-500/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center group-hover/card:scale-110 transition-transform duration-200">
                      <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 pt-0.5">
                      {responsibility.trim()}.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No detailed responsibilities yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Run the job analysis to extract key role expectations
            </p>
          </div>
        )}
      </div>
    </article>
  );
});

export default PositionDetailsSection;
