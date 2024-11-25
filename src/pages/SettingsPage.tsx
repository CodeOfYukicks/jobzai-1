import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, FileText, BriefcaseIcon, Loader2, Briefcase, Clock, Calendar, GraduationCap } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateEmail, updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../lib/firebase';
import { toast } from 'sonner';

const contractTypes = [
  { id: 'full-time', label: 'Full Time', icon: Briefcase },
  { id: 'part-time', label: 'Part Time', icon: Clock },
  { id: 'contract', label: 'Contract', icon: Calendar },
  { id: 'internship', label: 'Internship', icon: GraduationCap },
] as const;

type ContractType = typeof contractTypes[number]['id'];

type Settings = {
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  cvUrl?: string;
  cvName?: string;
  location: string;
  gender: 'male' | 'female' | '';
  contractType: ContractType | '';
  motivation: string;
};

export default function SettingsPage() {
  const { currentUser, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    gender: '',
    contractType: '',
    motivation: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const [firstName = '', lastName = ''] = (currentUser.displayName || '').split(' ');
          
          setSettings({
            firstName: userData.firstName || firstName,
            lastName: userData.lastName || lastName,
            email: currentUser.email || '',
            photoURL: userData.photoURL || currentUser.photoURL,
            cvUrl: userData.cvUrl,
            cvName: userData.cvName,
            location: userData.location || '',
            gender: userData.gender || '',
            contractType: userData.contractType || '',
            motivation: userData.motivation || ''
          });
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('CV must be less than 5MB');
        return;
      }
      setCvFile(file);
      setSettings(prev => ({ ...prev, cvName: file.name }));
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setIsSaving(true);

      // Validate required fields
      if (!settings.firstName || !settings.lastName) {
        toast.error('First and last name are required');
        return;
      }

      // Upload profile photo if new file selected
      let photoURL = settings.photoURL;
      if (photoFile) {
        const photoRef = ref(storage, `photos/${currentUser.uid}/${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      // Update profile
      await updateUserProfile(settings.firstName, settings.lastName, photoURL);

      // Update email if changed
      if (settings.email !== currentUser.email) {
        try {
          await updateEmail(currentUser, settings.email);
        } catch (error: any) {
          if (error.code === 'auth/requires-recent-login') {
            toast.error('Please log out and log back in to change your email');
            return;
          }
          throw error;
        }
      }

      // Upload CV if new file selected
      let cvUrl = settings.cvUrl;
      if (cvFile) {
        const cvRef = ref(storage, `cvs/${currentUser.uid}/${cvFile.name}`);
        await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(cvRef);
      }

      // Save to Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        firstName: settings.firstName,
        lastName: settings.lastName,
        location: settings.location,
        gender: settings.gender,
        contractType: settings.contractType,
        motivation: settings.motivation,
        ...(photoURL && { photoURL }),
        ...(cvUrl && { cvUrl }),
        ...(settings.cvName && { cvName: settings.cvName }),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      toast.success('Settings saved successfully');
      setCvFile(null);
      setPhotoFile(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8D75E6]"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Update your personal information
          </p>
        </div>

        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          {/* Profile Picture Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h2>
              <label 
                htmlFor="profile-upload"
                className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer font-medium"
              >
                Update Photo
              </label>
            </div>
            <div className="flex items-center gap-4">
              {settings.photoURL ? (
                <img 
                  src={settings.photoURL} 
                  alt="Profile" 
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 
                  flex items-center justify-center">
                  <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size of 2MB</p>
            </div>
            <input
              type="file"
              id="profile-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Resume/CV Section */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resume/CV</h2>
                <p className="text-sm text-gray-500">PDF, DOC or DOCX</p>
              </div>
              <label 
                htmlFor="cv-upload"
                className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer font-medium"
              >
                {settings.cvUrl ? 'Update CV' : 'Upload CV'}
              </label>
            </div>
            
            {settings.cvUrl && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {settings.cvName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {settings.cvUrl.split('/').pop()}
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              id="cv-upload"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleCVUpload}
            />
          </div>

          {/* Job Search Motivation */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Job Search Motivation
            </h2>
            <div className="relative">
              <textarea
                value={settings.motivation}
                onChange={(e) => setSettings(prev => ({ ...prev, motivation: e.target.value }))}
                className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 
                  dark:border-gray-700 bg-white dark:bg-gray-800
                  focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                  resize-none"
                placeholder="Describe your career goals and what you're looking for..."
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {settings.motivation.length}/500
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                type="text"
                value={settings.firstName}
                onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 
                  focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                value={settings.lastName}
                onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 
                  focus:border-purple-500"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 
                  focus:border-purple-500"
                placeholder="e.g., Paris, Remote..."
              />
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gender</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Male', 'Female'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    gender: gender.toLowerCase() as 'male' | 'female' 
                  }))}
                  className={`p-3 rounded-lg border-2 transition-all
                    ${settings.gender === gender.toLowerCase()
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700'
                    }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Contract Type */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contract Type</h2>
            <div className="grid grid-cols-2 gap-4">
              {contractTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSettings(prev => ({ ...prev, contractType: type.id }))}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                    ${settings.contractType === type.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Change Password</h3>
              <p className="text-xs text-gray-500">Update your password regularly</p>
            </div>
            <button className="text-purple-600 hover:text-purple-700">
              Change
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

