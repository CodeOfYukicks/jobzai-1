import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit2, Camera } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notify } from '@/lib/notify';
import ProfilePhotoCropper from '../ProfilePhotoCropper';
import {
    ProfileAvatar,
    ProfileAvatarEditor,
    ProfileAvatarSelector,
    ProfileAvatarConfig,
    ProfileAvatarType,
    DEFAULT_PROFILE_AVATAR_CONFIG,
    generateRandomConfig,
} from '../avatar';

interface MobileProfileHeaderProps {
    onUpdate?: (data: any) => void;
}

/**
 * Mobile-optimized profile header
 * - Centered avatar with edit action
 * - Name (primary), role (secondary), location (muted)
 * - No cover image
 * - Single edit action on avatar only
 */
export default function MobileProfileHeader({ onUpdate }: MobileProfileHeaderProps) {
    const { currentUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Avatar state
    const [avatarType, setAvatarType] = useState<ProfileAvatarType>('photo');
    const [avatarConfig, setAvatarConfig] = useState<ProfileAvatarConfig>(DEFAULT_PROFILE_AVATAR_CONFIG);
    const [editingAvatarConfig, setEditingAvatarConfig] = useState<ProfileAvatarConfig>(DEFAULT_PROFILE_AVATAR_CONFIG);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        headline: '',
        city: '',
        country: '',
        profilePhoto: '',
    });

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser?.uid) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfileData({
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        headline: userData.headline || userData.targetPosition || '',
                        city: userData.city || '',
                        country: userData.country || '',
                        profilePhoto: userData.profilePhoto || '',
                    });

                    if (userData.profileAvatarType) {
                        setAvatarType(userData.profileAvatarType);
                    }
                    if (userData.profileAvatarConfig) {
                        setAvatarConfig(userData.profileAvatarConfig);
                    }
                }
            } catch (error) {
                console.error('Error loading profile data:', error);
            }
        };

        loadData();
    }, [currentUser]);

    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim() || 'Your Name';
    const location = profileData.city && profileData.country
        ? `${profileData.city}, ${profileData.country}`
        : profileData.city || profileData.country || '';

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file || !currentUser?.uid) return;
        setSelectedPhotoFile(file);
        setIsCropperOpen(true);
    };

    const handleCroppedPhoto = async (blob: Blob) => {
        if (!currentUser?.uid) return;
        setIsUploading(true);
        try {
            const fileName = selectedPhotoFile?.name?.replace(/\.[^/.]+$/, '') || 'photo';
            const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}_${fileName}.jpg`);
            await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
            const photoUrl = await getDownloadURL(photoRef);

            await updateDoc(doc(db, 'users', currentUser.uid), {
                profilePhoto: photoUrl,
                profileAvatarType: 'photo'
            });

            setProfileData(prev => ({ ...prev, profilePhoto: photoUrl }));
            setAvatarType('photo');
            if (onUpdate) {
                onUpdate({ profilePhoto: photoUrl });
            }
            notify.success('Profile photo updated');
        } catch (error) {
            console.error('Error uploading photo:', error);
            notify.error('Failed to upload photo');
        } finally {
            setIsUploading(false);
            setIsCropperOpen(false);
            setSelectedPhotoFile(null);
        }
    };

    const handleAvatarConfigChange = useCallback((newConfig: ProfileAvatarConfig) => {
        setEditingAvatarConfig(newConfig);
    }, []);

    const handleSaveAvatar = useCallback(async () => {
        if (!currentUser?.uid) return;

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                profileAvatarConfig: editingAvatarConfig,
                profileAvatarType: 'avatar'
            });
            setAvatarConfig(editingAvatarConfig);
            setAvatarType('avatar');
            if (onUpdate) {
                onUpdate({ profileAvatarConfig: editingAvatarConfig, profileAvatarType: 'avatar' });
            }
            notify.success('Avatar saved!');
        } catch (error) {
            console.error('Error saving avatar:', error);
            notify.error('Failed to save avatar');
        }
    }, [currentUser, editingAvatarConfig, onUpdate]);

    const handleSelectPhoto = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleSelectAvatar = useCallback(() => {
        if (!avatarConfig.hair || avatarConfig.hair.length === 0) {
            const newConfig = generateRandomConfig();
            setEditingAvatarConfig(newConfig);
        } else {
            setEditingAvatarConfig(avatarConfig);
        }
        setShowAvatarEditor(true);
    }, [avatarConfig]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center py-8 px-4"
            >
                {/* Centered Avatar */}
                <div className="relative mb-5">
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAvatarSelector(true)}
                        className="relative w-24 h-24 rounded-full bg-white dark:bg-[#2b2a2c] p-1 shadow-lg cursor-pointer"
                    >
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                            {avatarType === 'avatar' && avatarConfig.hair ? (
                                <ProfileAvatar
                                    config={avatarConfig}
                                    size={88}
                                    className="w-full h-full"
                                />
                            ) : profileData.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                    <User className="w-10 h-10" />
                                </div>
                            )}

                            {/* Upload overlay */}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Edit badge */}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#635BFF] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#242325]">
                            <Camera className="w-4 h-4 text-white" />
                        </div>
                    </motion.div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploading}
                    />

                    {/* Avatar Selector */}
                    <ProfileAvatarSelector
                        isOpen={showAvatarSelector}
                        onClose={() => setShowAvatarSelector(false)}
                        onSelectPhoto={handleSelectPhoto}
                        onSelectAvatar={handleSelectAvatar}
                        currentType={avatarType}
                        hasExistingPhoto={!!profileData.profilePhoto}
                        hasExistingAvatar={!!(avatarConfig.hair && avatarConfig.hair.length > 0)}
                    />
                </div>

                {/* Name - Primary */}
                <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    {fullName}
                </h1>

                {/* Headline - Secondary */}
                {profileData.headline && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 text-center max-w-[280px] leading-snug">
                        {profileData.headline}
                    </p>
                )}

                {/* Location - Muted */}
                {location && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
                        {location}
                    </p>
                )}
            </motion.div>

            {/* Photo Cropper Modal */}
            <ProfilePhotoCropper
                isOpen={isCropperOpen}
                file={selectedPhotoFile}
                onClose={() => {
                    setIsCropperOpen(false);
                    setSelectedPhotoFile(null);
                }}
                onCropped={handleCroppedPhoto}
                exportSize={512}
            />

            {/* Avatar Editor */}
            <AnimatePresence>
                {showAvatarEditor && (
                    <ProfileAvatarEditor
                        config={editingAvatarConfig}
                        onConfigChange={handleAvatarConfigChange}
                        onClose={() => setShowAvatarEditor(false)}
                        onSave={handleSaveAvatar}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
