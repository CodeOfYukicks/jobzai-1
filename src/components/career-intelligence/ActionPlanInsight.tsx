import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, DollarSign, Lightbulb, Calendar, AlertTriangle, Wrench } from 'lucide-react';
import { useState } from 'react';

interface Action {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate?: string;
  isCorrective?: boolean;
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
  honestFeedback?: string;
  correctiveActions?: string[];
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  // Separate corrective actions from regular actions
  const correctiveActions = data.weeklyActions?.filter(a => a.isCorrective) || [];
  const regularActions = data.weeklyActions?.filter(a => !a.isCorrective) || [];

  return (
    <div className="space-y-8 pt-4">
      {/* Honest Feedback Section - NEW */}
      {data.honestFeedback && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Priority Assessment
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {data.honestFeedback}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Corrective Actions First - NEW */}
      {correctiveActions.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-500" />
            Corrective Actions (Do These First!)
          </h4>
          
          <div className="space-y-2">
            {correctiveActions.map((action, index) => {
              const isCompleted = completedActions.has(action.id);
              
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => toggleAction(action.id)}
                  className={`
                    p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-l-red-500
                    cursor-pointer select-none
                    transition-all duration-200
                    ${isCompleted ? 'opacity-60' : 'hover:bg-red-100 dark:hover:bg-red-900/30'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-red-300 dark:text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {action.title}
                        </h5>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                          Corrective
                        </span>
                      </div>
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
        </section>
      )}

      {/* Weekly Actions Checklist */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          This Week's Actions
        </h4>
        
        <div className="space-y-2">
          {(correctiveActions.length > 0 ? regularActions : data.weeklyActions)?.map((action, index) => {
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {action.title}
                      </h5>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${getPriorityBadge(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>
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

      {/* Additional Corrective Actions from Analysis - NEW */}
      {data.correctiveActions && data.correctiveActions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Strategy Corrections
          </h4>
          <div className="space-y-2">
            {data.correctiveActions.map((action, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

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
                {data.timing.insight}
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
