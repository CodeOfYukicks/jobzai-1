import { motion } from 'framer-motion';
import { Building2, MapPin, TrendingUp, ArrowRight, Briefcase } from 'lucide-react';

interface Company {
  name: string;
  matchScore: number;
  industry: string;
  location: string;
  whyMatch: string;
  topRole?: string;
}

interface CareerStep {
  title: string;
  timeline: string;
  description: string;
}

interface NextMoveData {
  summary: string;
  opportunityCount: number;
  topCompanies: Company[];
  careerPath: {
    currentPosition: string;
    targetPosition: string;
    steps: CareerStep[];
  };
}

interface NextMoveInsightProps {
  data?: NextMoveData | null;
}

export default function NextMoveInsight({ data }: NextMoveInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4">
      {/* Top Companies */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" />
          Top Matching Companies
        </h4>
        
        <div className="space-y-3">
          {data.topCompanies?.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group p-4 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg
                border border-transparent hover:border-gray-200 dark:hover:border-gray-700
                transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </h5>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {company.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.location}
                    </span>
                  </div>
                </div>
                
                {/* Match Score */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {company.matchScore}%
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      match
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {company.whyMatch}
              </p>
              
              {company.topRole && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-[#3d3c3e]/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Best fit role: <span className="text-gray-700 dark:text-gray-300 font-medium">{company.topRole}</span>
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Career Path */}
      {data.careerPath && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Recommended Career Path
          </h4>
          
          {/* Path Header */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {data.careerPath.currentPosition}
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {data.careerPath.targetPosition}
            </span>
          </div>
          
          {/* Steps Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200 dark:bg-[#3d3c3e]" />
            
            <div className="space-y-4">
              {data.careerPath.steps?.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="relative flex gap-4 pl-6"
                >
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full 
                    bg-white dark:bg-[#242325] border-2 border-indigo-500 z-10" />
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {step.title}
                      </h5>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {step.timeline}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


