import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Shield, 
  Download, 
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
  Monitor,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Clock,
  LogIn,
  Settings,
  FileText,
  Edit3,
  Globe,
  Calendar,
  Activity,
  MapPin,
  Laptop,
  Filter,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, addDoc, where, Timestamp } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../lib/firebase';
import { toast } from '@/contexts/ToastContext';
import { applyTheme, loadThemeFromStorage, type Theme } from '../lib/theme';
import { syncUserToBrevo } from '../services/brevo';

// ============================================================================
// Types
// ============================================================================

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

interface ActivityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'email_change' | 'settings_update' | 'export_data' | 'profile_update' | 'security_change';
  timestamp: Date;
  device?: string;
  browser?: string;
  location?: string;
  ip?: string;
  details?: Record<string, string>;
}

type SectionId = 'account' | 'security' | 'notifications' | 'appearance' | 'activity' | 'data';

// ============================================================================
// Constants
// ============================================================================

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const activityIcons: Record<ActivityEvent['type'], typeof LogIn> = {
  login: LogIn,
  logout: LogIn,
  password_change: Lock,
  email_change: Mail,
  settings_update: Settings,
  export_data: Download,
  profile_update: User,
  security_change: Shield,
};

const activityLabels: Record<ActivityEvent['type'], string> = {
  login: 'Signed in',
  logout: 'Signed out',
  password_change: 'Password changed',
  email_change: 'Email updated',
  settings_update: 'Settings updated',
  export_data: 'Data exported',
  profile_update: 'Profile updated',
  security_change: 'Security settings changed',
};

// ============================================================================
// Utility Components
// ============================================================================

