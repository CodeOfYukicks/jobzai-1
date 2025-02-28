import React from 'react';
import { motion } from 'framer-motion';
import { Building, Clock, DollarSign, Lightbulb, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import LastUpdatedIndicator from './LastUpdatedIndicator';
import { RecommendationType } from '../contexts/RecommendationsContext';

interface AIRecommendationCardProps {
  type: RecommendationType;
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string;
  data: any;
  lastUpdated: Date | null;
  onAction: () => void;
  actionLabel: string;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  type,
  title,
  description,
  isLoading = false,
  error,
  data,
  lastUpdated,
  onAction,
  actionLabel
}) => {
  // Helper function to get the appropriate icon
  const getIcon = () => {
    switch (type) {
      case 'target-companies':
        return <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      case 'application-timing':
        return <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'salary-insights':
        return <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'job-strategy':
        return <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      default:
        return <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
    }
  };

  // Helper function to get the appropriate background color
  const getBgColor = () => {
    switch (type) {
      case 'target-companies':
        return 'bg-purple-100 dark:bg-purple-900/30';
      case 'application-timing':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'salary-insights':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'job-strategy':
        return 'bg-amber-100 dark:bg-amber-900/30';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30';
    }
  };

  // Helper function to get the appropriate button color
  const getButtonColor = () => {
    switch (type) {
      case 'target-companies':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'application-timing':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'salary-insights':
        return 'bg-green-600 hover:bg-green-700';
      case 'job-strategy':
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-purple-600 hover:bg-purple-700';
    }
  };

  // Helper function to get the appropriate text color
  const getTextColor = () => {
    switch (type) {
      case 'target-companies':
        return 'text-purple-600 dark:text-purple-400';
      case 'application-timing':
        return 'text-blue-600 dark:text-blue-400';
      case 'salary-insights':
        return 'text-green-600 dark:text-green-400';
      case 'job-strategy':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-purple-600 dark:text-purple-400';
    }
  };

  // Helper function to safely access nested properties
  const safeGet = (obj: any, path: string, defaultValue: any = null) => {
    try {
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result === undefined || result === null) return defaultValue;
        result = result[key];
      }
      
      return result === undefined || result === null ? defaultValue : result;
    } catch (error) {
      console.error(`Error accessing path ${path}:`, error);
      return defaultValue;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700
        hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${getBgColor()}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <LastUpdatedIndicator lastUpdated={lastUpdated} className="mb-4" />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-sm text-gray-500">Generating AI recommendations...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
          <p className="text-sm text-red-500 mb-2">Something went wrong</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      ) : data ? (
        <div className="mb-6">
          {/* Render content based on recommendation type */}
          {type === 'target-companies' && safeGet(data, 'companies') && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{safeGet(data, 'summary', 'Here are some companies that match your profile.')}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'companies.length', 0) || '0'}+</p>
                  <p className="text-xs text-gray-500">Matched Companies</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>
                    {safeGet(data, 'companies.0.match', '85%')}
                  </p>
                  <p className="text-xs text-gray-500">Top Match</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>
                    {safeGet(data, 'companies.0.growth_potential', 'High')}
                  </p>
                  <p className="text-xs text-gray-500">Growth Potential</p>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                {safeGet(data, 'companies', []).slice(0, 3).map((company: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 dark:text-white">{safeGet(company, 'name', 'Company')}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getBgColor()}`}>
                        {safeGet(company, 'match', 'N/A')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{safeGet(company, 'industry', 'Industry')} • {safeGet(company, 'size', 'Size')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'application-timing' && safeGet(data, 'timing') && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'timing.best_days.0', 'Tue')}</p>
                  <p className="text-xs text-gray-500">Best Day</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'timing.best_times', '10am')}</p>
                  <p className="text-xs text-gray-500">Peak Time</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'timing.best_quarter', 'Q2')}</p>
                  <p className="text-xs text-gray-500">Best Quarter</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Key Insights:</h4>
                <ul className="space-y-2">
                  {safeGet(data, 'timing.insights', []).map((insight: string, index: number) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {type === 'salary-insights' && safeGet(data, 'salary') && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'salary.range', '€45-75k')}</p>
                  <p className="text-xs text-gray-500">Salary Range</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'salary.average', '€60k')}</p>
                  <p className="text-xs text-gray-500">Market Average</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'salary.growth', '+8%')}</p>
                  <p className="text-xs text-gray-500">YoY Growth</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Common Benefits:</h4>
                <div className="flex flex-wrap gap-2">
                  {safeGet(data, 'salary.benefits', []).map((benefit: string, index: number) => (
                    <span key={index} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {type === 'job-strategy' && safeGet(data, 'strategy') && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'strategy.highlight_skills.length', 5)}</p>
                  <p className="text-xs text-gray-500">Key Skills</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'strategy.develop_skills.length', 3)}</p>
                  <p className="text-xs text-gray-500">Skills to Develop</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getTextColor()}`}>{safeGet(data, 'strategy.ats_optimization.score', '82%')}</p>
                  <p className="text-xs text-gray-500">ATS Score</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills to Highlight:</h4>
                  <div className="flex flex-wrap gap-2">
                    {safeGet(data, 'strategy.highlight_skills', []).map((skill: any, index: number) => (
                      <span key={index} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                        {typeof skill === 'string' ? skill : safeGet(skill, 'skill', '')}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills to Develop:</h4>
                  <div className="flex flex-wrap gap-2">
                    {safeGet(data, 'strategy.develop_skills', []).map((skill: any, index: number) => (
                      <span key={index} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                        {typeof skill === 'string' ? skill : safeGet(skill, 'skill', '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-gray-500 mb-4">Generate personalized AI recommendations based on your profile</p>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={onAction}
          disabled={isLoading}
          className={`flex-1 py-2.5 px-4 rounded-lg ${getButtonColor()} 
            text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : data ? (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>{actionLabel}</span>
            </>
          ) : (
            <span>{actionLabel}</span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default AIRecommendationCard; 