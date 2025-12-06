import { motion } from 'framer-motion';
import { Users, MessageCircle, Linkedin, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Referral {
  type: string;
  description: string;
  actionStep: string;
}

interface OutreachTemplate {
  scenario: string;
  template: string;
}

interface NetworkInsightsData {
  summary: string;
  connectionScore: number;
  potentialReferrals: Referral[];
  outreachTemplates: OutreachTemplate[];
  networkingTips: string[];
  linkedinOptimization: string[];
}

interface NetworkInsightsInsightProps {
  data?: NetworkInsightsData | null;
}

export default function NetworkInsightsInsight({ data }: NetworkInsightsInsightProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your network analysis.
        </p>
      </div>
    );
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-cyan-600 dark:text-cyan-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Network Score */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-500" />
          Network Strength
        </h4>
        
        <div className="p-6 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-xl">
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className={`text-4xl font-bold ${getScoreColor(data.connectionScore)}`}>
                {data.connectionScore}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Network potential
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.connectionScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 rounded-full"
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {data.summary}
          </p>
        </div>
      </section>

      {/* Referral Opportunities */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-cyan-500" />
          Referral Opportunities
        </h4>
        
        <div className="space-y-3">
          {data.potentialReferrals?.map((referral, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-100 dark:border-cyan-800/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-200 dark:bg-cyan-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {referral.type}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {referral.description}
                  </p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 mt-2 font-medium flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {referral.actionStep}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Outreach Templates */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-500" />
          Outreach Templates
        </h4>
        
        <div className="space-y-4">
          {data.outreachTemplates?.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
                  {template.scenario}
                </h5>
                <button
                  onClick={() => copyToClipboard(template.template, index)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copy template"
                >
                  {copiedIndex === index ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{template.template}"
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Networking Tips */}
      {data.networkingTips && data.networkingTips.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-500" />
            Networking Tips
          </h4>
          
          <div className="p-4 bg-white dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700">
            <ul className="space-y-2">
              {data.networkingTips.map((tip, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* LinkedIn Optimization */}
      {data.linkedinOptimization && data.linkedinOptimization.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Optimization
          </h4>
          
          <div className="p-4 bg-[#0A66C2]/5 dark:bg-[#0A66C2]/10 rounded-lg border border-[#0A66C2]/20">
            <ul className="space-y-2">
              {data.linkedinOptimization.map((tip, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-[#0A66C2] mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