// Premium Toggle Switch - iOS/Notion style
const Toggle = ({ 
  enabled, 
  onChange, 
  disabled = false 
}: { 
  enabled: boolean; 
  onChange: (value: boolean) => void; 
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
      transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
      focus-visible:ring-gray-900 focus-visible:ring-offset-2
      ${enabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full 
        bg-white dark:bg-gray-900 shadow-lg ring-0 
        transition duration-200 ease-in-out
        ${enabled ? 'translate-x-5' : 'translate-x-0.5'}
        mt-0.5
      `}
    />
  </button>
);

// Setting Row Component
const SettingRow = ({
  icon: Icon,
  title,
  description,
  children,
  onClick,
  className = '',
}: {
  icon?: typeof User;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <div
    className={`
      flex items-center justify-between py-4 
      ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 rounded-lg transition-colors' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    <div className="flex items-center gap-4 min-w-0 flex-1">
      {Icon && (
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-gray-900 dark:text-white">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    {children && <div className="flex-shrink-0 ml-4">{children}</div>}
    {onClick && !children && (
      <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
    )}
  </div>
);

// Section Header
const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-6">
    <h2 className="text-[22px] font-semibold text-gray-900 dark:text-white">
      {title}
    </h2>
    {description && (
      <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    )}
  </div>
);

// Premium Select
const PremiumSelect = ({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; flag?: string }[];
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        appearance-none w-full px-4 py-2.5 pr-10 rounded-lg 
        border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800 
        text-gray-900 dark:text-white text-[15px]
        focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300
        transition-all cursor-pointer
      "
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.flag ? `${opt.flag} ${opt.label}` : opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
);

// Activity Timeline Item
const ActivityItem = ({ 
  event, 
  isLast,
  index 
}: { 
  event: ActivityEvent; 
  isLast: boolean;
  index: number;
}) => {
  const Icon = activityIcons[event.type] || Activity;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="relative"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}
      
      <div 
        className="flex gap-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div className={`
          relative z-10 flex-shrink-0 w-9 h-9 rounded-full 
          flex items-center justify-center
          transition-all duration-200
          ${event.type === 'login' ? 'bg-green-100 dark:bg-green-900/30' :
            event.type === 'logout' ? 'bg-gray-100 dark:bg-gray-800' :
            event.type === 'password_change' || event.type === 'security_change' ? 'bg-amber-100 dark:bg-amber-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'}
          group-hover:scale-105
        `}>
          <Icon 
            className={`w-4 h-4 ${
              event.type === 'login' ? 'text-green-600 dark:text-green-400' :
              event.type === 'logout' ? 'text-gray-500 dark:text-gray-400' :
              event.type === 'password_change' || event.type === 'security_change' ? 'text-amber-600 dark:text-amber-400' :
              'text-blue-600 dark:text-blue-400'
            }`} 
            strokeWidth={1.5} 
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-6 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-medium text-gray-900 dark:text-white">
              {activityLabels[event.type]}
            </p>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatTime(event.timestamp)}
            </span>
          </div>
          
          {/* Meta info - always visible */}
          {(event.device || event.location) && (
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {event.device && (
                <span className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  {event.device}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              )}
            </div>
          )}
          
          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && event.details && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm"
              >
                {Object.entries(event.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Security Score Component
const SecurityScore = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getBgColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Security</p>
          <p className={`text-3xl font-bold ${getColor()}`}>
            {score}%
          </p>
        </div>
        <div className={`w-14 h-14 rounded-full ${getBgColor()} bg-opacity-10 flex items-center justify-center`}>
          <Shield className={`w-7 h-7 ${getColor()}`} strokeWidth={1.5} />
        </div>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${getBgColor()} rounded-full`}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        {score >= 80 ? 'Your account is well protected' : 
         score >= 50 ? 'Consider enabling additional security features' :
         'Your account needs attention'}
      </p>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function SettingsPage() {
  const { currentUser, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  
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

  // Activity
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityEvent['type']>('all');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Security Score Calculation
  const securityScore = useMemo(() => {
    let score = 40; // Base score
    if (currentUser?.providerData?.some(p => p.providerId === 'google.com')) score += 20;
    if (notifications.emailNotifications) score += 10;
    if (currentUser?.emailVerified) score += 20;
    // 2FA would add 10 more
    return Math.min(score, 100);
  }, [currentUser, notifications]);

  // Navigation sections with groupings
  const navigationGroups = [
    {
      label: 'ACCOUNT',
      items: [
        { id: 'account' as SectionId, label: 'Profile', icon: User },
        { id: 'security' as SectionId, label: 'Security', icon: Shield },
      ]
    },
    {
      label: 'PREFERENCES',
      items: [
        { id: 'notifications' as SectionId, label: 'Notifications', icon: Bell },
        { id: 'appearance' as SectionId, label: 'Appearance', icon: Sun },
      ]
    },
    {
      label: 'DATA',
      items: [
        { id: 'activity' as SectionId, label: 'Activity', icon: Activity },
        { id: 'data' as SectionId, label: 'Your Data', icon: Download },
      ]
    },
  ];

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
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
          const data = userDoc.data();
          setEmail(currentUser.email || '');
          
          setNotifications({
            emailNotifications: data.emailNotifications ?? true,
            pushNotifications: data.pushNotifications ?? true,
            marketingEmails: data.marketingEmails ?? false,
          });

          const savedTheme = (data.theme || loadThemeFromStorage()) as Theme;
          setTheme(savedTheme);
          setLanguage(data.language || 'en');
          setTimezone(data.timezone || 'Europe/Paris');
          setDateFormat(data.dateFormat || 'DD/MM/YYYY');

          if (data.theme) {
            applyTheme(savedTheme);
          }
        }
        
        // Load activity log
        await loadActivities();
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Load activities from Firestore
  const loadActivities = async () => {
    if (!currentUser) return;
    
    setLoadingActivities(true);
    try {
      const activitiesRef = collection(db, 'users', currentUser.uid, 'activities');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const loadedActivities: ActivityEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          timestamp: data.timestamp?.toDate() || new Date(),
          device: data.device,
          browser: data.browser,
          location: data.location,
          ip: data.ip,
          details: data.details,
        };
      });
      
      // If no activities exist, add some mock data for demonstration
      if (loadedActivities.length === 0) {
        const mockActivities: ActivityEvent[] = [
          {
            id: '1',
            type: 'login',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            device: 'MacBook Pro',
            browser: 'Chrome',
            location: 'Paris, France',
          },
          {
            id: '2',
            type: 'settings_update',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            device: 'MacBook Pro',
            details: { changed: 'Theme', new_value: 'Dark' },
          },
          {
            id: '3',
            type: 'profile_update',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
            device: 'iPhone 15',
            location: 'Paris, France',
          },
          {
            id: '4',
            type: 'login',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            device: 'iPhone 15',
            browser: 'Safari',
            location: 'Lyon, France',
          },
        ];
        setActivities(mockActivities);
      } else {
        setActivities(loadedActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Log activity
  const logActivity = async (type: ActivityEvent['type'], details?: Record<string, string>) => {
    if (!currentUser) return;
    
    try {
      const activitiesRef = collection(db, 'users', currentUser.uid, 'activities');
      await addDoc(activitiesRef, {
        type,
        timestamp: Timestamp.now(),
        device: navigator.userAgent.includes('Mac') ? 'Mac' : 
                navigator.userAgent.includes('Windows') ? 'Windows' : 
                navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Unknown',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                 navigator.userAgent.includes('Firefox') ? 'Firefox' :
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
        details,
      });
      
      // Refresh activities
      await loadActivities();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    saveSettings({ theme: newTheme });
    logActivity('settings_update', { changed: 'Theme', new_value: newTheme });
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
      toast.success('Settings saved');
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
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, email);
      await saveSettings({ email });
      await logActivity('email_change', { new_email: email });
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

  const validatePasswordRequirements = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) errors.push('Mix of uppercase and lowercase');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push('At least one special character');
    return { valid: errors.length === 0, errors };
  };

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

  useEffect(() => {
    const errors = { current: '', new: '', confirm: '' };
    if (newPassword) {
      if (newPassword === currentPassword) {
        errors.new = 'Must be different from current password';
      } else {
        const requirements = validatePasswordRequirements(newPassword);
        if (!requirements.valid) {
          errors.new = `Missing: ${requirements.errors.join(', ')}`;
        }
      }
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }
    setPasswordErrors(errors);
  }, [currentPassword, newPassword, confirmPassword]);

  const handlePasswordUpdate = async () => {
    if (!currentUser) {
      toast.error('You must be logged in');
      return;
    }

    const requirements = validatePasswordRequirements(newPassword);
    if (!requirements.valid) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different');
      return;
    }

    try {
      setIsSaving(true);
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      await logActivity('password_change');
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect current password');
        setPasswordErrors(prev => ({ ...prev, current: 'Incorrect password' }));
      } else {
        toast.error('Failed to update password');
      }
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

    if (key === 'marketingEmails' && currentUser?.email) {
      try {
        await syncUserToBrevo(
          {
            email: currentUser.email || '',
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            MARKETING: value,
          },
          'marketing_preference_changed',
          {
            userId: currentUser.uid,
            marketingEmails: value,
            changedAt: new Date().toISOString(),
          }
        );
      } catch (error) {
        console.error('Brevo sync failed:', error);
      }
    }
  };

  const handleExportData = async () => {
    if (!currentUser) return;

    try {
      toast.info('Preparing your data export...');
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const exportData = {
        exportedAt: new Date().toISOString(),
        userData: userDoc.data(),
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

      await logActivity('export_data');
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
      toast.error('Account deletion requires support assistance. Please contact support@jobz.ai');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter(a => a.type === activityFilter);
  }, [activities, activityFilter]);

  const isGoogleUser = currentUser?.providerData?.some(provider => provider.providerId === 'google.com');

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto px-6 lg:px-8 py-10"
        >
          {/* Header - Notion style */}
          <div className="mb-10">
            <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-white">Settings</span>
            </nav>
            <h1 className="text-[32px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Settings
            </h1>
          </div>

          <div className="flex gap-12">
            {/* Sidebar Navigation - Notion style */}
            <div className="w-56 flex-shrink-0">
              <nav className="sticky top-6 space-y-6">
                {navigationGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                            transition-all duration-150
                            ${activeSection === item.id
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                            }
                          `}
                        >
                          <item.icon className="w-4 h-4" strokeWidth={1.5} />
                          <span className="text-[14px] font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-2xl">
              <AnimatePresence mode="wait">
                {/* Account Section */}
                {activeSection === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <SectionHeader 
                      title="Profile" 
                      description="Your personal information and account details" 
                    />

                    {/* Profile Card */}
                    <div className="flex items-center gap-5 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-2xl font-semibold text-gray-600 dark:text-gray-300">
                        {userData?.firstName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {userData?.firstName && userData?.lastName 
                            ? `${userData.firstName} ${userData.lastName}`
                            : currentUser?.email
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Edit
                      </button>
                    </div>

                    {/* Connected Account */}
                    {isGoogleUser && (
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                          Connected Account
                        </h3>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                              <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Google</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                          </svg>
                          Account managed by Google. Update email or password in your Google settings.
                        </p>
                      </div>
                    )}

                    {/* Email/Password for non-Google users */}
                    {!isGoogleUser && (
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
                            />
                            <button
                              onClick={handleEmailUpdate}
                              disabled={isSaving || email === currentUser?.email}
                              className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Security Section */}
                {activeSection === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <SectionHeader 
                      title="Security" 
                      description="Manage your account security and authentication" 
                    />

                    {/* Security Score */}
                    <SecurityScore score={securityScore} />

                    {/* Password Change - Only for non-Google users */}
                    {!isGoogleUser && (
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Change Password
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${passwordErrors.current ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {passwordErrors.current && (
                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{passwordErrors.current}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${passwordErrors.new ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                      key={level}
                                      className={`h-1 flex-1 rounded-full transition-colors ${
                                        passwordStrength >= level
                                          ? passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-amber-500' : 'bg-green-500'
                                          : 'bg-gray-200 dark:bg-gray-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className={`text-xs ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-amber-500' : 'text-green-500'}`}>
                                  {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                                </p>
                              </div>
                            )}
                            {passwordErrors.new && (
                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{passwordErrors.new}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${passwordErrors.confirm ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {confirmPassword && newPassword === confirmPassword && (
                              <p className="mt-1.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Passwords match
                              </p>
                            )}
                            {passwordErrors.confirm && (
                              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirm}</p>
                            )}
                          </div>

                          <button
                            onClick={handlePasswordUpdate}
                            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword || !!passwordErrors.new || !!passwordErrors.confirm}
                            className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                Update Password
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Two-Factor Authentication */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                      <SettingRow
                        icon={Shield}
                        title="Two-Factor Authentication"
                        description="Add an extra layer of security"
                      >
                        <button className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                          Enable
                        </button>
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <SectionHeader 
                      title="Notifications" 
                      description="Choose how you want to be notified" 
                    />

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      <SettingRow
                        icon={Mail}
                        title="Email Notifications"
                        description="Receive updates about your applications via email"
                      >
                        <Toggle
                          enabled={notifications.emailNotifications}
                          onChange={(value) => handleNotificationChange('emailNotifications', value)}
                        />
                      </SettingRow>

                      <SettingRow
                        icon={Smartphone}
                        title="Push Notifications"
                        description="Get instant notifications in your browser"
                      >
                        <Toggle
                          enabled={notifications.pushNotifications}
                          onChange={(value) => handleNotificationChange('pushNotifications', value)}
                        />
                      </SettingRow>

                      <SettingRow
                        icon={Bell}
                        title="Marketing Emails"
                        description="Receive news, tips and product updates"
                      >
                        <Toggle
                          enabled={notifications.marketingEmails}
                          onChange={(value) => handleNotificationChange('marketingEmails', value)}
                        />
                      </SettingRow>
                    </div>
                  </motion.div>
                )}

                {/* Appearance Section */}
                {activeSection === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <SectionHeader 
                      title="Appearance" 
                      description="Customize the look and feel of the app" 
                    />

                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light' as Theme, label: 'Light', icon: Sun },
                          { value: 'dark' as Theme, label: 'Dark', icon: Moon },
                          { value: 'system' as Theme, label: 'System', icon: Monitor },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleThemeChange(option.value)}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all duration-200
                              ${theme === option.value
                                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                          >
                            {/* Mini Preview */}
                            <div className={`
                              w-full h-16 rounded-lg mb-3 overflow-hidden
                              ${option.value === 'dark' ? 'bg-gray-900' : 'bg-white'}
                              border ${option.value === 'dark' ? 'border-gray-700' : 'border-gray-200'}
                            `}>
                              <div className={`h-3 ${option.value === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`} />
                              <div className="p-2 space-y-1">
                                <div className={`h-1.5 w-8 rounded ${option.value === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                <div className={`h-1.5 w-12 rounded ${option.value === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <option.icon className={`w-4 h-4 ${theme === option.value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} strokeWidth={1.5} />
                              <span className={`text-sm font-medium ${theme === option.value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {option.label}
                              </span>
                            </div>
                            {theme === option.value && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-gray-900 dark:text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-5">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Regional
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <PremiumSelect
                          value={language}
                          onChange={(value) => {
                            setLanguage(value);
                            saveSettings({ language: value });
                          }}
                          options={languages.map(l => ({ value: l.code, label: l.name, flag: l.flag }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Timezone
                        </label>
                        <PremiumSelect
                          value={timezone}
                          onChange={(value) => {
                            setTimezone(value);
                            saveSettings({ timezone: value });
                          }}
                          options={timezones}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date Format
                        </label>
                        <PremiumSelect
                          value={dateFormat}
                          onChange={(value) => {
                            setDateFormat(value);
                            saveSettings({ dateFormat: value });
                          }}
                          options={dateFormats}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Activity Timeline Section - KILLER FEATURE */}
                {activeSection === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-start justify-between">
                      <SectionHeader 
                        title="Activity" 
                        description="Your recent account activity and security events" 
                      />
                      
                      {/* Filter */}
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <PremiumSelect
                          value={activityFilter}
                          onChange={(value) => setActivityFilter(value as typeof activityFilter)}
                          options={[
                            { value: 'all', label: 'All Activity' },
                            { value: 'login', label: 'Sign-ins' },
                            { value: 'settings_update', label: 'Settings' },
                            { value: 'security_change', label: 'Security' },
                          ]}
                          className="w-40"
                        />
                      </div>
                    </div>

                    {/* Timeline */}
                    {loadingActivities ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : filteredActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No activity found</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {filteredActivities.map((event, index) => (
                          <ActivityItem
                            key={event.id}
                            event={event}
                            isLast={index === filteredActivities.length - 1}
                            index={index}
                          />
                        ))}
                        
                        {activities.length >= 50 && (
                          <button className="w-full py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Load more activity
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Data Management Section */}
                {activeSection === 'data' && (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <SectionHeader 
                      title="Your Data" 
                      description="Export or delete your account data" 
                    />

                    {/* Export */}
                    <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Export Your Data</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of all your data as JSON</p>
                          </div>
                        </div>
                        <button
                          onClick={handleExportData}
                          className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                          Export
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4">
                        Danger Zone
                      </h3>
                      <div className="p-5 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  All your data, including applications, CVs, and settings will be permanently deleted.
                </p>

                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type <span className="font-mono text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isSaving}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
