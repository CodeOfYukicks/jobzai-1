import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Check, X, RotateCcw } from 'lucide-react';
import { getOpenAIInstance } from '../../../lib/openai';
import { notify } from '@/lib/notify';

interface MotivationStepProps {
  value: string;
  onNext: (data: { motivation: string }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function MotivationStep({ value, onNext, onBack, isSubmitting }: MotivationStepProps) {
  const [motivation, setMotivation] = useState(value);
  const [originalText, setOriginalText] = useState(value);
  const [isImproving, setIsImproving] = useState(false);
  const [showImproved, setShowImproved] = useState(false);
  const [improvedText, setImprovedText] = useState('');

  const improveWithAI = async () => {
    if (!motivation.trim()) {
      notify.error('Please write something first before improving');
      return;
    }

    setIsImproving(true);
    setShowImproved(false);

    try {
      const openai = await getOpenAIInstance();

      const completion = await openai.chat.completions.create({
        model: "gpt-5.1", // Updated from gpt-4o (Nov 2025)
        messages: [
          {
            role: "system",
            content: `You are a professional career coach and writing expert. Your task is to improve and refine career motivation statements while maintaining the original meaning and intent.

Guidelines:
1. Keep the same meaning and core message
2. Make the text more professional, clear, and impactful
3. Improve grammar, flow, and structure
4. Make it more concise if possible, but don't lose important details
5. Maintain a professional yet authentic tone
6. Keep it focused on career goals and motivations
7. Don't add information that wasn't in the original text

Return only the improved text, nothing else.`
          },
          {
            role: "user",
            content: `Improve the following career motivation statement:\n\n${motivation}`
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 1000
      });

      const improved = completion.choices[0]?.message?.content?.trim() || '';

      if (improved) {
        setImprovedText(improved);
        setShowImproved(true);
        notify.success('Text improved! Review the changes below.');
      } else {
        notify.error('Failed to improve text. Please try again.');
      }
    } catch (error) {
      console.error('Error improving text with AI:', error);
      notify.error('Failed to improve text. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const acceptImproved = () => {
    setMotivation(improvedText);
    setOriginalText(improvedText);
    setShowImproved(false);
    notify.success('Improved text applied!');
  };

  const rejectImproved = () => {
    setShowImproved(false);
    setImprovedText('');
  };

  const revertToOriginal = () => {
    setMotivation(originalText);
    setShowImproved(false);
    setImprovedText('');
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <textarea
          value={motivation}
          onChange={(e) => {
            setMotivation(e.target.value);
            if (!showImproved) {
              setOriginalText(e.target.value);
            }
          }}
          rows={6}
          placeholder="Example: I'm looking to transition from my current role in marketing to a product management position. I'm particularly interested in tech companies with strong mentorship programs..."
          className="w-full p-4 pb-12 border border-gray-200 dark:border-gray-700 rounded-xl
            bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-[#635bff]/20 dark:focus:ring-[#635bff]/20 focus:border-[#635bff] dark:focus:border-[#635bff]
            transition-all duration-200 resize-none
            shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
        />

        {/* AI Improve Button - Bottom right corner, integrated */}
        {motivation.trim() && !showImproved && (
          <button
            onClick={improveWithAI}
            disabled={isImproving}
            className="absolute bottom-3 right-3 group flex items-center gap-1.5 px-2.5 py-1.5 
              text-gray-400 dark:text-gray-500 rounded-md 
              text-xs font-medium transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:text-[#635bff] dark:hover:text-[#635bff]
              hover:bg-[#635bff]/5 dark:hover:bg-[#635bff]/10"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Improving...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                <span>Improve with AI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Improved Text Preview - Notion-style minimal design */}
      <AnimatePresence>
        {showImproved && improvedText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 space-y-4
              border border-gray-200 dark:border-gray-700
              shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#635bff]/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[#635bff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Suggestion</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Review the improved version below</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={rejectImproved}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 
                    hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 
                    rounded-lg transition-all duration-150"
                >
                  Dismiss
                </button>
                <button
                  onClick={acceptImproved}
                  className="px-4 py-1.5 bg-[#635bff] text-white rounded-lg 
                    text-sm font-medium hover:bg-[#5147e5] transition-all duration-150
                    shadow-sm hover:shadow-md"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Improved text content */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {improvedText}
              </p>
            </div>

            {/* Revert option */}
            {motivation !== originalText && (
              <button
                onClick={revertToOriginal}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Revert to original
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => motivation.trim() && onNext({ motivation: motivation.trim() })}
          disabled={!motivation.trim() || isSubmitting}
          className="px-8 py-2 bg-[#635bff] dark:bg-[#7C3AED] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:brightness-110 dark:hover:brightness-110 transition-all duration-200
            shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
            hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]
            flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Complete Profile</span>
          )}
        </button>
      </div>
    </div>
  );
}
