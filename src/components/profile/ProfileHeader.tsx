import { useState, useEffect } from 'react';
import { User, MapPin, Mail, Edit2, Camera, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { toast } from 'sonner';
import ProfilePhotoCropper from './ProfilePhotoCropper';
import CoverPhotoCropper from './CoverPhotoCropper';
import CoverPhotoGallery from './CoverPhotoGallery';

interface ProfileHeaderProps {
  onUpdate?: (data: any) => void;
}

const ProfileHeader = ({ onUpdate }: ProfileHeaderProps) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    profilePhoto: '',
    coverPhoto: '',
    email: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            headline: userData.headline || userData.targetPosition || '',
            location: userData.city && userData.country
              ? `${userData.city}, ${userData.country}`
              : userData.city || userData.country || '',
            profilePhoto: userData.profilePhoto || '',
            coverPhoto: userData.coverPhoto || '',
            email: userData.email || currentUser.email || ''
          });
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
    // Open cropper modal with selected file
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

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      const [city, country] = formData.location.split(', ').map(s => s.trim());
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        city: city || '',
        country: country || formData.location || ''
      });

      if (onUpdate) {
        onUpdate({
          firstName: formData.firstName,
          lastName: formData.lastName,
          headline: formData.headline,
          city: city || '',
          country: country || formData.location || ''
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
      {/* Cover Photo Area */}
      <div className="relative h-32 overflow-hidden group bg-gray-100 dark:bg-gray-900">
        {/* Cover Photo or Animated Gradient Background */}
        {formData.coverPhoto ? (
          <>
            <img
              src={formData.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-purple-900/30"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"></div>
        )}

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={isUploadingCover}
            />
            {isUploadingCover ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Image className="w-4 h-4" />
                {formData.coverPhoto ? 'Change' : 'Add Cover'}
              </>
            )}
          </label>
          <button
            onClick={() => setIsCoverGalleryOpen(true)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
          >
            Cover options
          </button>
        </div>
      </div>

      {/* Profile Content - No overlap for text */}
      <div className="px-5 pb-4 pt-2 relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Photo and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            {/* Profile Photo */}
            <div className="relative -mt-14 z-10 group/photo">
              <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-800 p-1 shadow-sm flex items-center justify-center overflow-hidden relative">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {formData.profilePhoto ? (
                    <img
                      src={formData.profilePhoto}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute bottom-1 right-1 bg-gray-900 text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-sm border-2 border-white dark:border-gray-800">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </label>
            </div>

            {/* Name and Info - Completely below banner */}
            <div className="text-center sm:text-left flex-1 pt-1 sm:pt-0">
              {isEditing ? (
                <div className="space-y-2.5">
                  <div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder="Professional headline (e.g., Senior Product Manager)"
                      className="w-full px-3.5 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location (e.g., Paris, France)"
                      className="w-full px-3.5 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                    {fullName}
                  </h1>
                  {formData.headline && (
                    <p className="text-base text-gray-700 dark:text-gray-300 mb-3 font-medium leading-relaxed">
                      {formData.headline}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
                    {formData.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{formData.location}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{formData.email}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Cropper Modal */}
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
          // Open cropper directly with selected template
          setSelectedCoverFile(blob);
          setIsCoverGalleryOpen(false);
          setIsCoverCropperOpen(true);
        }}
      />
    </div>
  );
};

export default ProfileHeader;
