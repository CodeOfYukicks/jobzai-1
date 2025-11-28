import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Check, X, RotateCcw } from 'lucide-react';
import { getOpenAIInstance } from '../../../lib/openai';
import { toast } from 'sonner';

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
      toast.error('Please write something first before improving');
      return;
    }

    setIsImproving(true);
    setShowImproved(false);
    
    try {
      const openai = await getOpenAIInstance();
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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
        max_tokens: 1000
      });

      const improved = completion.choices[0]?.message?.content?.trim() || '';
      
      if (improved) {
        setImprovedText(improved);
        setShowImproved(true);
        toast.success('Text improved! Review the changes below.');
      } else {
        toast.error('Failed to improve text. Please try again.');
      }
    } catch (error) {
      console.error('Error improving text with AI:', error);
      toast.error('Failed to improve text. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const acceptImproved = () => {
    setMotivation(improvedText);
    setOriginalText(improvedText);
    setShowImproved(false);
    toast.success('Improved text applied!');
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
          className="w-full p-4 pr-32 border-2 border-gray-200 dark:border-gray-700 rounded-xl
            bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-[#8D75E6]/20 dark:focus:ring-[#7C3AED]/20 focus:border-[#8D75E6] dark:focus:border-[#7C3AED]
            transition-all duration-200 resize-none
            shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
            focus:shadow-md dark:focus:shadow-[0_4px_8px_rgba(141,117,230,0.2),0_2px_4px_rgba(0,0,0,0.3)]"
        />
        
        {/* AI Improve Button - Centered vertically on the right */}
        {motivation.trim() && !showImproved && (
          <button
            onClick={improveWithAI}
            disabled={isImproving}
            className="absolute top-1/2 -translate-y-1/2 right-3 group flex items-center gap-1.5 px-3 py-1.5 
              bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
              border border-gray-200 dark:border-gray-700
              text-gray-600 dark:text-gray-400 rounded-lg 
              text-xs font-medium transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-[#8D75E6]/10 dark:hover:bg-[#8D75E6]/20
              hover:border-[#8D75E6]/40 dark:hover:border-[#8D75E6]/50
              hover:text-[#8D75E6] dark:hover:text-[#A78BFA]
              hover:shadow-md active:scale-[0.98]"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8D75E6] dark:text-[#A78BFA]" />
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

      {/* Improved Text Preview */}
      <AnimatePresence>
        {showImproved && improvedText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-[#8D75E6]/10 to-[#7B64D3]/10 dark:from-[#8D75E6]/20 dark:to-[#7B64D3]/20 
              border-2 border-[#8D75E6] dark:border-[#7C3AED]/50 rounded-xl p-4 space-y-3
              shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.2)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#8D75E6] dark:text-[#A78BFA]" />
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Improved Version</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={acceptImproved}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#8D75E6] dark:bg-[#7C3AED] text-white rounded-lg 
                    text-sm font-medium hover:bg-[#7B64D3] transition-all duration-200
                    shadow-sm hover:shadow-md"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
                <button
                  onClick={rejectImproved}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                    rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {improvedText}
              </p>
            </div>
            {motivation !== originalText && (
              <button
                onClick={revertToOriginal}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 
                  hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
          className="px-8 py-2 bg-[#8D75E6] dark:bg-[#7C3AED] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7D65D6] dark:hover:bg-[#6D28D9] transition-all duration-200
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
