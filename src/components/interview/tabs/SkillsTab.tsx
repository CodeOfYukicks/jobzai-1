import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Award, MessageSquare, ArrowUp, CheckCircle2, Sparkles, Loader2, AlertCircle as AlertCircleIcon, Trash2, FileText, Plus, Wand2 } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { generateStarStory } from '../../../services/starStoryGenerator';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';

interface SkillsTabProps {
  interview: Interview;
  skillRatings: Record<string, number>;
  skillCoach?: Interview['skillCoach'];
  skillGaps: Array<{ skill: string; rating: number; gap: number }>;
  application: { position?: string; companyName?: string };
  handleRateSkill: (skill: string, rating: number) => Promise<void>;
  addStarStory: (skill: string, initialContent?: { situation: string; action: string; result: string }) => Promise<void>;
  updateStarField: (skill: string, storyId: string, field: 'situation' | 'action' | 'result', value: string) => Promise<void>;
  deleteStarStory: (skill: string, storyId: string) => Promise<void>;
  exportStoryToNotes: (skill: string, storyId: string) => void; // This now opens the modal instead of directly exporting
  practiceInChat: (skill: string) => void;
}

// Premium Confidence Slider Component
const ConfidenceSlider = memo(function ConfidenceSlider({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (rating: number) => void;
  labels: string[];
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const getTrackGradient = (val: number) => {
    if (val === 0) return 'from-slate-300 to-slate-300 dark:from-slate-600 dark:to-slate-600';
    if (val <= 2) return 'from-amber-400 to-amber-500';
    if (val <= 3) return 'from-jobzai-400 to-jobzai-500';
    return 'from-emerald-400 to-emerald-500';
  };

  const getThumbColor = (val: number) => {
    if (val === 0) return 'bg-slate-400 dark:bg-slate-500';
    if (val <= 2) return 'bg-amber-500';
    if (val <= 3) return 'bg-jobzai-500';
    return 'bg-emerald-500';
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handlePointClick = (point: number) => {
    onChange(point);
  };

  return (
    <div 
      className="relative py-5 px-2"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Track Container */}
      <div className="relative h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
        {/* Filled Track */}
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getTrackGradient(value)}`}
          initial={false}
          animate={{ width: `${(value / 5) * 100}%` }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
        
        {/* Snap Point Markers */}
        <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
          {[0, 1, 2, 3, 4, 5].map((point) => (
            <div
              key={point}
              className={`
                w-3 h-3 rounded-full transition-all duration-200 border-2
                ${value >= point 
                  ? 'bg-white border-white shadow-sm' 
                  : 'bg-neutral-300 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-600'
                }
                ${point === value ? 'scale-0' : 'scale-100'}
              `}
            />
          ))}
        </div>

        {/* Clickable Areas for Snap Points */}
        <div className="absolute inset-0 flex justify-between items-center">
          {[0, 1, 2, 3, 4, 5].map((point) => (
            <button
              key={point}
              onClick={() => handlePointClick(point)}
              className="w-6 h-6 rounded-full cursor-pointer hover:bg-neutral-500/10 transition-colors z-10"
              aria-label={`Set confidence to ${point}`}
            />
          ))}
        </div>

        {/* Native Range Input for Dragging */}
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={value}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          aria-label="Confidence level"
        />

        {/* Custom Thumb */}
        <motion.div
          className={`
            absolute top-1/2 pointer-events-none
            w-5 h-5 rounded-full shadow-lg
            ${getThumbColor(value)}
            ring-[3px] ring-white dark:ring-neutral-900
          `}
          style={{ 
            left: `calc(${(value / 5) * 100}% - 10px)`,
            y: '-50%'
          }}
          initial={false}
          animate={{ 
            scale: isDragging ? 1.2 : isHovering ? 1.1 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-4 -mx-1">
        <button 
          onClick={() => handlePointClick(0)}
          className={`text-[11px] transition-all duration-200 hover:text-neutral-600 dark:hover:text-neutral-300 px-1 ${
            value === 0 
              ? 'text-neutral-900 dark:text-white font-semibold' 
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          Not rated
        </button>
        {labels.map((label, i) => (
          <button 
            key={i}
            onClick={() => handlePointClick(i + 1)}
            className={`text-[11px] transition-all duration-200 hover:text-neutral-600 dark:hover:text-neutral-300 px-1 ${
              value === i + 1 
                ? 'text-neutral-900 dark:text-white font-semibold' 
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
});

const SkillsTab = memo(function SkillsTab({
  interview,
  skillRatings,
  skillCoach,
  skillGaps,
  application,
  handleRateSkill,
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
    const avgRating = assessed > 0 
      ? Object.entries(skillRatings)
          .filter(([skill]) => interview.preparation?.requiredSkills?.includes(skill))
          .reduce((acc, [, rating]) => acc + rating, 0) / assessed
      : 0;
    
    return {
      total,
      assessed,
      ready: groupedSkills.ready.length,
      needsWork: groupedSkills.needsWork.length,
      critical: groupedSkills.critical.length,
      avgRating: Math.round(avgRating * 10) / 10,
      readinessPercent: total > 0 ? Math.round((groupedSkills.ready.length / total) * 100) : 0,
    };
  }, [interview.preparation?.requiredSkills, skillRatings, groupedSkills]);

  // Get all skills in order
  const allSkills = useMemo(() => {
    return interview.preparation?.requiredSkills || [];
  }, [interview.preparation?.requiredSkills]);

  // Helper to get gap info for a skill
  const getSkillGap = (skill: string) => {
    return skillGaps.find(g => g.skill === skill);
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
        
        await addStarStory(skill, storyContent);
        toast.success(`STAR story generated for ${skill}!`);
      } else if (result.message) {
        setGenerationError(prev => ({ ...prev, [skill]: result.message || '' }));
      } else if (result.error) {
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

  // Get confidence level badge styling
  const getConfidenceBadge = (rating: number) => {
    if (rating === 0) return { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500 dark:text-neutral-400', label: 'Not rated' };
    if (rating <= 2) return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', label: confidenceLabels[rating - 1] };
    if (rating === 3) return { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: confidenceLabels[rating - 1] };
    return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: confidenceLabels[rating - 1] };
  };

  // Render premium unified skill card
  const renderUnifiedSkillCard = (skill: string, rating: number, gap: number | undefined, index: number) => {
    const starStories = skillCoach?.starStories?.[skill] || [];
    const badge = getConfidenceBadge(rating);
    const hasGap = gap !== undefined && gap > 0;

    return (
      <motion.div
        key={skill}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="group relative rounded-2xl bg-white/80 dark:bg-[#1a1b1e] backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden border border-transparent dark:border-white/[0.04]"
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug flex-1">
            {skill}
          </h3>
            <div className="flex items-center gap-2">
              {/* Practice Button - Only show when there's a gap */}
              {hasGap && (
                  <motion.button
                  onClick={() => practiceInChat(skill)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 4px 10px rgba(99, 91, 255, 0.3)' }}
                >
                  <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover/btn:opacity-10" />
                  <MessageSquare className="w-3 h-3 relative z-10" />
                  <span className="relative z-10">Practice</span>
                  </motion.button>
              )}
              {/* Confidence Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg}`}
              >
                <span className={`text-xs font-medium ${badge.text}`}>
                  {rating > 0 ? `${rating}/5` : ''} {badge.label}
                </span>
              </motion.div>
            </div>
          </div>
          
          {/* Confidence Slider */}
          <ConfidenceSlider
            value={rating}
            onChange={(r) => handleRateSkill(skill, r)}
            labels={confidenceLabels}
          />
        </div>

        {/* Ready State - Only show when no gap and high rating */}
        {!hasGap && rating >= 4 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Ready for interview</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Your confidence level is high</p>
              </div>
            </div>
          </div>
        )}

        {/* STAR Stories Section */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-jobzai-500" />
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                STAR Stories
              </h4>
              {starStories.length > 0 && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  ({starStories.length})
                </span>
              )}
            </div>
          </div>

          {/* Existing Stories */}
          {starStories.length > 0 && (
            <div className="space-y-4 mb-4">
              {starStories.map((story, storyIndex) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: storyIndex * 0.05 }}
                  className="group/story rounded-xl bg-neutral-50/80 dark:bg-[#141517] p-4 hover:bg-neutral-100/80 dark:hover:bg-[#1a1b1e] transition-colors border border-transparent dark:border-white/[0.03]"
                >
                  {/* 3-Column Grid for S, A, R */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {[
                      { key: 'situation', label: 'Situation', placeholder: 'Context and challenge...' },
                      { key: 'action', label: 'Action', placeholder: 'What you did...' },
                      { key: 'result', label: 'Result', placeholder: 'Impact and metrics...' },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {field.label}
                      </label>
                      <textarea
                          rows={4}
                          value={story[field.key as keyof typeof story] as string}
                          onChange={(e) => updateStarField(skill, story.id, field.key as 'situation' | 'action' | 'result', e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border-0 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:ring-2 focus:ring-jobzai-500/30 focus:outline-none transition-all"
                      />
                    </div>
                    ))}
                  </div>

                  {/* Story Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60">
                    <motion.button
                      onClick={() => exportStoryToNotes(skill, story.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="group/export relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 transition-all hover:bg-neutral-200 dark:hover:bg-neutral-600"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export to Notes</span>
                    </motion.button>
                    <motion.button
                      onClick={() => deleteStarStory(skill, story.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all opacity-0 group-hover/story:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5">
            <motion.button
              onClick={() => handleGenerateStarStory(skill)}
              disabled={generatingForSkill === skill}
              whileHover={{ scale: generatingForSkill === skill ? 1 : 1.02 }}
              whileTap={{ scale: generatingForSkill === skill ? 1 : 0.98 }}
              className="group/gen relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)' }}
            >
              <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover/gen:opacity-10" />
              
              {generatingForSkill === skill ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
                  <span className="relative z-10">Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">Generate with AI</span>
                  <Sparkles className="w-3 h-3 text-jobzai-200 relative z-10" />
                </>
              )}
            </motion.button>
            <motion.button
              onClick={() => addStarStory(skill)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group/add relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition-all hover:border-jobzai-300 hover:text-jobzai-600 dark:hover:border-jobzai-600 dark:hover:text-jobzai-400"
            >
              <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover/add:rotate-90" />
              <span>Add Manually</span>
            </motion.button>
          </div>

          {/* Error Message */}
          {generationError[skill] && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl px-4 py-3 mt-3 ${
                generationError[skill].toLowerCase().includes('network') || 
                generationError[skill].toLowerCase().includes('server') ||
                generationError[skill].toLowerCase().includes('connect') ||
                generationError[skill].toLowerCase().includes('endpoint')
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-amber-50 dark:bg-amber-900/20'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  generationError[skill].toLowerCase().includes('network') || 
                  generationError[skill].toLowerCase().includes('server') ||
                  generationError[skill].toLowerCase().includes('connect') ||
                  generationError[skill].toLowerCase().includes('endpoint')
                    ? 'text-red-500'
                    : 'text-amber-500'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    generationError[skill].toLowerCase().includes('network') || 
                    generationError[skill].toLowerCase().includes('server') ||
                    generationError[skill].toLowerCase().includes('connect') ||
                    generationError[skill].toLowerCase().includes('endpoint')
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {generationError[skill].toLowerCase().includes('network') || 
                     generationError[skill].toLowerCase().includes('server') ||
                     generationError[skill].toLowerCase().includes('connect') ||
                     generationError[skill].toLowerCase().includes('endpoint')
                      ? 'Connection Error'
                      : 'No relevant experience found'}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    generationError[skill].toLowerCase().includes('network') || 
                    generationError[skill].toLowerCase().includes('server') ||
                    generationError[skill].toLowerCase().includes('connect') ||
                    generationError[skill].toLowerCase().includes('endpoint')
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-amber-600 dark:text-amber-300'
                  }`}>
                    {generationError[skill]}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };
            
            return (
    <div className="space-y-5">
      {/* Premium Summary Card */}
      {summaryStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative rounded-2xl bg-white/80 dark:bg-[#1a1b1e] backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden border border-transparent dark:border-white/[0.04]"
        >
          {/* Progress Bar Background */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-neutral-100 dark:bg-neutral-800">
            <motion.div
              className="h-full bg-gradient-to-r from-jobzai-500 to-jobzai-600"
              initial={{ width: 0 }}
              animate={{ width: `${summaryStats.readinessPercent}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            />
                </div>
                
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Ready */}
            <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">{summaryStats.ready}</span> ready
                  </span>
                </div>
                {/* Need Practice */}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">{summaryStats.needsWork}</span> need practice
                  </span>
                </div>
                {/* Critical */}
                {summaryStats.critical > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="font-semibold text-neutral-900 dark:text-white">{summaryStats.critical}</span> critical
                    </span>
                  </div>
                )}
              </div>

            <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Overall Readiness</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {summaryStats.readinessPercent}%
                </p>
              </div>
            </div>
        </div>
        </motion.div>
      )}

      {/* Skills List */}
      {allSkills.length > 0 ? (
        <div className="space-y-4">
          {allSkills.map((skill, index) => {
            const rating = skillRatings[skill] || 0;
            const gapInfo = getSkillGap(skill);
            const gap = gapInfo?.gap;

            return renderUnifiedSkillCard(skill, rating, gap, index);
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl bg-white/80 dark:bg-[#1a1b1e] backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none px-8 py-12 text-center border border-transparent dark:border-white/[0.04]"
        >
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">No skills to assess yet</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5 max-w-xs">
            Analyze a job posting to automatically extract the required skills for this role.
          </p>
          <motion.button
            type="button"
            onClick={() =>
              (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
            }
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group/analyze relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 4px 14px rgba(99, 91, 255, 0.35)' }}
          >
            <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 group-hover/analyze:opacity-10" />
            <ArrowUp className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Analyze Job Posting</span>
            <Sparkles className="w-3.5 h-3.5 text-jobzai-200 relative z-10" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
});

export default SkillsTab;
