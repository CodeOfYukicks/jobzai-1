import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Clock,
  Tag,
  Edit3,
  Save,
  Trash2,
  Plus,
  Link as LinkIcon,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Archive,
  Sparkles,
  FileText,
  StickyNote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { JobApplication, Interview, StatusChange } from '../../types/job';
import { StatusBadge } from './StatusBadge';
import { PropertyRow } from './PropertyRow';
import { SectionCard } from './SectionCard';
import { TimelineItem } from './TimelineItem';
import { InterviewCard } from './InterviewCard';
import { AddInterviewForm } from './AddInterviewForm';
import { AIToolsTab } from './AIToolsTab';
import { NotesTab } from './NotesTab';
import { EnhancedJobSummary } from './EnhancedJobSummary';
import { toast } from 'sonner';

// Helper function to safely parse dates from Firestore
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  // If it's already a Date object
  if (dateValue instanceof Date) return dateValue;
  
  // If it's a Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // If it's a timestamp number
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  // If it's an ISO string
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }
  
  return new Date();
};

// Helper function to format dates safely
const formatDate = (dateValue: any, formatString: string): string => {
  try {
    const date = parseDate(dateValue);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

interface JobDetailPanelProps {
  job: JobApplication | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (updatedJob: Partial<JobApplication>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const statusConfig = {
  applied: { 
    icon: Circle, 
    color: 'text-blue-500 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-blue-200 dark:border-blue-800/50' 
  },
  interview: { 
    icon: TrendingUp, 
    color: 'text-purple-500 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    border: 'border-purple-200 dark:border-purple-800/50' 
  },
  offer: { 
    icon: CheckCircle2, 
    color: 'text-green-500 dark:text-green-400', 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    border: 'border-green-200 dark:border-green-800/50' 
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-500 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-200 dark:border-red-800/50' 
  },
  archived: { 
    icon: Archive, 
    color: 'text-gray-500 dark:text-gray-400', 
    bg: 'bg-gray-50 dark:bg-gray-800/50', 
    border: 'border-gray-200 dark:border-gray-700' 
  },
  pending_decision: { 
    icon: AlertCircle, 
    color: 'text-yellow-500 dark:text-yellow-400', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    border: 'border-yellow-200 dark:border-yellow-800/50' 
  },
};

// Helper function to get domain from company name
function getDomainFromCompanyName(name?: string | null): string | null {
  if (!name) return null;
  try {
    const slug = name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) return null;
    return `${slug}.com`;
  } catch {
    return null;
  }
}

// Helper function to check if logo exists via API proxy or direct check
async function checkLogoExists(domain: string): Promise<string | null> {
  try {
    // Try using the API proxy first (for development)
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment 
      ? `http://localhost:3000/api/company-logo?domain=${encodeURIComponent(domain)}`
      : `/api/company-logo?domain=${encodeURIComponent(domain)}`;
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.logoUrl) {
          return data.logoUrl;
        }
      }
    } catch (apiError) {
      // API proxy not available, fall back to direct check
      console.debug('API proxy not available, using direct check');
    }
    
    // Fallback: Direct check using image element
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(logoUrl);
      img.onerror = () => resolve(null);
      img.src = logoUrl;
      // Timeout after 2 seconds
      setTimeout(() => resolve(null), 2000);
    });
  } catch {
    return null;
  }
}

