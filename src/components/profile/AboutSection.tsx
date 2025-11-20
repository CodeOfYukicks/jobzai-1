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
      icon={<FileText className="w-5 h-5" />}
      completion={completion}
      onEdit={() => setIsEditing(true)}
      isCollapsible={true}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1.5">
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
                className="w-full px-4 py-3 pr-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none text-sm leading-relaxed focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
              />

              {/* AI Improve Button - Premium glass style */}
              {summary.trim() && !showImproved && (
                <motion.button
                  onClick={improveWithAI}
                  disabled={isImproving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-3 right-3 group flex items-center gap-1.5 px-3 py-1.5 
                    bg-gray-900 text-white
                    rounded-lg text-xs font-medium transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-gray-800
                    active:scale-[0.98]"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Improving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                      <span>Improve with AI</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Improved Text Preview */}
            <AnimatePresence>
              {showImproved && improvedText && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  className="mt-3 glass-panel rounded-xl p-4 space-y-3 shadow-glow-sm relative overflow-hidden"
                >
                  {/* Sparkle effect background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/50 dark:bg-gray-700/20 rounded-full blur-3xl"></div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Sparkles className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">AI Improved Version</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        onClick={acceptImproved}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </motion.button>
                      <motion.button
                        onClick={rejectImproved}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 
                          rounded-lg text-xs font-medium hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </motion.button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {improvedText}
                    </p>
                  </div>
                  {summary !== originalText && (
                    <motion.button
                      onClick={revertToOriginal}
                      whileHover={{ x: -2 }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 
                        hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Revert to original
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Key Highlights
            </label>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 group"
                >
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></div>
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      placeholder="Add a key highlight or achievement"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  {highlights.length > 1 && (
                    <motion.button
                      onClick={() => removeHighlight(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50/80 dark:hover:bg-red-900/20 backdrop-blur-sm rounded-lg transition-all duration-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
              <motion.button
                onClick={addHighlight}
                whileHover={{ x: 5 }}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium flex items-center gap-1.5"
              >
                <span className="text-base">+</span> Add Highlight
              </motion.button>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Save
            </motion.button>
            <motion.button
              onClick={() => setIsEditing(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {summary ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              No summary added yet. Click edit to add your professional summary.
            </p>
          )}

          {highlights.filter(h => h.trim() !== '').length > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Key Highlights
              </h3>
              <ul className="space-y-1.5">
                {highlights
                  .filter(h => h.trim() !== '')
                  .map((highlight, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400 mt-0.5">•</span>
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

