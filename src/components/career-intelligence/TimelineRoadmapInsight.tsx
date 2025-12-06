import { motion } from 'framer-motion';
import { Clock, Target, Calendar, CheckCircle2, Circle, ArrowRight, TrendingUp } from 'lucide-react';

interface Milestone {
  title: string;
  timeline: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface TimelineData {
  summary: string;
  estimatedTimeToGoal: string;
  successProbability: number;
  milestones: Milestone[];
  weeklyFocus: string;
  thirtyDayPlan: string;
  sixtyDayPlan: string;
  ninetyDayPlan: string;
}

interface TimelineRoadmapInsightProps {
  data?: TimelineData | null;
}

export default function TimelineRoadmapInsight({ data }: TimelineRoadmapInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your career timeline.
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress':
        return <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Circle className="w-5 h-5 text-teal-500 fill-teal-500" />
        </motion.div>;
      default:
        return <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (probability >= 50) return 'text-teal-600 dark:text-teal-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Time to Goal */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-500" />
          Time to Goal
        </h4>
        
        <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                {data.estimatedTimeToGoal}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Estimated timeline
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getProbabilityColor(data.successProbability)}`}>
                {data.successProbability}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Success probability
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {data.summary}
          </p>
        </div>
      </section>

      {/* Milestones */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-500" />
          Key Milestones
        </h4>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          <div className="space-y-4">
            {data.milestones?.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4"
              >
                <div className="relative z-10 flex-shrink-0 bg-white dark:bg-gray-900">
                  {getStatusIcon(milestone.status)}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {milestone.title}
                    </h5>
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-medium px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 rounded">
                      {milestone.timeline}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* This Week's Focus */}
      {data.weeklyFocus && (
        <section className="p-4 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h5 className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase">
              This Week's Focus
            </h5>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {data.weeklyFocus}
          </p>
        </section>
      )}

      {/* 30/60/90 Day Plan */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-500" />
          Your 30/60/90 Day Plan
        </h4>
        
        <div className="space-y-3">
          {/* 30 Days */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border-l-4 border-l-teal-400"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">30</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Days</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data.thirtyDayPlan}
            </p>
          </motion.div>
          
          {/* 60 Days */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border-l-4 border-l-cyan-400"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">60</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Days</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data.sixtyDayPlan}
            </p>
          </motion.div>
          
          {/* 90 Days */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border-l-4 border-l-emerald-400"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">90</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Days</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {data.ninetyDayPlan}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

