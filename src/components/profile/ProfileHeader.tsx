import { useState, useEffect } from 'react';
import { User, MapPin, Mail, Edit2, Camera, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  onUpdate?: (data: any) => void;
}

const ProfileHeader = ({ onUpdate }: ProfileHeaderProps) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid) return;

    setIsUploading(true);
    try {
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(photoRef, file);
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
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid) return;

    setIsUploadingCover(true);
    try {
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(coverRef, file);
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
      console.error('Error uploading cover photo:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setIsUploadingCover(false);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Cover Photo Area - Better integrated */}
      <div className="relative h-40 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 overflow-hidden group">
        {/* Cover Photo or Gradient Background */}
        {formData.coverPhoto ? (
          <img 
            src={formData.coverPhoto} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/20 to-purple-900/40"></div>
          </>
        )}
        
        {/* Upload Cover Photo Button - Visible on hover */}
        <label className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm font-medium">
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
      </div>

      {/* Profile Content - No overlap for text */}
      <div className="px-6 pb-6 pt-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Photo and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Profile Photo - Overlaps banner only */}
            <div className="relative -mt-20 z-10">
              <div className="w-36 h-36 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800">
                {formData.profilePhoto ? (
                  <img 
                    src={formData.profilePhoto} 
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <User className="w-20 h-20 text-white" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 p-2.5 rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:scale-110">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </label>
            </div>

            {/* Name and Info - Completely below banner */}
            <div className="text-center sm:text-left flex-1 pt-2 sm:pt-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder="Professional headline (e.g., Senior Product Manager)"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location (e.g., Paris, France)"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div className="flex gap-2">
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
                <>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {fullName}
                  </h1>
                  {formData.headline && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-3 font-medium">
                      {formData.headline}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 justify-center sm:justify-start">
                    {formData.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">{formData.location}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
            <div className="flex gap-2 pt-2 sm:pt-0">
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

