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
    <article className="rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-6 shadow-sm transition-all duration-200">
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Position Details
          </h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-9">
          Key responsibilities and expectations
        </p>
      </header>

      {/* Position Headline */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-[#1A1A1D] dark:to-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E]">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
          {headline}.
        </p>
      </div>

      {/* Key Responsibilities */}
      {sentences.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sentences.slice(0, 6).map((responsibility, index) => {
            const Icon = responsibilityIcons[index % responsibilityIcons.length];
            
            return (
              <div
                key={index}
                className="group rounded-lg bg-gray-50/50 dark:bg-[#1A1A1D]/50 border border-gray-100 dark:border-[#2A2A2E] p-4 transition-all duration-200 hover:bg-white dark:hover:bg-[#1E1F22] hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {/* Content */}
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 pt-1">
                    {responsibility.trim()}.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 rounded-lg bg-gray-50 dark:bg-[#1A1A1D] border border-dashed border-gray-200 dark:border-[#2A2A2E]">
          <Rocket className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Run job post analysis to discover detailed responsibilities
          </p>
        </div>
      )}
    </article>
  );
});

export default PositionDetailsSection;
