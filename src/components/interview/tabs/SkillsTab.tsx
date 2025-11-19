import { memo, useMemo } from 'react';
import { Briefcase, Clock, Award, MessageSquare } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';

interface SkillsTabProps {
  interview: Interview;
  skillRatings: Record<string, number>;
  skillCoach?: Interview['skillCoach'];
  skillGaps: Array<{ skill: string; rating: number; gap: number }>;
  application: { position?: string; companyName?: string };
  handleRateSkill: (skill: string, rating: number) => Promise<void>;
  toggleMicroTask: (skill: string, taskId: string) => Promise<void>;
  ensureDefaultTasks: (skill: string) => Array<{ id: string; label: string; done: boolean }>;
  addStarStory: (skill: string) => Promise<void>;
  updateStarField: (skill: string, storyId: string, field: 'situation' | 'action' | 'result', value: string) => Promise<void>;
  deleteStarStory: (skill: string, storyId: string) => Promise<void>;
  exportStoryToNotes: (skill: string, storyId: string) => void;
  practiceInChat: (skill: string) => void;
}

const SkillsTab = memo(function SkillsTab({
  interview,
  skillRatings,
  skillCoach,
  skillGaps,
  application,
  handleRateSkill,
  toggleMicroTask,
  ensureDefaultTasks,
  addStarStory,
  updateStarField,
  deleteStarStory,
  exportStoryToNotes,
  practiceInChat,
}: SkillsTabProps) {
  const confidenceLabels = useMemo(() => ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'], []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Skills Assessment
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Rate your confidence with each required skill to identify areas for preparation.
          </p>
        </div>
        
        <div className="space-y-4">
          {interview.preparation?.requiredSkills?.map((skill, index) => {
            const currentRating = skillRatings[skill] || 0;
            
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md"
              >
                <div className="mb-4">
                  <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed pr-2">
                    {skill}
                  </p>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRateSkill(skill, rating)}
                          className={`
                            relative w-10 h-10 rounded-lg transition-all duration-200
                            ${currentRating >= rating
                              ? currentRating === rating
                                ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-md scale-105 ring-2 ring-purple-300 dark:ring-purple-700'
                                : 'bg-purple-400 dark:bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                            }
                          `}
                          aria-label={`Rate ${skill} ${rating} out of 5`}
                          title={`${rating}/5 - ${confidenceLabels[rating - 1]}`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                            {rating}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {currentRating > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                        {currentRating}/5
                      </span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline">
                        {confidenceLabels[currentRating - 1]}
                      </span>
                    </div>
                  )}
                </div>
                
                {currentRating > 0 && (
                  <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentRating / 5) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {(!interview.preparation?.requiredSkills || interview.preparation.requiredSkills.length === 0) && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No skills to assess yet.</p>
              <p className="text-xs mt-1">Analyze a job posting to see required skills.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Skill Coach</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Focus on skills with the biggest gaps. Complete tasks and prepare STAR stories.
          </p>
        </div>
        <div className="space-y-4">
          {skillGaps.map(({ skill, rating, gap }, idx) => (
            <div
              key={skill}
              className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed flex-1">
                    {skill}
                  </h4>
                </div>
                
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                        {rating}/5
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        Gap {gap}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => practiceInChat(skill)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Practise in Chat</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">30‑minute plan</h5>
                </div>
                <div className="space-y-2.5">
                  {ensureDefaultTasks(skill).map(t => (
                    <label
                      key={t.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group/item"
                    >
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleMicroTask(skill, t.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                      <span className={`text-sm text-gray-700 dark:text-gray-300 flex-1 ${
                        t.done ? 'line-through text-gray-400 dark:text-gray-500' : ''
                      }`}>
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">STAR stories</h5>
                </div>
                <div className="space-y-3">
                  {(skillCoach?.starStories?.[skill] || []).map(story => (
                    <div key={story.id} className="space-y-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <textarea
                          rows={3}
                          value={story.situation}
                          onChange={(e) => updateStarField(skill, story.id, 'situation', e.target.value)}
                          placeholder="Situation (context, stakes, constraints)"
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <textarea
                          rows={3}
                          value={story.action}
                          onChange={(e) => updateStarField(skill, story.id, 'action', e.target.value)}
                          placeholder="Action (what you did, how, tools)"
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <textarea
                          rows={3}
                          value={story.result}
                          onChange={(e) => updateStarField(skill, story.id, 'result', e.target.value)}
                          placeholder="Result (impact, metrics, lessons)"
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportStoryToNotes(skill, story.id)}
                          className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                          Export to Notes
                        </button>
                        <button
                          onClick={() => deleteStarStory(skill, story.id)}
                          className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addStarStory(skill)}
                    className="w-full text-sm px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium border border-gray-200 dark:border-gray-600 border-dashed"
                  >
                    + Add story
                  </button>
                </div>
              </div>
            </div>
          ))}
          {skillGaps.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No priority gaps detected.</p>
              <p className="text-xs mt-1">Rate your skills on the left to see improvement areas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SkillsTab;

