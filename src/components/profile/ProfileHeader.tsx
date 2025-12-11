import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Edit2, Camera, Image, Check, X, Sparkles, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { notify } from '@/lib/notify';
import ProfilePhotoCropper from './ProfilePhotoCropper';
import CoverPhotoCropper from './CoverPhotoCropper';
import CoverPhotoGallery from './CoverPhotoGallery';
import { CompactProgressRing } from './ui/ProgressRing';
import { CompanyLogo } from '../common/CompanyLogo';
import { InstitutionLogo } from '../common/InstitutionLogo';

interface ProfileHeaderProps {
  onUpdate?: (data: any) => void;
  completionPercentage?: number;
  onImportCV?: () => void;
  isImportingCV?: boolean;
}

interface CurrentPosition {
  company: string;
  title: string;
}

interface CurrentEducation {
  institution: string;
  degree: string;
}

const ProfileHeader = ({ onUpdate, completionPercentage = 0, onImportCV, isImportingCV = false }: ProfileHeaderProps) => {
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
  const coverButtonRef = useRef<HTMLButtonElement>(null);
  const [currentPosition, setCurrentPosition] = useState<CurrentPosition | null>(null);
  const [currentEducation, setCurrentEducation] = useState<CurrentEducation | null>(null);
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

          // Get current position (first current experience or most recent)
          if (userData.professionalHistory && userData.professionalHistory.length > 0) {
            const currentExp = userData.professionalHistory.find((exp: any) => exp.current) 
              || userData.professionalHistory[0];
            if (currentExp) {
              setCurrentPosition({
                company: currentExp.company,
                title: currentExp.title
              });
            }
          }

          // Get current education (first current or most recent)
          if (userData.educations && userData.educations.length > 0) {
            const currentEdu = userData.educations.find((edu: any) => edu.current)
              || userData.educations[0];
            if (currentEdu) {
              setCurrentEducation({
                institution: currentEdu.institution,
                degree: currentEdu.degree
              });
            }
          }
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
      notify.success('Profile photo updated');
    } catch (error) {
      console.error('Error uploading cropped photo:', error);
      notify.error('Failed to upload photo');
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
      notify.success('Cover photo updated');
    } catch (error) {
      console.error('Error uploading cropped cover:', error);
      notify.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
      setIsCoverCropperOpen(false);
      setSelectedCoverFile(null);
    }
  };

  // Handle direct cover apply from gallery (no cropper)
  const handleDirectApplyCover = async (blob: Blob) => {
    if (!currentUser?.uid) return;
    setIsUploadingCover(true);
    try {
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${Date.now()}_gallery.jpg`);
      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        coverPhoto: coverUrl
      });

      setFormData(prev => ({ ...prev, coverPhoto: coverUrl }));
      if (onUpdate) {
        onUpdate({ coverPhoto: coverUrl });
      }
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      notify.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
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
      notify.success('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      notify.error('Failed to update profile');
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
      className="relative overflow-hidden rounded-xl bg-white dark:bg-[#2b2a2c]/95 border border-gray-200 dark:border-[#3d3c3e]"
    >
      {/* Cover Photo Area */}
      <div className="relative h-48 sm:h-52 overflow-hidden group">
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
            {/* Subtle gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        )}

        {/* Cover Photo Controls */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 z-20">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-full backdrop-blur-md transition-all shadow-sm">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={isUploadingCover}
            />
            {isUploadingCover ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>{formData.coverPhoto ? 'Change' : 'Add'}</span>
              </>
            )}
          </label>
          <button
            ref={coverButtonRef}
            onClick={() => setIsCoverGalleryOpen(true)}
            className="px-3 py-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-full backdrop-blur-md transition-all shadow-sm"
          >
            <Image className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Photo - LinkedIn style circular, overlapping cover - OUTSIDE the cover container */}
      <div className="absolute top-32 sm:top-36 left-6 z-20">
          <motion.div
            className="relative group/photo"
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Circular profile photo with white ring - LinkedIn signature */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#2b2a2c] p-1 shadow-lg ring-4 ring-white dark:ring-gray-800">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
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
                      className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer rounded-full"
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
                          <span className="text-xs font-medium">Change</span>
                        </div>
                      )}
                    </motion.label>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Camera button - Always visible on mobile */}
            <label className="absolute bottom-1 right-1 bg-white dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-200 p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-[#4a494b] transition-colors shadow-md border border-gray-200 dark:border-[#4a494b] sm:opacity-0 sm:group-hover/photo:opacity-100">
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
      </div>

      {/* Content below cover - LinkedIn style layout */}
      <div className="relative pt-28 pb-5 px-6">
        {/* Top right action button - Edit */}
        <div className="absolute top-4 right-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartEdit}
            className="p-2.5 bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-[#4a494b] transition-colors"
            title="Edit profile"
          >
            <Edit2 className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Main content area - Name, headline, location on left; Company/Education on right */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left side - Profile info */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    value={editFormData.headline}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Professional headline (e.g., Consultant at Accenture | CRM Specialist)"
                    className="w-full px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Location (e.g., Paris, Île-de-France, France)"
                    className="w-full px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                  <div className="flex gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] text-white text-sm font-semibold rounded-full hover:bg-[#004182] transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-[#4a494b] text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-full hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Name - Large and bold like LinkedIn */}
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {fullName}
                  </h1>
                  
                  {/* Headline - Normal weight, can wrap */}
                  {formData.headline && (
                    <p className="text-base text-gray-700 dark:text-gray-200 mt-1 leading-snug max-w-xl">
                      {formData.headline}
                    </p>
                  )}
                  
                  {/* Location + Contact info link - LinkedIn style */}
                  <div className="flex flex-wrap items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {formData.location && (
                      <>
                        <span>{formData.location}</span>
                        <span className="mx-1">·</span>
                      </>
                    )}
                    <button className="text-[#0A66C2] hover:underline font-medium">
                      Contact info
                    </button>
                  </div>

                  {/* Completion Badge - Inline like LinkedIn's "500+ connections" */}
                  <div className="mt-2">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      {isComplete ? (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Profile complete
                        </span>
                      ) : (
                        <span className="text-sm text-[#0A66C2] font-medium flex items-center gap-1.5">
                          <CompactProgressRing progress={completionPercentage} size={16} strokeWidth={2} />
                          {completionPercentage}% complete
                        </span>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right side - Current company and education (LinkedIn style) */}
          {!isEditing && (currentPosition || currentEducation) && (
            <div className="flex flex-col gap-4 lg:items-end lg:text-right">
              {currentPosition && (
                <div className="flex items-center gap-3">
                  <CompanyLogo companyName={currentPosition.company} size="lg" />
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
                    {currentPosition.company}
                  </span>
                </div>
              )}
              {currentEducation && (
                <div className="flex items-center gap-3">
                  <InstitutionLogo institutionName={currentEducation.institution} size="md" />
                  <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
                    {currentEducation.institution}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons row - Import buttons + Edit */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {/* Import from CV Button */}
            {onImportCV && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onImportCV}
                disabled={isImportingCV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-gray-900 bg-[#b7e219] hover:bg-[#a5cb17] border border-[#9fc015] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImportingCV ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import from CV</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}

        {/* AI Suggestion Banner - Show when profile is incomplete */}
        {completionPercentage < 50 && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Complete your profile to unlock AI-powered features
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  A complete profile helps us match you with better opportunities.
                </p>
              </div>
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
      onDirectApply={handleDirectApplyCover}
      onRemove={async () => {
        if (!currentUser?.uid) return;
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), { coverPhoto: '' });
          setFormData(prev => ({ ...prev, coverPhoto: '' }));
          if (onUpdate) onUpdate({ coverPhoto: '' });
          notify.success('Cover photo removed');
        } catch (error) {
          console.error('Error removing cover:', error);
          notify.error('Failed to remove cover photo');
        }
      }}
      currentCover={formData.coverPhoto}
      triggerRef={coverButtonRef}
    />
    </>
  );
};

export default ProfileHeader;
