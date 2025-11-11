import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Edit2, X, Loader2, Sparkles, Check, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { getOpenAIInstance } from '../../lib/openai';
import ProfileSectionCard from './ProfileSectionCard';

interface AboutSectionProps {
  onUpdate?: (data: any) => void;
}

const AboutSection = ({ onUpdate }: AboutSectionProps) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [isImproving, setIsImproving] = useState(false);
  const [showImproved, setShowImproved] = useState(false);
  const [improvedText, setImprovedText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Charger professionalSummary, about, ou motivation (depuis l'inscription)
          let loadedSummary = userData.professionalSummary || userData.about || '';
          
          // Si pas de summary mais qu'il y a une motivation depuis l'inscription, l'utiliser
          if (!loadedSummary && userData.motivation) {
            loadedSummary = userData.motivation;
            // Migrer automatiquement motivation vers professionalSummary
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                professionalSummary: userData.motivation
              });
            } catch (error) {
              console.error('Error migrating motivation to professionalSummary:', error);
            }
          }
          
          setSummary(loadedSummary);
          setOriginalText(loadedSummary);
          setHighlights(
            userData.highlights && userData.highlights.length > 0
              ? userData.highlights
              : ['']
          );
        }
      } catch (error) {
        console.error('Error loading about data:', error);
      }
    };

    loadData();
  }, [currentUser]);

  const improveWithAI = async () => {
    if (!summary.trim()) {
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
            content: `You are a professional career coach and writing expert. Your task is to improve and refine professional summary statements while maintaining the original meaning and intent.

Guidelines:
1. Keep the same meaning and core message
2. Make the text more professional, clear, and impactful
3. Improve grammar, flow, and structure
4. Make it more concise if possible, but don't lose important details
5. Maintain a professional yet authentic tone
6. Keep it focused on professional background, skills, and career goals
7. Don't add information that wasn't in the original text

Return only the improved text, nothing else.`
          },
          {
            role: "user",
            content: `Improve the following professional summary:\n\n${summary}`
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
    setSummary(improvedText);
    setOriginalText(improvedText);
    setShowImproved(false);
    setImprovedText('');
    toast.success('Improved text applied!');
  };

  const rejectImproved = () => {
    setShowImproved(false);
    setImprovedText('');
  };

  const revertToOriginal = () => {
    setSummary(originalText);
    setShowImproved(false);
    setImprovedText('');
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        professionalSummary: summary,
        highlights: highlights.filter(h => h.trim() !== '')
      });

      if (onUpdate) {
        onUpdate({
          professionalSummary: summary,
          highlights: highlights.filter(h => h.trim() !== '')
        });
      }

      setIsEditing(false);
      toast.success('About section updated');
    } catch (error) {
      console.error('Error updating about:', error);
      toast.error('Failed to update about section');
    }
  };

  const addHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const hasContent = summary.trim() !== '' || highlights.some(h => h.trim() !== '');
  const completion = hasContent ? 100 : 0;

  return (
    <ProfileSectionCard
      title="About"
      icon={<FileText className="w-6 h-6" />}
      completion={completion}
      onEdit={() => setIsEditing(true)}
      isCollapsible={true}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Professional Summary
            </label>
            <div className="relative">
              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (!showImproved) {
                    setOriginalText(e.target.value);
                  }
                }}
                placeholder="Write a brief summary of your professional background, skills, and career goals..."
                rows={5}
                className="w-full px-4 py-3 pr-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none transition-all duration-200"
              />
              
              {/* AI Improve Button - Centered vertically on the right */}
              {summary.trim() && !showImproved && (
                <button
                  onClick={improveWithAI}
                  disabled={isImproving}
                  className="absolute top-1/2 -translate-y-1/2 right-3 group flex items-center gap-1.5 px-3 py-1.5 
                    bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                    border border-gray-200 dark:border-gray-700
                    text-gray-600 dark:text-gray-400 rounded-lg 
                    text-xs font-medium transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-purple-50 dark:hover:bg-purple-900/20
                    hover:border-purple-300 dark:hover:border-purple-600
                    hover:text-purple-600 dark:hover:text-purple-400
                    hover:shadow-md active:scale-[0.98]"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600 dark:text-purple-400" />
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
                  className="mt-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 
                    border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 space-y-3
                    shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">AI Improved Version</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={acceptImproved}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg 
                          text-sm font-medium hover:bg-purple-700 transition-all duration-200
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
                  {summary !== originalText && (
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Key Highlights
            </label>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-purple-600 dark:text-purple-400">•</span>
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      placeholder="Add a key highlight or achievement"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  {highlights.length > 1 && (
                    <button
                      onClick={() => removeHighlight(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addHighlight}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                + Add Highlight
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {summary ? (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              No summary added yet. Click edit to add your professional summary.
            </p>
          )}

          {highlights.filter(h => h.trim() !== '').length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Key Highlights
              </h3>
              <ul className="space-y-2">
                {highlights
                  .filter(h => h.trim() !== '')
                  .map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ProfileSectionCard>
  );
};

export default AboutSection;

