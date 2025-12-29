import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, Pencil, X } from 'lucide-react';
import ProfileAvatar from '../../../profile/avatar/ProfileAvatar';
import ProfileAvatarEditor from '../../../profile/avatar/ProfileAvatarEditor';
import Avatar from '../../../assistant/avatar/Avatar';
import AvatarEditor from '../../../assistant/avatar/AvatarEditor';
import {
    ProfileAvatarConfig,
    generateRandomConfig as generateRandomProfileConfig
} from '../../../profile/avatar/profileAvatarConfig';
import {
    AvatarConfig,
    generateRandomConfig as generateRandomAssistantConfig
} from '../../../assistant/avatar/avatarConfig';

interface MobileAvatarSetupStepProps {
    onDataChange: (data: {
        profileAvatarConfig: ProfileAvatarConfig;
        assistantAvatarConfig: AvatarConfig;
        profileAvatarType: 'avatar';
    }) => void;
}

export default function MobileAvatarSetupStep({ onDataChange }: MobileAvatarSetupStepProps) {
    const [profileConfig, setProfileConfig] = useState<ProfileAvatarConfig>(() => generateRandomProfileConfig());
    const [assistantConfig, setAssistantConfig] = useState<AvatarConfig>(() => generateRandomAssistantConfig());
    const [profileShuffling, setProfileShuffling] = useState(false);
    const [assistantShuffling, setAssistantShuffling] = useState(false);

    // Editor modal states
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [showAssistantEditor, setShowAssistantEditor] = useState(false);

    // Update parent when configs change
    useEffect(() => {
        onDataChange({
            profileAvatarConfig: profileConfig,
            assistantAvatarConfig: assistantConfig,
            profileAvatarType: 'avatar',
        });
    }, [profileConfig, assistantConfig, onDataChange]);

    // Shuffle user avatar
    const shuffleProfile = () => {
        setProfileShuffling(true);
        setTimeout(() => {
            const newConfig = generateRandomProfileConfig();
            setProfileConfig(newConfig);
            setProfileShuffling(false);
        }, 200);
    };

    // Shuffle AI avatar
    const shuffleAssistant = () => {
        setAssistantShuffling(true);
        setTimeout(() => {
            const newConfig = generateRandomAssistantConfig();
            setAssistantConfig(newConfig);
            setAssistantShuffling(false);
        }, 200);
    };

    return (
        <>
            <div className="space-y-8">
                {/* Question */}
                <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight text-center">
                    Create your duo
                </h1>

                {/* Horizontal Avatar Pair */}
                <div className="flex items-center justify-center gap-6">
                    {/* User Avatar */}
                    <div className="flex flex-col items-center">
                        <motion.button
                            onClick={shuffleProfile}
                            whileTap={{ scale: 0.95 }}
                            className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#635bff]/10 to-[#6366F1]/10 
                                dark:from-[#635bff]/20 dark:to-[#6366F1]/20 overflow-hidden
                                border-2 border-transparent hover:border-[#635bff]/30 transition-colors"
                        >
                            <motion.div
                                animate={profileShuffling ? { rotate: [0, -5, 5, 0], scale: [1, 0.95, 1] } : {}}
                                transition={{ duration: 0.2 }}
                            >
                                <ProfileAvatar config={profileConfig} size={96} className="w-full h-full" />
                            </motion.div>
                        </motion.button>
                        <span className="mt-2 text-[13px] font-medium text-gray-600 dark:text-white/60">You</span>
                        {/* Customize button */}
                        <button
                            onClick={() => setShowProfileEditor(true)}
                            className="mt-1 flex items-center gap-1 text-[12px] text-[#635bff] font-medium"
                        >
                            <Pencil className="w-3 h-3" />
                            <span>Customize</span>
                        </button>
                    </div>

                    {/* Connection */}
                    <div className="flex items-center gap-1 text-[#635bff]/40 dark:text-[#A78BFA]/40">
                        <div className="w-4 h-0.5 bg-current rounded-full" />
                        <Sparkles className="w-4 h-4" />
                        <div className="w-4 h-0.5 bg-current rounded-full" />
                    </div>

                    {/* AI Avatar */}
                    <div className="flex flex-col items-center">
                        <motion.button
                            onClick={shuffleAssistant}
                            whileTap={{ scale: 0.95 }}
                            className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6366F1]/10 to-[#635bff]/10 
                                dark:from-[#6366F1]/20 dark:to-[#635bff]/20 overflow-hidden
                                border-2 border-transparent hover:border-[#6366F1]/30 transition-colors"
                        >
                            {/* AI badge */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-[#635bff] to-[#6366F1] text-white rounded-full">
                                    AI
                                </span>
                            </div>
                            <motion.div
                                animate={assistantShuffling ? { rotate: [0, 5, -5, 0], scale: [1, 0.95, 1] } : {}}
                                transition={{ duration: 0.2 }}
                            >
                                <Avatar config={assistantConfig} size={96} className="w-full h-full" />
                            </motion.div>
                        </motion.button>
                        <span className="mt-2 text-[13px] font-medium text-gray-600 dark:text-white/60">Your AI</span>
                        {/* Customize button */}
                        <button
                            onClick={() => setShowAssistantEditor(true)}
                            className="mt-1 flex items-center gap-1 text-[12px] text-[#635bff] font-medium"
                        >
                            <Pencil className="w-3 h-3" />
                            <span>Customize</span>
                        </button>
                    </div>
                </div>

                {/* Hint */}
                <p className="text-center text-[13px] text-gray-400 dark:text-white/40">
                    Tap avatars to shuffle
                </p>
            </div>

            {/* Profile Avatar Editor Modal */}
            <AnimatePresence>
                {showProfileEditor && (
                    <ProfileAvatarEditor
                        config={profileConfig}
                        onConfigChange={setProfileConfig}
                        onClose={() => setShowProfileEditor(false)}
                    />
                )}
            </AnimatePresence>

            {/* AI Avatar Editor Modal */}
            <AnimatePresence>
                {showAssistantEditor && (
                    <AvatarEditor
                        config={assistantConfig}
                        onConfigChange={setAssistantConfig}
                        onClose={() => setShowAssistantEditor(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
