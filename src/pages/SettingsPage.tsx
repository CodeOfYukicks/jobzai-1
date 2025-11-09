import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Download, 
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  LogOut,
  Smartphone,
  Monitor,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { applyTheme, loadThemeFromStorage, type Theme } from '../lib/theme';
import { syncUserToBrevo } from '../services/brevo';

interface UserSettings {
  email: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
];

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export default function SettingsPage() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('account');
  
  // Account Settings
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  // Appearance
  const [theme, setTheme] = useState<Theme>(loadThemeFromStorage());
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      // Always load theme from localStorage first (even if not logged in)
      const initialTheme = loadThemeFromStorage();
      setTheme(initialTheme);
      applyTheme(initialTheme);

      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(currentUser.email || '');
          
          // Load notification preferences
          setNotifications({
            emailNotifications: userData.emailNotifications ?? true,
            pushNotifications: userData.pushNotifications ?? true,
            marketingEmails: userData.marketingEmails ?? false,
          });

          // Load appearance settings
          // Priority: Firestore > localStorage > system
          const savedTheme = (userData.theme || loadThemeFromStorage()) as Theme;
          setTheme(savedTheme);
          setLanguage(userData.language || 'en');
          setTimezone(userData.timezone || 'Europe/Paris');
          setDateFormat(userData.dateFormat || 'DD/MM/YYYY');

          // Apply theme from Firestore if available
          if (userData.theme) {
            applyTheme(savedTheme);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    saveSettings({ theme: newTheme });
  };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    if (!currentUser) return;

    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        settingsUpdatedAt: new Date().toISOString(),
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!currentUser || !currentPassword) {
      toast.error('Please enter your current password');
        return;
      }

    try {
      setIsSaving(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update email
      await updateEmail(currentUser, email);
      await saveSettings({ email });
      
      toast.success('Email updated successfully');
      setCurrentPassword('');
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use');
      } else {
        toast.error('Failed to update email');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction de validation des exigences du mot de passe
  const validatePasswordRequirements = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('At least 8 characters');
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      errors.push('Mix of uppercase and lowercase letters');
    }

    if (!/\d/.test(password)) {
      errors.push('At least one number');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('At least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Calculer la force du mot de passe
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    setPasswordStrength(strength);
  }, [newPassword]);

  // Valider les champs en temps réel
  useEffect(() => {
    const errors = {
      current: '',
      new: '',
      confirm: ''
    };

    if (currentPassword && currentPassword.length > 0) {
      errors.current = '';
    }

    if (newPassword) {
      // Vérifier que le nouveau mot de passe est différent de l'ancien
      if (newPassword === currentPassword) {
        errors.new = 'New password must be different from current password';
      } else {
        // Vérifier tous les critères de sécurité
        const requirements = validatePasswordRequirements(newPassword);
        if (!requirements.valid) {
          errors.new = `Missing: ${requirements.errors.join(', ')}`;
        } else {
          errors.new = '';
        }
      }
    }

    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        errors.confirm = 'Passwords do not match';
      } else if (confirmPassword.length > 0 && newPassword === confirmPassword) {
        errors.confirm = '';
      }
    }

    setPasswordErrors(errors);
  }, [currentPassword, newPassword, confirmPassword]);

  const validatePassword = () => {
    const errors = {
      current: '',
      new: '',
      confirm: ''
    };

    if (!currentPassword) {
      errors.current = 'Current password is required';
    }

    if (!newPassword) {
      errors.new = 'New password is required';
    } else {
      // Vérifier que le nouveau mot de passe est différent de l'ancien
      if (newPassword === currentPassword) {
        errors.new = 'New password must be different from current password';
      } else {
        // Vérifier tous les critères de sécurité
        const requirements = validatePasswordRequirements(newPassword);
        if (!requirements.valid) {
          errors.new = `Password must meet all requirements: ${requirements.errors.join(', ')}`;
        }
      }
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return !errors.current && !errors.new && !errors.confirm;
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to change your password');
      return;
    }

    // Valider les champs
    if (!validatePassword()) {
      // Afficher un message d'erreur si la validation échoue
      if (passwordErrors.new) {
        toast.error('Password does not meet requirements', {
          description: passwordErrors.new
        });
      } else if (passwordErrors.current) {
        toast.error(passwordErrors.current);
      } else if (passwordErrors.confirm) {
        toast.error(passwordErrors.confirm);
      }
      return;
    }

    // Validation supplémentaire stricte avant d'envoyer à Firebase
    const requirements = validatePasswordRequirements(newPassword);
    if (!requirements.valid) {
      toast.error('Password does not meet all security requirements', {
        description: `Missing: ${requirements.errors.join(', ')}`
      });
      setPasswordErrors(prev => ({
        ...prev,
        new: `Password must meet all requirements: ${requirements.errors.join(', ')}`
      }));
      return;
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      setPasswordErrors(prev => ({
        ...prev,
        new: 'New password must be different from current password'
      }));
      return;
    }

    try {
      setIsSaving(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      
      toast.success('Password updated successfully!', {
        description: 'Your password has been changed. Please use your new password for future logins.'
      });
      
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({ current: '', new: '', confirm: '' });
      setPasswordStrength(0);
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      let errorMessage = 'Failed to update password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password';
        setPasswordErrors(prev => ({ ...prev, current: 'Incorrect password' }));
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        setPasswordErrors(prev => ({ ...prev, new: 'Password is too weak' }));
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before changing your password';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    saveSettings({
      emailNotifications: updated.emailNotifications,
      pushNotifications: updated.pushNotifications,
      marketingEmails: updated.marketingEmails,
    });

    // Sync to Brevo if marketingEmails changed
    if (key === 'marketingEmails' && currentUser?.email) {
      try {
        console.log('🔄 Syncing MARKETING to Brevo for:', currentUser.email, 'value:', value);
        await syncUserToBrevo(
          {
            email: currentUser.email || '',
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            MARKETING: value, // Boolean attribute for Marketing Emails
          },
          'marketing_preference_changed',
          {
            userId: currentUser.uid,
            marketingEmails: value,
            changedAt: new Date().toISOString(),
          }
        );
        console.log('✅ MARKETING synced to Brevo successfully');
      } catch (brevoError) {
        console.error('❌ Brevo sync failed (non-critical):', brevoError);
        // Don't block the user if Brevo sync fails
      }
    }
  };

  const handleExportData = async () => {
    if (!currentUser) return;

    try {
      toast.info('Preparing your data export...');
      // In a real implementation, you would fetch all user data and create a JSON file
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        userData,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobzai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!currentUser) return;

    try {
      setIsSaving(true);
      toast.info('Deleting your account...');
      
      // In a real implementation, you would:
      // 1. Delete all user data from Firestore
      // 2. Delete user files from Storage
      // 3. Delete the auth account
      // This should be done via a Cloud Function for security
      
      toast.error('Account deletion is not yet implemented. Please contact support.');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
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

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Download },
  ];

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-purple-600 dark:text-white">
            Settings
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your account settings and preferences
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 sticky top-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
              </div>
            </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Settings */}
            {activeSection === 'account' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Account Settings
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your account information and security
                  </p>
                </div>

                {/* Connected Accounts */}
                {currentUser && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Connected Accounts</h3>
                    
                    {currentUser.providerData?.some(provider => provider.providerId === 'google.com') ? (
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Google</h4>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {currentUser.email}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Connected via Google Sign-In
                    </p>
                  </div>
                          </div>
                          <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            Active
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No external accounts connected
                        </p>
                      </div>
                    )}
                </div>
              )}

                {/* Email - Only show for non-Google accounts */}
                {currentUser && !currentUser.providerData?.some(provider => provider.providerId === 'google.com') && (
                  <>
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-48 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                        <button
                          onClick={handleEmailUpdate}
                          disabled={isSaving || email === currentUser?.email}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Update
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Change Password</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Update your password to keep your account secure
                        </p>
                      </div>
                  
                      <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setPasswordErrors(prev => ({ ...prev, current: '' }));
                              }}
                              placeholder="Enter your current password"
                              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200
                                ${passwordErrors.current 
                                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }
                                focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordErrors.current && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <X className="w-4 h-4" />
                              {passwordErrors.current}
                            </p>
                          )}
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordErrors(prev => ({ ...prev, new: '' }));
                              }}
                              placeholder="Enter your new password"
                              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200
                                ${passwordErrors.new 
                                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                                  : passwordStrength >= 3 && newPassword.length > 0
                                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }
                                focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          
                          {/* Password Strength Indicator */}
                          {newPassword && (
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                      passwordStrength >= level
                                        ? passwordStrength <= 2
                                          ? 'bg-red-500'
                                          : passwordStrength <= 3
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className={`text-xs ${
                                passwordStrength <= 2 ? 'text-red-600 dark:text-red-400' :
                                passwordStrength <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>
                                {passwordStrength <= 2 ? 'Weak password' :
                                 passwordStrength <= 3 ? 'Medium password' :
                                 'Strong password'}
                              </p>
                            </div>
                          )}
                          
                          {passwordErrors.new && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <X className="w-4 h-4" />
                              {passwordErrors.new}
                            </p>
                          )}
                          
                          {/* Password Requirements */}
                          {newPassword && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password requirements:</p>
                              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                                  {newPassword.length >= 8 ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  At least 8 characters
                                </li>
                                <li className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}>
                                  {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  Mix of uppercase and lowercase
                                </li>
                                <li className={`flex items-center gap-2 ${/\d/.test(newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}>
                                  {/\d/.test(newPassword) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  At least one number
                                </li>
                                <li className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}>
                                  {/[^a-zA-Z0-9]/.test(newPassword) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  At least one special character
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setPasswordErrors(prev => ({ ...prev, confirm: '' }));
                              }}
                              placeholder="Confirm your new password"
                              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200
                                ${passwordErrors.confirm 
                                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                                  : confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0
                                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }
                                focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordErrors.confirm && (
                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <X className="w-4 h-4" />
                              {passwordErrors.confirm}
                            </p>
                          )}
                          {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && !passwordErrors.confirm && (
                            <p className="mt-1.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              Passwords match
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Update Button */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        {(() => {
                          // Vérifier que tous les critères sont remplis
                          const requirements = newPassword ? validatePasswordRequirements(newPassword) : { valid: false, errors: [] };
                          const allRequirementsMet = requirements.valid && 
                                                    newPassword === confirmPassword && 
                                                    newPassword !== currentPassword &&
                                                    newPassword.length > 0 &&
                                                    confirmPassword.length > 0 &&
                                                    currentPassword.length > 0 &&
                                                    !passwordErrors.current &&
                                                    !passwordErrors.new &&
                                                    !passwordErrors.confirm;
                          
                          return (
                            <button
                              onClick={handlePasswordUpdate}
                              disabled={isSaving || !allRequirementsMet}
                              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold
                                hover:from-purple-700 hover:to-indigo-700 transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed
                                shadow-lg hover:shadow-xl disabled:shadow-none
                                flex items-center justify-center gap-2"
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Updating Password...</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-5 h-5" />
                                  <span>Update Password</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {/* Info message for Google accounts */}
                {currentUser && currentUser.providerData?.some(provider => provider.providerId === 'google.com') && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                          Google Account
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your account is managed by Google. Email and password changes must be made through your Google account settings.
                        </p>
                      </div>
                </div>
              </div>
                )}
              </motion.div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose how you want to be notified
                  </p>
            </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                      </div>
              </div>
                    <button
                      onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.emailNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications.emailNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
              </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in your browser</p>
              </div>
            </div>
                  <button
                      onClick={() => handleNotificationChange('pushNotifications', !notifications.pushNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.pushNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications.pushNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                  </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Marketing Emails</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about new features and offers</p>
              </div>
            </div>
                  <button
                      onClick={() => handleNotificationChange('marketingEmails', !notifications.marketingEmails)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.marketingEmails ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications.marketingEmails ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Appearance & Localization
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customize your interface and regional settings
                  </p>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value as Theme)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-200'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 mx-auto mb-2 ${
                          theme === option.value ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          theme === option.value ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {option.label}
                        </div>
                  </button>
                ))}
              </div>
            </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      saveSettings({ language: e.target.value });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      saveSettings({ timezone: e.target.value });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => {
                      setDateFormat(e.target.value);
                      saveSettings({ dateFormat: e.target.value });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {dateFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Privacy & Security */}
            {activeSection === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Privacy & Security
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your privacy and security settings
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Manage your active login sessions
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        View All
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Enable
              </button>
            </div>
          </div>

                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Privacy Policy</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Read our privacy policy
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Management */}
            {activeSection === 'data' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Data Management
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Export or delete your account data
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-purple-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Export Your Data</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Download a copy of all your data
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Delete Account</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
              </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
              </button>
            </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Account
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. This will permanently delete your account and all associated data.
              </p>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type <span className="font-mono text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AuthLayout>
  );
}
