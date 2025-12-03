import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Edit3,
  Save,
  Trash2,
  Plus,
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
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { JobApplication, Interview, StatusChange } from '../../types/job';
import { JobStatusBadge } from './JobStatusBadge';
import { PropertyRow } from './PropertyRow';
import { SectionCard } from './SectionCard';
import { TimelineItem } from './TimelineItem';
import { InterviewCard } from './InterviewCard';
import { AddInterviewForm } from './AddInterviewForm';
import { AIToolsTab } from './AIToolsTab';
import { NotesTab } from './NotesTab';
import { EnhancedJobSummary } from './EnhancedJobSummary';
import { ResumeLab } from './ResumeLab';
import { LinkedDocumentsTab } from './LinkedDocumentsTab';
import { toast } from 'sonner';
import { CompanyLogo } from '../common/CompanyLogo';

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
  wishlist: {
    icon: Tag,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/50'
  },
};

export const JobDetailPanel = ({ job, open, onClose, onUpdate, onDelete }: JobDetailPanelProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<JobApplication>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'activity' | 'ai-tools' | 'notes' | 'resume-lab' | 'linked-documents'>('overview');
  const [showAddInterviewForm, setShowAddInterviewForm] = useState(false);
  // Logo states removed - now using CompanyLogo component

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
      const updates = { ...editedJob };

      // Check if status changed
      if (updates.status && updates.status !== job.status) {
        const newStatusChange: StatusChange = {
          status: updates.status,
          date: new Date().toISOString(),
          notes: 'Status updated',
        };

        // Append to statusHistory
        updates.statusHistory = [
          ...(job.statusHistory || []),
          newStatusChange
        ];
      }

      await onUpdate(updates);
      setIsEditing(false);
      setEditedJob({});
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
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

      // Only update interviews - let parent component handle status change via modal prompt
      // if status is 'wishlist' or 'applied'
      const updates: Partial<JobApplication> = {
        interviews: updatedInterviews,
      };

      // Don't auto-update status if it's wishlist or applied - let modal handle it
      // For other statuses, keep existing behavior (though they probably won't need status change)

      await onUpdate(updates);
      setShowAddInterviewForm(false);
      
      // Don't show toast here - parent component will show modal or toast as appropriate
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
                              <CompanyLogo
                                companyName={job.companyName}
                                size="lg"
                                className={`rounded-xl ${currentStatus.bg} ${currentStatus.border} border`}
                                showInitials={true}
                              />
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
                          <JobStatusBadge
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
                          { id: 'resume-lab', label: 'Resume Lab', icon: Target, badge: job.cvAnalysisId ? null : 'link' },
                          { id: 'linked-documents', label: 'Linked Documents', icon: FileText, badge: ((job.linkedResumeIds?.length || 0) + (job.linkedNoteIds?.length || 0) + (job.linkedDocumentIds?.length || 0) + (job.linkedWhiteboardIds?.length || 0)) > 0 ? ((job.linkedResumeIds?.length || 0) + (job.linkedNoteIds?.length || 0) + (job.linkedDocumentIds?.length || 0) + (job.linkedWhiteboardIds?.length || 0)) : null },
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setShowAddInterviewForm(false);
                            }}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
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
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${tab.badge === 'New'
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
                                  : typeof tab.badge === 'number' && tab.badge > 0
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
                      <div className={`grid grid-cols-1 ${activeTab === 'ai-tools' || activeTab === 'notes' || activeTab === 'resume-lab' || activeTab === 'linked-documents' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
                        {/* Left Column - Main Content */}
                        <div className={`${activeTab === 'ai-tools' || activeTab === 'notes' || activeTab === 'resume-lab' || activeTab === 'linked-documents' ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
                          {activeTab === 'overview' && (
                            <div className="space-y-8">
                              {/* Quick Stats / Highlights */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Applied</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {format(parseDate(job.appliedDate), 'MMM d, yyyy')}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Salary</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {job.salary || 'Not specified'}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Work Type</div>
                                  <div className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {job.workType || 'Not specified'}
                                  </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Platform</div>
                                  <div className="font-semibold text-gray-900 dark:text-white capitalize">
                                    {job.platform || 'Direct'}
                                  </div>
                                </div>
                              </div>

                              {/* AI Powered Summary Section */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    AI Summary
                                  </h3>
                                  {!isEditing && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                                      Auto-generated
                                    </span>
                                  )}
                                </div>

                                {isEditing ? (
                                  <textarea
                                    value={editedJob.description !== undefined ? editedJob.description : job.description || ''}
                                    onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                                    className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    placeholder="• Key responsibilities and main duties...&#10;• Required qualifications and experience...&#10;• Notable aspects and unique selling points..."
                                  />
                                ) : (
                                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                                    <EnhancedJobSummary job={job} />
                                  </div>
                                )}
                              </div>

                              {/* Full Job Description Section */}
                              {job.fullJobDescription && (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    Full Description
                                  </h3>
                                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {job.fullJobDescription}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}


                          {activeTab === 'interviews' && (
                            <div className="space-y-6">
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
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Interview Schedule
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {job.interviews?.length || 0}
                                    </span>
                                  </h3>
                                  {!showAddInterviewForm && (
                                    <button
                                      onClick={() => setShowAddInterviewForm(true)}
                                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-900/20 dark:shadow-none"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Interview
                                    </button>
                                  )}
                                </div>

                                {job.interviews && job.interviews.length > 0 ? (
                                  <div className="grid gap-3">
                                    {job.interviews.map((interview) => (
                                      <InterviewCard
                                        key={interview.id}
                                        interview={interview}
                                        jobApplication={job}
                                        onDelete={async (interviewId) => {
                                          if (!onUpdate || !job) return;
                                          
                                          try {
                                            const updatedInterviews = job.interviews?.filter(
                                              (i) => i.id !== interviewId
                                            ) || [];
                                            
                                            await onUpdate({
                                              interviews: updatedInterviews,
                                            });
                                            
                                            toast.success('Interview deleted successfully');
                                          } catch (error) {
                                            console.error('Error deleting interview:', error);
                                            toast.error('Failed to delete interview');
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  !showAddInterviewForm && (
                                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                      </div>
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                        No interviews scheduled
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                                        Keep track of your interview process by adding scheduled interviews here.
                                      </p>
                                      <button
                                        onClick={() => setShowAddInterviewForm(true)}
                                        className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm inline-flex items-center gap-2 shadow-sm"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Schedule First Interview
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === 'activity' && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  Activity History
                                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {job.statusHistory?.length || 0}
                                  </span>
                                </h3>
                              </div>

                              {job.statusHistory && job.statusHistory.length > 0 ? (
                                <div className="space-y-0 pl-2">
                                  {[...job.statusHistory].reverse().map((change, index) => (
                                    <TimelineItem
                                      key={index}
                                      change={change}
                                      index={index}
                                      isLast={index === job.statusHistory!.length - 1}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                  </div>
                                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                    No activity recorded
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Status changes and updates will appear here.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'ai-tools' && (
                            <AIToolsTab job={job} onUpdate={onUpdate} />
                          )}

                          {activeTab === 'notes' && (
                            <NotesTab job={job} onUpdate={onUpdate} />
                          )}

                          {activeTab === 'resume-lab' && (
                            job.cvAnalysisId ? (
                              <ResumeLab cvAnalysisId={job.cvAnalysisId} />
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                              >
                                <div className="px-12 py-16 text-center">
                                  {/* Premium Icon */}
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="relative inline-flex items-center justify-center mb-8"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl blur-2xl" />
                                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-purple-100 dark:border-purple-800/30 shadow-sm">
                                      <Target className="w-12 h-12 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                                    </div>
                                  </motion.div>

                                  {/* Title */}
                                  <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="text-3xl font-semibold text-gray-900 dark:text-white mb-4 tracking-tight"
                                  >
                                    Unlock Your Application Potential
                                  </motion.h3>

                                  {/* Description */}
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-base text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed"
                                  >
                                    Get a detailed AI analysis of how well your CV matches this job.
                                    Identify gaps, optimize keywords, and boost your interview chances.
                                  </motion.p>

                                  {/* Premium Button */}
                                  <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      navigate('/cv-analysis', {
                                        state: {
                                          jobTitle: job.position,
                                          company: job.companyName,
                                          jobDescription: job.fullJobDescription || job.description || '',
                                          jobUrl: job.url || '',
                                          fromApplication: true,
                                          jobId: job.id,
                                        }
                                      });
                                    }}
                                    className="relative inline-flex items-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg shadow-gray-900/10 dark:shadow-white/10 hover:shadow-xl hover:shadow-gray-900/20 dark:hover:shadow-white/20"
                                  >
                                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                                    <span>Start CV Analysis</span>
                                  </motion.button>
                                </div>
                              </motion.div>
                            )
                          )}

                          {activeTab === 'linked-documents' && (
                            <LinkedDocumentsTab job={job} onUpdate={onUpdate} />
                          )}
                        </div>

                        {/* Right Column - Sidebar (hidden for AI Tools, Notes, Resume Lab, and Linked Documents tabs) */}
                        {activeTab !== 'ai-tools' && activeTab !== 'notes' && activeTab !== 'resume-lab' && activeTab !== 'linked-documents' && (
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
                                    icon={ExternalLink}
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
            </div >
          </div >
        </div >
      </Dialog >
    </Transition >
  );
};

