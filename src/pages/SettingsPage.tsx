import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, FileText, BriefcaseIcon, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateEmail } from 'firebase/auth';
import { db, storage } from '../lib/firebase';
import { toast } from 'sonner';

interface Settings {
  firstName: string;
  lastName: string;
  email: string;
  jobPreferences: string;
  photoURL?: string;
  cvUrl?: string;
  cvName?: string;
  location?: string;
}

export default function SettingsPage() {
  const { currentUser, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    firstName: '',
    lastName: '',
    email: '',
    jobPreferences: '',
    location: ''
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
            jobPreferences: userData.jobPreferences || '',
            photoURL: userData.photoURL || currentUser.photoURL,
            cvUrl: userData.cvUrl,
            cvName: userData.cvName,
            location: userData.location || ''
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
        jobPreferences: settings.jobPreferences,
        location: settings.location,
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Profile Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal information
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {settings.photoURL ? (
                      <img
                        src={settings.photoURL}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-[#6956A8]" />
                      </div>
                    )}
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer"
                    >
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="w-8 h-8 bg-[#6956A8] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </label>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Profile Picture</h4>
                    <p className="text-sm text-gray-500">
                      JPG, GIF or PNG. Max size of 2MB
                    </p>
                  </div>
                </div>

                {/* CV Upload */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-[#6956A8]" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Resume/CV</h4>
                      <p className="text-sm text-gray-500">
                        {settings.cvName || 'No file uploaded'}
                      </p>
                    </div>
                  </div>
                  <label
                    htmlFor="cv-upload"
                    className="btn-primary rounded-lg px-4 py-2 cursor-pointer"
                  >
                    {settings.cvUrl ? 'Update CV' : 'Upload CV'}
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleCVUpload}
                    />
                  </label>
                </div>

                {/* Job Preferences */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <BriefcaseIcon className="h-6 w-6 text-[#6956A8]" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Job Preferences</h4>
                      <p className="text-sm text-gray-500">
                        Describe your ideal role and current situation
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={settings.jobPreferences}
                      onChange={(e) => setSettings(prev => ({ ...prev, jobPreferences: e.target.value }))}
                      rows={6}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#6956A8] focus:border-[#6956A8] text-sm"
                      placeholder="Example: I'm a senior software engineer with 5 years of experience, currently looking for remote positions in fintech or healthtech. I specialize in React and Node.js, and I'm particularly interested in roles that involve mentoring junior developers..."
                    />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-[#6956A8]" />
                      </div>
                      <input
                        type="text"
                        value={settings.firstName}
                        onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                        className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6956A8] focus:ring-[#6956A8] sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={settings.lastName}
                        onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6956A8] focus:ring-[#6956A8] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Job Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target Job Location
                  </label>
                  <input
                    type="text"
                    value={settings.location}
                    onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6956A8] focus:ring-[#6956A8] sm:text-sm"
                    placeholder="e.g., Remote, London, New York"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#6956A8]" />
                    </div>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6956A8] focus:ring-[#6956A8] sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary rounded-lg px-4 py-2 flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Security Settings
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    toast.error('Password change functionality coming soon');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-[#6956A8] mr-3" />
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-gray-900">
                        Change Password
                      </h4>
                      <p className="text-sm text-gray-500">
                        Update your password regularly to keep your account secure
                      </p>
                    </div>
                  </div>
                  <div className="text-[#6956A8]">Change</div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}