export const JobDetailPanel = ({ job, open, onClose, onUpdate, onDelete }: JobDetailPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<JobApplication>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'activity' | 'ai-tools' | 'notes'>('overview');
  const [showAddInterviewForm, setShowAddInterviewForm] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);

  // Fetch company logo when job changes
  useEffect(() => {
    if (!job?.companyName) {
      setCompanyLogoUrl(null);
      return;
    }

    const fetchLogo = async () => {
      setLogoLoading(true);
      const domain = getDomainFromCompanyName(job.companyName);
      
      if (!domain) {
        setCompanyLogoUrl(null);
        setLogoLoading(false);
        return;
      }

      // Check if logo exists and get URL
      const logoUrl = await checkLogoExists(domain);
      setCompanyLogoUrl(logoUrl);
      setLogoLoading(false);
    };

    fetchLogo();
  }, [job?.companyName]);

  if (!job) return null;

  const handleClose = () => {
    setShowAddInterviewForm(false);
    setIsEditing(false);
    setEditedJob({});
    onClose();
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editedJob);
      setIsEditing(false);
      setEditedJob({});
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm('Are you sure you want to delete this application?')) {
      await onDelete();
      onClose();
    }
  };

  const handleAddInterview = async (interviewData: Omit<Interview, 'id'>) => {
    if (!onUpdate || !job) return;

    try {
      // Create new interview with unique ID
      const newInterview: Interview = {
        ...interviewData,
        id: crypto.randomUUID(),
      };

      // Update job with new interview
      const updatedInterviews = [...(job.interviews || []), newInterview];
      
      // Also update status to interview if currently applied
      const updates: Partial<JobApplication> = {
        interviews: updatedInterviews,
      };

      if (job.status === 'applied') {
        updates.status = 'interview';
        
        // Add to status history
        const newStatusChange: StatusChange = {
          status: 'interview',
          date: new Date().toISOString().split('T')[0],
          notes: 'Interview scheduled',
        };
        
        updates.statusHistory = [
          ...(job.statusHistory || []),
          newStatusChange,
        ];
      }

      await onUpdate(updates);
      setShowAddInterviewForm(false);
      toast.success('Interview scheduled successfully!');
    } catch (error) {
      console.error('Error adding interview:', error);
      toast.error('Failed to schedule interview');
    }
  };

  const currentStatus = statusConfig[job.status];
  const StatusIcon = currentStatus.icon;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-400"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-6xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-900 shadow-2xl rounded-l-3xl border-l border-gray-200 dark:border-gray-700">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                      <div className="px-8 py-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-center gap-3 mb-3">
                              {/* Company Logo */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${currentStatus.bg} ${currentStatus.border} border flex items-center justify-center overflow-hidden`}>
                                {logoLoading ? (
                                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
                                ) : companyLogoUrl ? (
                                  <img 
                                    src={companyLogoUrl} 
                                    alt={job.companyName}
                                    className="w-full h-full object-contain p-1.5"
                                    onError={() => setCompanyLogoUrl(null)}
                                  />
                                ) : (
                                  <Building2 className={`w-5 h-5 ${currentStatus.color}`} />
                                )}
                              </div>
                              <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                                {job.position}
                              </Dialog.Title>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                              <span className="text-lg font-medium">{job.companyName}</span>
                              <span className="text-gray-400 dark:text-gray-600">•</span>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                </button>
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                                  >
                                    <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                  </a>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={handleDelete}
                                    className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditing(false);
                                    setEditedJob({});
                                  }}
                                  className="px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium text-gray-900 dark:text-gray-100"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={handleClose}
                              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group ml-2"
                            >
                              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                            </button>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-4">
                          <StatusBadge
                            status={job.status}
                            isEditing={isEditing}
                            onChange={(newStatus) => setEditedJob({ ...editedJob, status: newStatus })}
                          />
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="px-8 flex gap-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
                        {([
                          { id: 'overview', label: 'Overview', icon: null, badge: null },
                          { id: 'interviews', label: 'Interviews', icon: null, badge: null },
                          { id: 'activity', label: 'Activity', icon: null, badge: null },
                          { id: 'ai-tools', label: 'AI Tools', icon: Sparkles, badge: 'New' },
                          { id: 'notes', label: 'Notes', icon: StickyNote, badge: job.stickyNotes?.length || 0 },
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setShowAddInterviewForm(false);
                            }}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                              activeTab === tab.id
                                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            <span>{tab.label}</span>
                            {tab.badge && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  tab.badge === 'New'
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
                                    : tab.badge > 0
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {tab.badge}
                              </motion.span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Two-Column Layout */}
                    <div className="flex-1 px-8 py-6">
                      <div className={`grid grid-cols-1 ${activeTab === 'ai-tools' || activeTab === 'notes' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
                        {/* Left Column - Main Content */}
                        <div className={`${activeTab === 'ai-tools' || activeTab === 'notes' ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
                          {activeTab === 'overview' && (
                            <>
                              {/* AI Powered Summary Section */}
                              <SectionCard 
                                title={
                                  <div className="flex items-center gap-2">
                                    <span>AI Powered Summary</span>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium">
                                      <Sparkles className="w-3 h-3" />
                                      <span>AI</span>
                                    </div>
                                  </div>
                                } 
                                icon={Sparkles}
                              >
                                {isEditing ? (
                                  <textarea
                                    value={editedJob.description !== undefined ? editedJob.description : job.description || ''}
                                    onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                                    className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    placeholder="• Key responsibilities and main duties...&#10;• Required qualifications and experience...&#10;• Notable aspects and unique selling points..."
                                  />
                                ) : (
                                  <EnhancedJobSummary job={job} />
                                )}
                              </SectionCard>

                              {/* Full Job Description Section */}
                              {job.fullJobDescription && (
                                <SectionCard title="Full Job Description" icon={FileText}>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                      {job.fullJobDescription}
                                    </p>
                                  </div>
                                </SectionCard>
                              )}

                              {/* Notes Section */}
                              <SectionCard title="Notes & Observations" icon={Edit3}>
                                {isEditing ? (
                                  <textarea
                                    value={editedJob.notes !== undefined ? editedJob.notes : job.notes || ''}
                                    onChange={(e) => setEditedJob({ ...editedJob, notes: e.target.value })}
                                    className="w-full min-h-[200px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    placeholder="Add your personal notes, thoughts, or observations about this application..."
                                  />
                                ) : (
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {job.notes || 'No notes yet. Click edit to add your thoughts about this application.'}
                                  </p>
                                )}
                              </SectionCard>

                              {/* Contact Information */}
                              {(job.contactName || job.contactEmail || job.contactPhone) && (
                                <SectionCard title="Contact Information" icon={Mail}>
                                  <div className="space-y-3">
                                    {job.contactName && (
                                      <PropertyRow icon={Mail} label="Contact Name" value={job.contactName} />
                                    )}
                                    {job.contactEmail && (
                                      <PropertyRow
                                        icon={Mail}
                                        label="Email"
                                        value={job.contactEmail}
                                        link={`mailto:${job.contactEmail}`}
                                      />
                                    )}
                                    {job.contactPhone && (
                                      <PropertyRow
                                        icon={Phone}
                                        label="Phone"
                                        value={job.contactPhone}
                                        link={`tel:${job.contactPhone}`}
                                      />
                                    )}
                                  </div>
                                </SectionCard>
                              )}
                            </>
                          )}

                          {activeTab === 'interviews' && (
                            <>
                              {/* Add Interview Form */}
                              <AnimatePresence>
                                {showAddInterviewForm && (
                                  <AddInterviewForm
                                    onAdd={handleAddInterview}
                                    onCancel={() => setShowAddInterviewForm(false)}
                                  />
                                )}
                              </AnimatePresence>

                              {/* Interviews List */}
                              <SectionCard 
                                title="Interviews" 
                                icon={Calendar}
                                action={
                                  !showAddInterviewForm && (
                                    <button
                                      onClick={() => setShowAddInterviewForm(true)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800/50 transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add Interview
                                    </button>
                                  )
                                }
                              >
                                {job.interviews && job.interviews.length > 0 ? (
                                  <div className="space-y-4">
                                    {job.interviews.map((interview) => (
                                      <InterviewCard 
                                        key={interview.id} 
                                        interview={interview}
                                        jobApplication={job}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No interviews scheduled yet</p>
                                    <button 
                                      onClick={() => setShowAddInterviewForm(true)}
                                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Schedule Interview
                                    </button>
                                  </div>
                                )}
                              </SectionCard>
                            </>
                          )}

                          {activeTab === 'activity' && (
                            <SectionCard title="Activity Timeline" icon={Clock}>
                              {job.statusHistory && job.statusHistory.length > 0 ? (
                                <div className="space-y-4">
                                  {job.statusHistory.map((change, index) => (
                                    <TimelineItem
                                      key={index}
                                      change={change}
                                      isLast={index === job.statusHistory!.length - 1}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                  <p className="text-gray-500 dark:text-gray-400">No activity recorded yet</p>
                                </div>
                              )}
                            </SectionCard>
                          )}

                          {activeTab === 'ai-tools' && (
                            <AIToolsTab job={job} onUpdate={onUpdate} />
                          )}

                          {activeTab === 'notes' && (
                            <NotesTab job={job} onUpdate={onUpdate} />
                          )}
                        </div>

                        {/* Right Column - Sidebar (hidden for AI Tools and Notes tabs) */}
                        {activeTab !== 'ai-tools' && activeTab !== 'notes' && (
                        <div className="lg:col-span-1 space-y-4">
                          {/* Status Card */}
                          <SectionCard title="Application Status">
                            <div className={`p-4 rounded-xl ${currentStatus.bg} ${currentStatus.border} border`}>
                              <div className="flex items-center gap-3">
                                <StatusIcon className={`w-5 h-5 ${currentStatus.color}`} />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{job.status.replace('_', ' ')}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Current stage</div>
                                </div>
                              </div>
                            </div>
                          </SectionCard>

                          {/* Key Details */}
                          <SectionCard title="Key Details">
                            <div className="space-y-3">
                              <PropertyRow
                                icon={Calendar}
                                label="Applied"
                                value={formatDate(job.appliedDate, 'MMM d, yyyy')}
                              />
                              <PropertyRow icon={MapPin} label="Location" value={job.location} />
                              {job.salary && (
                                <PropertyRow icon={DollarSign} label="Salary" value={job.salary} isEditing={isEditing} />
                              )}
                              {job.url && (
                                <PropertyRow
                                  icon={LinkIcon}
                                  label="Job Posting"
                                  value="View Original"
                                  link={job.url}
                                />
                              )}
                            </div>
                          </SectionCard>

                          {/* Quick Stats */}
                          <SectionCard title="Quick Stats">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Interviews</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {job.interviews?.length || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Status Changes</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {job.statusHistory?.length || 0}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Days Since Applied</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {Math.floor(
                                    (new Date().getTime() - parseDate(job.appliedDate).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )}
                                </span>
                              </div>
                            </div>
                          </SectionCard>

                          {/* Metadata */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <div>Created: {formatDate(job.createdAt, 'MMM d, yyyy HH:mm')}</div>
                            <div>Updated: {formatDate(job.updatedAt, 'MMM d, yyyy HH:mm')}</div>
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">ID: {job.id}</div>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

