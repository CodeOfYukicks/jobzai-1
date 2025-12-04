import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, DollarSign, Lightbulb, Calendar } from 'lucide-react';
import { useState } from 'react';

interface Action {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate?: string;
}

interface TimingInsight {
  bestDays: string[];
  bestTimes: string;
  bestMonths: string[];
  insight: string;
}

interface SalaryInsight {
  range: string;
  average: string;
  tips: string[];
}

interface ActionPlanData {
  summary: string;
  actionCount: number;
  weeklyActions: Action[];
  timing: TimingInsight;
  salary: SalaryInsight;
}

interface ActionPlanInsightProps {
  data?: ActionPlanData | null;
}

export default function ActionPlanInsight({ data }: ActionPlanInsightProps) {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to get your action plan.
        </p>
      </div>
    );
  }

  const toggleAction = (actionId: string) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-green-500';
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Weekly Actions Checklist */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          This Week's Actions
        </h4>
        
        <div className="space-y-2">
          {data.weeklyActions?.map((action, index) => {
            const isCompleted = completedActions.has(action.id);
            
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleAction(action.id)}
                className={`
                  p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border-l-4 ${getPriorityColor(action.priority)}
                  cursor-pointer select-none
                  transition-all duration-200
                  ${isCompleted ? 'opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h5 className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {action.title}
                    </h5>
                    <p className={`text-xs mt-1 ${isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                      {action.description}
                    </p>
                    {action.timeEstimate && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.timeEstimate}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Progress indicator */}
        {data.weeklyActions && data.weeklyActions.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedActions.size / data.weeklyActions.length) * 100}%` }}
                className="h-full bg-green-500 rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedActions.size}/{data.weeklyActions.length}
            </span>
          </div>
        )}
      </section>

      {/* Best Times to Apply */}
      {data.timing && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Best Times to Apply
          </h4>
          
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Days</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.timing.bestDays?.join(', ') || 'Tue - Thu'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Times</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.timing.bestTimes || '9-11 AM'}
                </p>
              </div>
            </div>
            
            {data.timing.bestMonths && data.timing.bestMonths.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Months</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.timing.bestMonths.join(', ')}
                </p>
              </div>
            )}
            
            {data.timing.insight && (
              <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                💡 {data.timing.insight}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Salary Expectations */}
      {data.salary && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            Salary Expectations
          </h4>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Range</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.salary.range}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Market Average</p>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {data.salary.average}
                </p>
              </div>
            </div>
            
            {data.salary.tips && data.salary.tips.length > 0 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Negotiation Tips
                </p>
                <ul className="space-y-1.5">
                  {data.salary.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}


