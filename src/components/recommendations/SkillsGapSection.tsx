import { motion } from 'framer-motion';
import { GraduationCap, AlertCircle, BookOpen, Clock, Loader2, TrendingUp } from 'lucide-react';

interface SkillsGapSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function SkillsGapSection({
  data,
  isLoading,
  error,
  onRefresh
}: SkillsGapSectionProps) {
  const skillsGap = data?.skills_gap;

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              Skills Gap Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Identify skills to develop and strengthen
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              Skills Gap Analysis
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

  if (!skillsGap) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
              Skills Gap Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Identify skills to develop and strengthen
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No skills gap analysis available. Complete your profile to get recommendations.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
            Skills Gap Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Critical skills missing and learning paths to acquire them
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Critical Missing Skills */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Critical Missing Skills
            </h3>
            {skillsGap.critical_missing_skills && skillsGap.critical_missing_skills.length > 0 ? (
              <div className="space-y-4">
                {skillsGap.critical_missing_skills.map((skill: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {skill.skill}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        skill.priority === 'High'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : skill.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {skill.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {skill.importance}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {skill.salary_impact && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Salary Impact:</span>
                          <p className="font-semibold text-gray-900 dark:text-white">{skill.salary_impact}</p>
                        </div>
                      )}
                      {skill.opportunity_impact && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Opportunity Impact:</span>
                          <p className="font-semibold text-gray-900 dark:text-white">{skill.opportunity_impact}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>Current: {skill.current_level || 'None'}</span>
                      <span>→</span>
                      <span>Required: {skill.required_level}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">No critical missing skills identified.</p>
              </div>
            )}
          </div>

          {/* Skills to Strengthen */}
          {skillsGap.skills_to_strengthen && skillsGap.skills_to_strengthen.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Skills to Strengthen
              </h3>
              <div className="space-y-3">
                {skillsGap.skills_to_strengthen.map((skill: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {skill.skill}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{skill.current_level}</span>
                        <span>→</span>
                        <span className="font-semibold">{skill.target_level}</span>
                      </div>
                    </div>
                    {skill.actions && skill.actions.length > 0 && (
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {skill.actions.map((action: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Learning Plans */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Learning Plans
            </h3>
            {skillsGap.learning_plans && skillsGap.learning_plans.length > 0 ? (
              <div className="space-y-4">
                {skillsGap.learning_plans.map((plan: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {plan.skill}
                    </h4>
                    
                    {/* Time to Master */}
                    {plan.time_to_master && (
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Time to master: {plan.time_to_master}</span>
                      </div>
                    )}

                    {/* Free Resources */}
                    {plan.free_resources && plan.free_resources.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Free Resources:
                        </p>
                        <ul className="space-y-1">
                          {plan.free_resources.slice(0, 3).map((resource: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Paid Resources */}
                    {plan.paid_resources && plan.paid_resources.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Paid Resources:
                        </p>
                        <ul className="space-y-1">
                          {plan.paid_resources.slice(0, 2).map((resource: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Projects */}
                    {plan.projects && plan.projects.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Practical Projects:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {plan.projects.slice(0, 2).map((project: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {project}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">No learning plans available.</p>
              </div>
            )}
          </div>

          {/* Emerging Skills */}
          {skillsGap.emerging_skills && skillsGap.emerging_skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Emerging Skills
              </h3>
              <div className="space-y-3">
                {skillsGap.emerging_skills.map((skill: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {skill.skill}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                        {skill.when_to_start}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {skill.demand_trend}
                    </p>
                    <p className="text-xs text-gray-500">
                      {skill.future_opportunities}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}





