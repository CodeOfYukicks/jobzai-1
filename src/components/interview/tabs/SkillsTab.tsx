import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, Award, MessageSquare, ArrowUp, Check, CheckCircle2, AlertCircle, TrendingUp, Target, Sparkles, Loader2, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import { generateStarStory } from '../../../services/starStoryGenerator';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

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
  const { currentUser } = useAuth();
  const [generatingForSkill, setGeneratingForSkill] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<Record<string, string>>({});
  const confidenceLabels = useMemo(() => ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'], []);

  // Group skills by readiness level
  const groupedSkills = useMemo(() => {
    const skills = interview.preparation?.requiredSkills || [];
    
    const ready: Array<{ skill: string; rating: number }> = [];
    const needsWork: Array<{ skill: string; rating: number }> = [];
    const critical: Array<{ skill: string; rating: number }> = [];
    
    skills.forEach(skill => {
      const rating = skillRatings[skill] || 0;
      const skillData = { skill, rating };
      
      if (rating >= 4) {
        ready.push(skillData);
      } else if (rating >= 2) {
        needsWork.push(skillData);
      } else {
        critical.push(skillData);
      }
    });
    
    return { ready, needsWork, critical };
  }, [interview.preparation?.requiredSkills, skillRatings]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = interview.preparation?.requiredSkills?.length || 0;
    const assessed = Object.keys(skillRatings).filter(skill => 
      interview.preparation?.requiredSkills?.includes(skill)
    ).length;
    
    return {
      total,
      assessed,
      ready: groupedSkills.ready.length,
      needsWork: groupedSkills.needsWork.length,
      critical: groupedSkills.critical.length,
    };
  }, [interview.preparation?.requiredSkills, skillRatings, groupedSkills]);

  // Get all skills in order (not grouped, not sorted by gap)
  const allSkills = useMemo(() => {
    return interview.preparation?.requiredSkills || [];
  }, [interview.preparation?.requiredSkills]);

  // Helper to get gap info for a skill
  const getSkillGap = (skill: string) => {
    return skillGaps.find(g => g.skill === skill);
  };

  // Helper to get skill readiness category
  const getSkillCategory = (rating: number) => {
    if (rating >= 4) return 'ready';
    if (rating >= 2) return 'needsWork';
    return 'critical';
  };

  // Handle AI STAR story generation
  const handleGenerateStarStory = async (skill: string) => {
    if (!currentUser?.uid) {
      toast.error('You must be logged in to generate STAR stories');
      return;
    }

    setGeneratingForSkill(skill);
    setGenerationError(prev => ({ ...prev, [skill]: '' }));

    try {
      const result = await generateStarStory({
        userId: currentUser.uid,
        skill,
        jobDescription: interview.jobPostContent || interview.preparation?.positionDetails || '',
        position: application.position,
        companyName: application.companyName,
      });

      if (result.success && result.story) {
        // Verify all three fields are present
        if (!result.story.situation || !result.story.action || !result.story.result) {
          console.warn('⚠️ Incomplete STAR story received from API:', {
            hasSituation: !!result.story.situation,
            hasAction: !!result.story.action,
            hasResult: !!result.story.result,
            story: result.story
          });
        }
        
        const storyContent = {
          situation: result.story.situation || '',
          action: result.story.action || '',
          result: result.story.result || '',
        };
        
        console.log('💾 Generated STAR story content for skill:', skill, {
          situationLength: storyContent.situation.length,
          actionLength: storyContent.action.length,
          resultLength: storyContent.result.length,
        });
        
        // Create the story with all three fields populated atomically
        await addStarStory(skill, storyContent);
        
        console.log('✅ STAR story created with all fields populated');
        toast.success(`STAR story generated for ${skill}!`);
      } else if (result.message) {
        // No relevant experience found
        setGenerationError(prev => ({ ...prev, [skill]: result.message || '' }));
      } else if (result.error) {
        // API returned an error
        const errorMessage = result.error;
        setGenerationError(prev => ({ ...prev, [skill]: errorMessage }));
        toast.error(errorMessage);
      } else {
        throw new Error(result.error || 'Failed to generate STAR story');
      }
    } catch (error: any) {
      console.error('Error generating STAR story:', error);
      const errorMessage = error.message || 'Failed to generate STAR story. Please try again.';
      setGenerationError(prev => ({ ...prev, [skill]: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setGeneratingForSkill(null);
    }
  };

  // Helper to render skill assessment card
  const renderSkillAssessment = (skill: string, rating: number, index: number) => {
    const category = getSkillCategory(rating);
    const borderColor = category === 'critical' ? 'border-red-200/40 dark:border-red-800/40 hover:border-red-300/60 dark:hover:border-red-700/60' :
                        category === 'needsWork' ? 'border-amber-200/40 dark:border-amber-800/40 hover:border-amber-300/60 dark:hover:border-amber-700/60' :
                        'border-emerald-200/40 dark:border-emerald-800/40 hover:border-emerald-300/60 dark:hover:border-emerald-700/60';
    const buttonColor = category === 'critical' ? 
      { active: 'bg-red-600 dark:bg-red-500', filled: 'bg-red-400/80 dark:bg-red-600/80', hover: 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400' } :
      category === 'needsWork' ?
      { active: 'bg-amber-600 dark:bg-amber-500', filled: 'bg-amber-400/80 dark:bg-amber-600/80', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400' } :
      { active: 'bg-emerald-600 dark:bg-emerald-500', filled: 'bg-emerald-400/80 dark:bg-emerald-600/80', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400' };
    const badgeColor = category === 'critical' ? 'bg-red-50/60 dark:bg-red-900/30 border-red-200/40 dark:border-red-800/40 text-red-700 dark:text-red-300' :
                       category === 'needsWork' ? 'bg-amber-50/60 dark:bg-amber-900/30 border-amber-200/40 dark:border-amber-800/40 text-amber-700 dark:text-amber-300' :
                       'bg-emerald-50/60 dark:bg-emerald-900/30 border-emerald-200/40 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300';
    const progressColor = category === 'critical' ? 'bg-red-100/60 dark:bg-red-900/40 from-red-500 to-red-600' :
                           category === 'needsWork' ? 'bg-amber-100/60 dark:bg-amber-900/40 from-amber-500 to-amber-600' :
                           'bg-emerald-100/60 dark:bg-emerald-900/40 from-emerald-500 to-emerald-600';
            
            return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`group/skill relative rounded-lg border ${borderColor} bg-transparent px-3.5 py-2.5 transition-all`}
      >
        <div className="mb-2.5">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {skill}
                  </p>
                </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <motion.button
                  key={r}
                  onClick={() => handleRateSkill(skill, r)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                          className={`
                    relative w-8 h-8 rounded-md transition-all duration-200 text-xs font-medium
                    ${rating >= r
                      ? rating === r
                        ? `${buttonColor.active} text-white`
                        : `${buttonColor.filled} text-white`
                      : `bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 ${buttonColor.hover}`
                    }
                  `}
                  aria-label={`Rate ${skill} ${r} out of 5`}
                  title={`${r}/5 - ${confidenceLabels[r - 1]}`}
                >
                  {r}
                </motion.button>
                      ))}
                    </div>
                  </div>
                  
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border ${badgeColor}`}
            >
              <span className="text-xs font-medium">
                {rating}/5
                      </span>
              <span className="text-xs hidden sm:inline">
                {confidenceLabels[rating - 1]}
                      </span>
            </motion.div>
          )}
      </div>
      
        {rating > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`mt-2 h-1 ${progressColor.split(' ')[0]} rounded-full overflow-hidden`}
          >
            <div
              className={`h-full bg-gradient-to-r ${progressColor.split(' ').slice(-2).join(' ')} rounded-full transition-all duration-300`}
              style={{ width: `${(rating / 5) * 100}%` }}
            />
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Helper to render skill coach card
  const renderSkillCoach = (skill: string, rating: number, gap: number | undefined, index: number) => {
    if (!gap && gap !== 0) {
      // No gap means skill is ready, show minimal coach card or empty state
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 + 0.01 }}
          className="group/skill relative rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-transparent px-4 py-3"
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mb-2" />
            <p className="text-xs font-medium text-neutral-900 dark:text-white mb-1">Skill is ready</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">No improvement needed</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 + 0.01 }}
        className="group/skill relative rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-transparent px-4 py-3 hover:border-purple-300/60 dark:hover:border-purple-700/60 transition-all"
      >
        <div className="mb-3">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex-1">
                    {skill}
                  </h4>
                </div>
                
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50/60 dark:bg-purple-900/30 border border-purple-200/40 dark:border-purple-800/40">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {rating}/5
                      </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">•</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        Gap {gap}
                      </span>
                    </div>
                  </div>
                  
            <motion.button
                    onClick={() => practiceInChat(skill)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Practice</span>
            </motion.button>
                </div>
              </div>
              
        <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <h5 className="text-xs font-semibold text-neutral-900 dark:text-white">30‑minute plan</h5>
                </div>
          <div className="space-y-1.5">
                  {ensureDefaultTasks(skill).map(t => (
              <div
                      key={t.id}
                className={[
                  'flex items-center rounded-md px-2.5 py-1.5 text-xs transition-all border',
                  t.done
                    ? 'border-neutral-200/40 dark:border-neutral-800/40 bg-neutral-50/40 dark:bg-neutral-900/30'
                    : 'border-neutral-200/60 dark:border-neutral-800/60 bg-transparent hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => toggleMicroTask(skill, t.id)}
                  className={[
                    'mr-2 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all',
                    t.done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-purple-500 dark:hover:border-purple-500',
                  ].join(' ')}
                >
                  {t.done && <Check className="h-2.5 w-2.5" />}
                </button>
                <span className={[
                  'flex-1 bg-transparent text-xs outline-none',
                  t.done
                    ? 'text-neutral-500 line-through dark:text-neutral-400'
                    : 'text-neutral-800 dark:text-neutral-100',
                ].join(' ')}>
                        {t.label}
                      </span>
              </div>
                  ))}
                </div>
              </div>
              
        <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <h5 className="text-xs font-semibold text-neutral-900 dark:text-white">STAR stories</h5>
                </div>
          <div className="space-y-2">
                  {(skillCoach?.starStories?.[skill] || []).map(story => (
              <div key={story.id} className="space-y-2 p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <textarea
                    rows={2}
                          value={story.situation}
                          onChange={(e) => updateStarField(skill, story.id, 'situation', e.target.value)}
                    placeholder="Situation"
                    className="w-full rounded-md border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-white/5 px-2.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:text-neutral-50 dark:placeholder:text-neutral-500 resize-y"
                        />
                        <textarea
                    rows={2}
                          value={story.action}
                          onChange={(e) => updateStarField(skill, story.id, 'action', e.target.value)}
                    placeholder="Action"
                    className="w-full rounded-md border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-white/5 px-2.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:text-neutral-50 dark:placeholder:text-neutral-500 resize-y"
                        />
                        <textarea
                    rows={2}
                          value={story.result}
                          onChange={(e) => updateStarField(skill, story.id, 'result', e.target.value)}
                    placeholder="Result"
                    className="w-full rounded-md border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-white/5 px-2.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 dark:text-neutral-50 dark:placeholder:text-neutral-500 resize-y"
                        />
                      </div>
                <div className="flex gap-1.5">
                  <motion.button
                          onClick={() => exportStoryToNotes(skill, story.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-md bg-neutral-100/60 dark:bg-white/10 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-white/20 transition-colors"
                  >
                    Export
                  </motion.button>
                  <motion.button
                          onClick={() => deleteStarStory(skill, story.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-md bg-red-50/60 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Delete
                  </motion.button>
                      </div>
                    </div>
                  ))}
            
            {/* Error message */}
            {generationError[skill] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-md border px-2.5 py-2 ${
                  generationError[skill].toLowerCase().includes('network') || 
                  generationError[skill].toLowerCase().includes('server') ||
                  generationError[skill].toLowerCase().includes('connect') ||
                  generationError[skill].toLowerCase().includes('endpoint')
                    ? 'border-red-200/60 bg-red-50/60 dark:border-red-800/60 dark:bg-red-900/20'
                    : 'border-amber-200/60 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-900/20'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  <AlertCircleIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                    generationError[skill].toLowerCase().includes('network') || 
                    generationError[skill].toLowerCase().includes('server') ||
                    generationError[skill].toLowerCase().includes('connect') ||
                    generationError[skill].toLowerCase().includes('endpoint')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-xs font-medium mb-0.5 ${
                      generationError[skill].toLowerCase().includes('network') || 
                      generationError[skill].toLowerCase().includes('server') ||
                      generationError[skill].toLowerCase().includes('connect') ||
                      generationError[skill].toLowerCase().includes('endpoint')
                        ? 'text-red-900 dark:text-red-200'
                        : 'text-amber-900 dark:text-amber-200'
                    }`}>
                      {generationError[skill].toLowerCase().includes('network') || 
                       generationError[skill].toLowerCase().includes('server') ||
                       generationError[skill].toLowerCase().includes('connect') ||
                       generationError[skill].toLowerCase().includes('endpoint')
                        ? 'Connection Error'
                        : 'No relevant experience found'}
                    </p>
                    <p className={`text-[10px] ${
                      generationError[skill].toLowerCase().includes('network') || 
                      generationError[skill].toLowerCase().includes('server') ||
                      generationError[skill].toLowerCase().includes('connect') ||
                      generationError[skill].toLowerCase().includes('endpoint')
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {generationError[skill]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-1.5">
              <motion.button
                onClick={() => handleGenerateStarStory(skill)}
                disabled={generatingForSkill === skill}
                whileHover={{ scale: generatingForSkill === skill ? 1 : 1.02 }}
                whileTap={{ scale: generatingForSkill === skill ? 1 : 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-purple-200/60 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-900/30 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100/60 hover:border-purple-300/60 transition-all dark:text-purple-300 dark:hover:bg-purple-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingForSkill === skill ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate with AI</span>
                  </>
                )}
              </motion.button>
              <motion.button
                    onClick={() => addStarStory(skill)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-dashed border-neutral-200/60 dark:border-neutral-800/60 bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40 transition-colors font-medium"
                  >
                    + Add story
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {summaryStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="group relative rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 bg-transparent px-4 py-3 transition-all duration-200 dark:bg-transparent"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50/60 dark:bg-emerald-900/30 border border-emerald-200/40 dark:border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {summaryStats.ready} ready
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50/60 dark:bg-amber-900/30 border border-amber-200/40 dark:border-amber-800/40">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {summaryStats.needsWork} need practice
                  </span>
                </div>
                {summaryStats.critical > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50/60 dark:bg-red-900/30 border border-red-200/40 dark:border-red-800/40">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      {summaryStats.critical} critical gap{summaryStats.critical !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">
                Skills Readiness
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {summaryStats.assessed}/{summaryStats.total} assessed
              </div>
            </div>
        </div>
        </motion.div>
      )}

      {/* Skills - Each skill paired with its coach card */}
      {allSkills.length > 0 ? (
        <div className="space-y-4">
          {allSkills.map((skill, index) => {
            const rating = skillRatings[skill] || 0;
            const gapInfo = getSkillGap(skill);
            const gap = gapInfo?.gap;

            return (
              <div key={skill} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Assessment Card */}
                {renderSkillAssessment(skill, rating, index)}
                
                {/* Coach Card */}
                {renderSkillCoach(skill, rating, gap, index)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200/60 dark:border-neutral-800/60 bg-transparent px-4 py-8 text-center">
          <Briefcase className="mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-0.5 text-xs font-medium text-neutral-900 dark:text-white">No skills to assess yet</p>
          <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            Analyze a job posting to see required skills.
          </p>
          <button
            type="button"
            onClick={() =>
              (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
            }
            className="inline-flex items-center justify-center gap-1 rounded-md bg-purple-50/80 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800/60 transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
            Analyze a job posting
          </button>
      </div>
      )}
    </div>
  );
});

export default SkillsTab;
