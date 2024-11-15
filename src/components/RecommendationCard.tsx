import { motion } from 'framer-motion';
import { LucideIcon, Lock } from 'lucide-react';
import { useState } from 'react';
import InsightsModal from './InsightsModal';

interface Stat {
  label: string;
  value: string;
}

interface RecommendationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats: Stat[];
  features: string[];
  ctaText: string;
  onAction: () => void;
  isPremium?: boolean;
  category: 'timing' | 'salary' | 'keywords' | 'companies';
}

export default function RecommendationCard({
  title,
  description,
  icon: Icon,
  stats,
  features,
  ctaText,
  onAction,
  isPremium,
  category
}: RecommendationCardProps) {
  const [showInsights, setShowInsights] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow relative flex flex-col h-full"
      >
        <div className="p-6 flex-grow">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6 text-[#4D3E78]" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-semibold text-[#4D3E78]">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features List */}
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4D3E78] mr-2"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Button Container - Fixed at Bottom */}
        <div className="p-6 pt-0">
          <button
            onClick={() => setShowInsights(true)}
            disabled={isPremium}
            className="w-full flex items-center justify-center px-4 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors disabled:opacity-50"
          >
            {isPremium && <Lock className="w-4 h-4 mr-2" />}
            {ctaText}
          </button>
        </div>

        {isPremium && (
          <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white/95 px-6 py-4 rounded-lg shadow-lg text-center">
              <Lock className="w-6 h-6 text-[#4D3E78] mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Premium Feature</p>
              <p className="text-xs text-gray-500">Upgrade to access</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Insights Modal */}
      {showInsights && (
        <InsightsModal
          category={category}
          title={title}
          onClose={() => setShowInsights(false)}
        />
      )}
    </>
  );
}