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
          rows={5}
          placeholder="Example: I'm looking to transition from my current role in marketing to a product management position. I'm particularly interested in tech companies with strong mentorship programs..."
          className="w-full p-4 pb-12 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-0
            transition-colors resize-none text-[15px]"
        />

        {/* AI Improve Button - Subtle */}
        {motivation.trim() && !showImproved && (
          <button
            onClick={improveWithAI}
            disabled={isImproving}
            className="absolute bottom-3 right-3 group flex items-center gap-1.5 px-2 py-1 
              text-gray-400 dark:text-gray-500 rounded 
              text-xs font-medium transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Improving...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                <span>Improve with AI</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Improved Text Preview - Cleaner */}
      <AnimatePresence>
        {showImproved && improvedText && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3
              border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">AI Suggestion</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={rejectImproved}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={acceptImproved}
                  className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-sm font-medium
                    hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Improved text content */}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {improvedText}
            </p>

            {/* Revert option */}
            {motivation !== originalText && (
              <button
                onClick={revertToOriginal}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 
                  hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Revert
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => motivation.trim() && onNext({ motivation: motivation.trim() })}
          disabled={!motivation.trim() || isSubmitting}
          className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
            flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>
      </div>
    </div>
  );
}

