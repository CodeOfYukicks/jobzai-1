import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Mail, Edit2, Camera, Image, Linkedin, Check, X, Sparkles, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { toast } from 'sonner';
import ProfilePhotoCropper from './ProfilePhotoCropper';
import CoverPhotoCropper from './CoverPhotoCropper';
import CoverPhotoGallery from './CoverPhotoGallery';
import { CompactProgressRing } from './ui/ProgressRing';

interface ProfileHeaderProps {
  onUpdate?: (data: any) => void;
  completionPercentage?: number;
  onLinkedInClick?: () => void;
  onImportCV?: () => void;
  isImportingCV?: boolean;
  hasCvText?: boolean;
}

const ProfileHeader = ({ onUpdate, completionPercentage = 0, onLinkedInClick, onImportCV, isImportingCV = false, hasCvText = false }: ProfileHeaderProps) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    profilePhoto: '',
    coverPhoto: '',
    email: ''
  });

  // Edit mode form data
  const [editFormData, setEditFormData] = useState(formData);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newFormData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            headline: userData.headline || userData.targetPosition || '',
            location: userData.city && userData.country
              ? `${userData.city}, ${userData.country}`
              : userData.city || userData.country || '',
            profilePhoto: userData.profilePhoto || '',
            coverPhoto: userData.coverPhoto || '',
            email: userData.email || currentUser.email || ''
          };
          setFormData(newFormData);
          setEditFormData(newFormData);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadData();
  }, [currentUser]);

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
        profilePhoto: photoUrl
      });

      setFormData(prev => ({ ...prev, profilePhoto: photoUrl }));
      if (onUpdate) {
        onUpdate({ profilePhoto: photoUrl });
      }
      toast.success('Profile photo updated');
    } catch (error) {
      console.error('Error uploading cropped photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
      setIsCropperOpen(false);
      setSelectedPhotoFile(null);
    }
  };

  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file || !currentUser?.uid) return;
    setSelectedCoverFile(file);
    setIsCoverCropperOpen(true);
  };

  const handleCroppedCover = async (blob: Blob) => {
    if (!currentUser?.uid) return;
    setIsUploadingCover(true);
    try {
      const baseName = (selectedCoverFile instanceof File ? selectedCoverFile.name.replace(/\.[^/.]+$/, '') : 'cover');
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${Date.now()}_${baseName}.jpg`);
      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        coverPhoto: coverUrl
      });

      setFormData(prev => ({ ...prev, coverPhoto: coverUrl }));
      if (onUpdate) {
        onUpdate({ coverPhoto: coverUrl });
      }
      toast.success('Cover photo updated');
    } catch (error) {
      console.error('Error uploading cropped cover:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
      setIsCoverCropperOpen(false);
      setSelectedCoverFile(null);
    }
  };

  const handleStartEdit = () => {
    setEditFormData(formData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditFormData(formData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      const [city, country] = editFormData.location.split(', ').map(s => s.trim());
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        headline: editFormData.headline,
        city: city || '',
        country: country || editFormData.location || ''
      });

      setFormData(editFormData);
      
      if (onUpdate) {
        onUpdate({
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          headline: editFormData.headline,
          city: city || '',
          country: country || editFormData.location || ''
        });
      }

      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || 'Your Name';
  const isComplete = completionPercentage === 100;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/50 shadow-lg"
    >
      {/* Cover Photo Area - Taller for more impact */}
      <div className="relative h-44 sm:h-52 overflow-hidden group">
        {/* Cover Photo or Premium Gradient Background */}
        {formData.coverPhoto ? (
          <>
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
              src={formData.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90">
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
          </div>
        )}

        {/* Cover Photo Controls */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-black/30 hover:bg-black/50 text-white text-xs font-medium rounded-xl backdrop-blur-md transition-all border border-white/10">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={isUploadingCover}
            />
            {isUploadingCover ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Image className="w-4 h-4" />
                <span>{formData.coverPhoto ? 'Change Cover' : 'Add Cover'}</span>
              </>
            )}
          </label>
          <button
            onClick={() => setIsCoverGalleryOpen(true)}
            className="px-3 py-2 bg-black/30 hover:bg-black/50 text-white text-xs font-medium rounded-xl backdrop-blur-md transition-all border border-white/10"
          >
            Gallery
          </button>
        </div>

        {/* Completion Badge - Top Left */}
        <div className="absolute top-4 left-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border
              ${isComplete 
                ? 'bg-green-500/20 border-green-400/30 text-white' 
                : 'bg-black/30 border-white/10 text-white'
              }
            `}
          >
            {isComplete ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold">Profile Complete</span>
              </>
            ) : (
              <>
                <CompactProgressRing progress={completionPercentage} size={20} strokeWidth={2.5} />
                <span className="text-xs font-semibold">{completionPercentage}% Complete</span>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating Profile Card */}
      <div className="relative px-6 pb-6">
        {/* Profile Photo - Floating over cover */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
          <motion.div
            className="relative z-10 group/photo"
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl ring-4 ring-white dark:ring-gray-800 overflow-hidden">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                {formData.profilePhoto ? (
                  <img
                    src={formData.profilePhoto}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <User className="w-16 h-16" />
                  </div>
                )}
                
                {/* Hover overlay for photo upload */}
                <AnimatePresence>
                  {isHoveringPhoto && (
                    <motion.label
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-white">
                          <Camera className="w-6 h-6" />
                          <span className="text-xs font-medium">Change Photo</span>
                        </div>
                      )}
                    </motion.label>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Camera button - Always visible on mobile */}
            <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg sm:opacity-0 sm:group-hover/photo:opacity-100">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Camera className="w-4 h-4" />
            </label>
          </motion.div>

          {/* Name and Info */}
          <div className="flex-1 pt-2 sm:pt-0 sm:pb-2">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <div
                  key="editing"
                  className="space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    value={editFormData.headline}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Professional headline (e.g., Senior Product Manager)"
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Location (e.g., Paris, France)"
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 outline-none transition-all"
                  />
                  <div className="flex gap-2 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div
                  key="display"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    {fullName}
                  </h1>
                  {formData.headline && (
                    <p className="text-base text-gray-700 dark:text-gray-200 mt-1 font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {formData.headline}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {formData.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{formData.location}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>{formData.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 sm:pb-2">
              {/* Import from CV Button */}
              {hasCvText && onImportCV && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onImportCV}
                  disabled={isImportingCV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImportingCV ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Importing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Import from CV</span>
                      <span className="sm:hidden">CV</span>
                    </>
                  )}
                </motion.button>
              )}
              
              {/* LinkedIn Import Button */}
              {onLinkedInClick && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLinkedInClick}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] text-white text-sm font-semibold rounded-xl hover:bg-[#004182] transition-colors shadow-sm"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="hidden sm:inline">Import from LinkedIn</span>
                  <span className="sm:hidden">LinkedIn</span>
                </motion.button>
              )}
              
              {/* Edit Profile Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* AI Suggestion Banner - Show when profile is incomplete */}
        {completionPercentage < 50 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30"
          >
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800/50">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Complete your profile to unlock AI-powered features
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                A complete profile helps us match you with better opportunities and generate personalized applications.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>

    {/* Cropper Modals - Rendered outside motion.div to avoid overflow clipping */}
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
    <CoverPhotoCropper
      isOpen={isCoverCropperOpen}
      file={selectedCoverFile}
      onClose={() => {
        setIsCoverCropperOpen(false);
        setSelectedCoverFile(null);
      }}
      onCropped={handleCroppedCover}
      exportWidth={1584}
      exportHeight={396}
    />
    <CoverPhotoGallery
      isOpen={isCoverGalleryOpen}
      onClose={() => setIsCoverGalleryOpen(false)}
      onSelectBlob={(blob) => {
        setSelectedCoverFile(blob);
        setIsCoverGalleryOpen(false);
        setIsCoverCropperOpen(true);
      }}
    />
    </>
  );
};

export default ProfileHeader;
