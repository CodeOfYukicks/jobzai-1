import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, ArrowRight, Pencil } from 'lucide-react';
import ProfileAvatar from '../../profile/avatar/ProfileAvatar';
import ProfileAvatarEditor from '../../profile/avatar/ProfileAvatarEditor';
import Avatar from '../../assistant/avatar/Avatar';
import AvatarEditor from '../../assistant/avatar/AvatarEditor';
import { 
  ProfileAvatarConfig, 
  generateRandomConfig as generateRandomProfileConfig 
} from '../../profile/avatar/profileAvatarConfig';
import { 
  AvatarConfig, 
  generateRandomConfig as generateRandomAssistantConfig 
} from '../../assistant/avatar/avatarConfig';

interface AvatarSetupStepProps {
  onNext: (data: { 
    profileAvatarConfig: ProfileAvatarConfig; 
    assistantAvatarConfig: AvatarConfig;
    profileAvatarType: 'avatar';
  }) => void;
  onBack: () => void;
}

export default function AvatarSetupStep({ onNext, onBack }: AvatarSetupStepProps) {
  // User's profile avatar (lorelei style)
  const [profileConfig, setProfileConfig] = useState<ProfileAvatarConfig>(() => ({
    ...generateRandomProfileConfig(),
  }));
  
  // AI assistant avatar (notionists-neutral style)
  const [assistantConfig, setAssistantConfig] = useState<AvatarConfig>(() => ({
    ...generateRandomAssistantConfig(),
  }));

  // Animation states
  const [profileShuffling, setProfileShuffling] = useState(false);
  const [assistantShuffling, setAssistantShuffling] = useState(false);
  
  // Editor modal states
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showAssistantEditor, setShowAssistantEditor] = useState(false);

  // Shuffle user avatar with animation
  const shuffleProfile = useCallback(() => {
    setProfileShuffling(true);
    setTimeout(() => {
      setProfileConfig(generateRandomProfileConfig());
      setProfileShuffling(false);
    }, 300);
  }, []);

  // Shuffle AI avatar with animation
  const shuffleAssistant = useCallback(() => {
    setAssistantShuffling(true);
    setTimeout(() => {
      setAssistantConfig(generateRandomAssistantConfig());
      setAssistantShuffling(false);
    }, 300);
  }, []);

  // Handle continue
  const handleContinue = () => {
    onNext({
      profileAvatarConfig: profileConfig,
      assistantAvatarConfig: assistantConfig,
      profileAvatarType: 'avatar',
    });
  };

  return (
    <div className="space-y-4">
      {/* Avatar Duo Display */}
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-2">
        {/* Connecting Line/Arrow (visible on larger screens) */}
        <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <motion.svg
            width="100"
            height="30"
            viewBox="0 0 100 30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#8D75E6]/30 dark:text-[#A78BFA]/30"
          >
            {/* Lightning bolt connector */}
            <motion.path
              d="M5 15 L30 15 L40 8 L50 22 L60 8 L70 22 L80 15 L95 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
            {/* Arrow head */}
            <motion.path
              d="M90 10 L95 15 L90 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            />
          </motion.svg>
        </div>

        {/* User Avatar Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
        >
          <div
            onClick={shuffleProfile}
            className="group cursor-pointer"
          >
            {/* Card */}
            <div className="relative p-4 sm:p-5 bg-white dark:bg-gray-800/80 rounded-2xl border-2 border-gray-100 dark:border-gray-700
              hover:border-[#8D75E6]/50 dark:hover:border-[#8D75E6]/50
              shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
              hover:shadow-xl dark:hover:shadow-[0_12px_40px_rgba(141,117,230,0.2)]
              transition-all duration-300"
            >
              {/* Sparkle effects on hover */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-4 h-4 text-[#8D75E6] dark:text-[#A78BFA] animate-pulse" />
              </div>
              
              {/* Avatar */}
              <motion.div
                animate={profileShuffling ? { 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 0.9, 1.1, 0.9, 1]
                } : {}}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#8D75E6]/10 to-[#6366F1]/10
                  dark:from-[#8D75E6]/20 dark:to-[#6366F1]/20">
                  <ProfileAvatar config={profileConfig} size={112} className="w-full h-full" />
                </div>
                
                {/* Shuffle indicator */}
                <AnimatePresence>
                  {profileShuffling && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-xl"
                    >
                      <Shuffle className="w-6 h-6 text-[#8D75E6] animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">You</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Click to shuffle
                </p>
              </div>

              {/* Shuffle button overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="p-2.5 bg-[#8D75E6]/90 dark:bg-[#7C3AED]/90 rounded-full shadow-lg">
                  <Shuffle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Customize button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileEditor(true);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 
                bg-gray-50 dark:bg-gray-700/50 hover:bg-[#8D75E6]/10 dark:hover:bg-[#8D75E6]/20
                border border-gray-200 dark:border-gray-600 hover:border-[#8D75E6]/30
                rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 
                hover:text-[#8D75E6] dark:hover:text-[#A78BFA]
                transition-all duration-200"
            >
              <Pencil className="w-3 h-3" />
              Customize
            </button>
          </div>
        </motion.div>

        {/* Mobile connector */}
        <div className="sm:hidden flex items-center gap-2 text-[#8D75E6]/40 dark:text-[#A78BFA]/40">
          <div className="w-6 h-0.5 bg-current rounded-full" />
          <Sparkles className="w-4 h-4" />
          <div className="w-6 h-0.5 bg-current rounded-full" />
        </div>

        {/* AI Assistant Avatar Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div
            onClick={shuffleAssistant}
            className="group cursor-pointer"
          >
            {/* Card */}
            <div className="relative p-4 sm:p-5 bg-white dark:bg-gray-800/80 rounded-2xl border-2 border-gray-100 dark:border-gray-700
              hover:border-[#6366F1]/50 dark:hover:border-[#6366F1]/50
              shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
              hover:shadow-xl dark:hover:shadow-[0_12px_40px_rgba(99,102,241,0.2)]
              transition-all duration-300"
            >
              {/* Sparkle effects on hover */}
              <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-4 h-4 text-[#6366F1] dark:text-[#818CF8] animate-pulse" />
              </div>
              
              {/* AI Badge */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-[#8D75E6] to-[#6366F1] text-white text-xs font-semibold rounded-full shadow-md">
                  AI
                </span>
              </div>
              
              {/* Avatar */}
              <motion.div
                animate={assistantShuffling ? { 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 0.9, 1.1, 0.9, 1]
                } : {}}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#6366F1]/10 to-[#8D75E6]/10
                  dark:from-[#6366F1]/20 dark:to-[#8D75E6]/20">
                  <Avatar config={assistantConfig} size={112} className="w-full h-full" />
                </div>
                
                {/* Shuffle indicator */}
                <AnimatePresence>
                  {assistantShuffling && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-xl"
                    >
                      <Shuffle className="w-6 h-6 text-[#6366F1] animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Your AI Buddy</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Click to shuffle
                </p>
              </div>

              {/* Shuffle button overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="p-2.5 bg-[#6366F1]/90 dark:bg-[#4F46E5]/90 rounded-full shadow-lg">
                  <Shuffle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Customize button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAssistantEditor(true);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 
                bg-gray-50 dark:bg-gray-700/50 hover:bg-[#6366F1]/10 dark:hover:bg-[#6366F1]/20
                border border-gray-200 dark:border-gray-600 hover:border-[#6366F1]/30
                rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 
                hover:text-[#6366F1] dark:hover:text-[#818CF8]
                transition-all duration-200"
            >
              <Pencil className="w-3 h-3" />
              Customize
            </button>
          </div>
        </motion.div>
      </div>

      {/* Fun tagline */}
      <div className="text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          "Together, you'll be unstoppable" ⚡
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium
            transition-colors duration-200"
        >
          Back
        </button>
        
        <button
          onClick={handleContinue}
          className="group px-8 py-3 bg-gradient-to-r from-[#8D75E6] to-[#6366F1] text-white rounded-xl font-medium
            hover:from-[#7D65D6] hover:to-[#5558E3] transition-all duration-200
            shadow-lg shadow-[#8D75E6]/25 dark:shadow-[#8D75E6]/20
            hover:shadow-xl hover:shadow-[#8D75E6]/30
            flex items-center gap-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Profile Avatar Editor Modal */}
      <AnimatePresence>
        {showProfileEditor && (
          <ProfileAvatarEditor
            config={profileConfig}
            onConfigChange={setProfileConfig}
            onClose={() => setShowProfileEditor(false)}
            onSave={() => setShowProfileEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Assistant Avatar Editor Modal */}
      <AnimatePresence>
        {showAssistantEditor && (
          <AvatarEditor
            config={assistantConfig}
            onConfigChange={setAssistantConfig}
            onClose={() => setShowAssistantEditor(false)}
            onSave={() => setShowAssistantEditor(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

