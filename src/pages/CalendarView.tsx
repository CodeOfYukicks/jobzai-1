import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { collection, query, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Briefcase, 
  Calendar as CalIcon, 
  Check, 
  X,
  MapPin,
  Clock,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  Plus,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Import types from JobApplicationsPage
interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  feedback?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
}

interface StatusChange {
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';
  date: string;
  notes?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';
  appliedDate: string;
  url?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salary?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  interviews?: Interview[];
  statusHistory?: StatusChange[];
}

// Setup le localisateur pour le calendrier
const localizer = momentLocalizer(moment);

// Créer le composant Calendar avec drag and drop
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

// Types pour les événements du calendrier
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  type: 'interview' | 'application';
  color?: string;
}

// Composant Modal pour afficher les détails d'un événement
interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

const EventModal = ({ event, onClose }: EventModalProps) => {
  const navigate = useNavigate();
  
  if (!event) return null;
  
  const isInterview = event.type === 'interview';
  const resource = event.resource || {};
  const application = isInterview ? resource.application : resource;
  const interview = isInterview ? resource.interview : null;
  
  const handleNavigateToPrep = () => {
    if (isInterview && application?.id && interview?.id) {
      navigate(`/interview-prep/${application.id}/${interview.id}`);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
          <div>
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">{event.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {moment(event.start).format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Date et heure */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">
                {moment(event.start).format('dddd, MMMM D, YYYY')}
              </p>
              {!event.allDay && (
                <p className="text-gray-600 dark:text-gray-400">
                  {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </p>
              )}
            </div>
          </div>
          
          {/* Entreprise */}
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium">
                {application?.companyName || 'Company'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {application?.position || 'Position'}
              </p>
            </div>
          </div>
          
          {/* Lieu (pour les entretiens) */}
          {isInterview && interview?.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {interview.location}
                </p>
              </div>
            </div>
          )}
          
          {/* Contact (pour les entretiens) */}
          {isInterview && interview?.contactName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Contact</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {interview.contactName}
                  {interview.contactEmail && ` • ${interview.contactEmail}`}
                </p>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {(isInterview && interview?.notes) || application?.notes ? (
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {isInterview ? interview?.notes : application?.notes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
          >
            Close
          </button>
          
          {isInterview && application?.id && interview?.id && (
            <button 
              onClick={handleNavigateToPrep}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium active:scale-95 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Prepare for Interview
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Composant Modal pour ajouter un événement
interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
}

const AddEventModal = ({ selectedDate, onClose, onAddEvent }: AddEventModalProps) => {
  const [eventType, setEventType] = useState<'application' | 'interview'>('application');
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    location: '',
    notes: '',
    url: '',
    interviewType: 'technical',
    interviewTime: moment(selectedDate).format('HH:mm'),
    contactName: '',
    contactEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Préparer les données selon le type d'événement
      const eventData = {
        ...formData,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        eventType,
      };
      
      await onAddEvent(eventData);
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
          <div>
            <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            Add {eventType === 'application' ? 'Job Application' : 'Interview'}
          </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {moment(selectedDate).format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Sélection du type d'événement */}
          <div className="flex gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setEventType('application')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                eventType === 'application' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Application
            </button>
            <button
              type="button"
              onClick={() => setEventType('interview')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                eventType === 'interview' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalIcon className="w-4 h-4 inline mr-2" />
              Interview
            </button>
          </div>
          
          {/* Champs communs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Company Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Position *</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter position"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter location"
              />
            </div>
            
            {/* Champs spécifiques pour les entretiens */}
            {eventType === 'interview' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Interview Type</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => setFormData({...formData, interviewType: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="manager">Manager</option>
                    <option value="final">Final</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Time</label>
                  <input
                    type="time"
                    value={formData.interviewTime}
                    onChange={(e) => setFormData({...formData, interviewTime: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter contact email"
                  />
                </div>
              </>
            )}
            
            {/* URL pour les candidatures */}
            {eventType === 'application' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Job URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="https://..."
                />
              </div>
            )}
            
            {/* Notes pour les deux types */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-800 min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Add any relevant notes..."
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-70 font-medium active:scale-95 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Event
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};


export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [showApplications, setShowApplications] = useState(true);
  const [showInterviews, setShowInterviews] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justSelectedEvent, setJustSelectedEvent] = useState(false);

  // Styles personnalisés pour améliorer la lisibilité des événements multiples
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
      .rbc-event {
        margin-bottom: 2px !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      .rbc-event:last-child {
        margin-bottom: 0 !important;
      }
      
      .rbc-month-view .rbc-event {
        min-height: 22px !important;
        margin-bottom: 2px !important;
      }
      
      .rbc-month-view .rbc-day-slot .rbc-events-container {
        margin-right: 0 !important;
      }
      
      .rbc-month-view .rbc-day-slot .rbc-event {
        margin-bottom: 2px !important;
      }
      
      .rbc-agenda-view .rbc-event {
        min-height: 28px !important;
      }
      
      .rbc-time-view .rbc-event {
        min-height: 28px !important;
      }
      
      .rbc-event-content {
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      .rbc-event:active {
        cursor: grabbing !important;
      }
      
      .rbc-event.rbc-selected {
        outline: 2px solid rgba(139, 92, 246, 0.5) !important;
        outline-offset: 2px !important;
      }
      
      /* Styles pour améliorer le drag and drop */
      
      .rbc-addons-dnd-drag-preview {
        opacity: 0.8 !important;
        z-index: 1000 !important;
      }
      
      .rbc-addons-dnd-dragging {
        opacity: 0.5 !important;
      }
      
      /* Styles pour les jours hors mois en mode sombre */
      .dark .rbc-off-range-bg {
        background-color: rgb(31, 41, 55) !important;
      }
      
      .dark .rbc-off-range {
        background-color: rgb(31, 41, 55) !important;
        color: rgb(156, 163, 175) !important;
      }
      
      .dark .rbc-day-bg.rbc-off-range-bg {
        background-color: rgb(31, 41, 55) !important;
      }
      
      .dark .rbc-date-cell.rbc-off-range {
        background-color: rgb(31, 41, 55) !important;
        color: rgb(156, 163, 175) !important;
      }
      
      .dark .rbc-date-cell.rbc-off-range a {
        color: rgb(156, 163, 175) !important;
      }
      
      .dark .rbc-day-slot.rbc-off-range-bg {
        background-color: rgb(31, 41, 55) !important;
      }
      
      .dark .rbc-month-view .rbc-day-bg.rbc-off-range-bg {
        background-color: rgb(31, 41, 55) !important;
      }
      
      .dark .rbc-month-view .rbc-date-cell.rbc-off-range {
        background-color: rgb(31, 41, 55) !important;
      }
      
      .dark .rbc-month-view .rbc-date-cell.rbc-off-range a {
        color: rgb(156, 163, 175) !important;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchApplicationsAndInterviews = async () => {
      try {
        setIsLoading(true);
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        const newEvents: CalendarEvent[] = [];
        
        // Convertir les candidatures et entretiens en événements de calendrier
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          // Ajouter la date de candidature comme événement
          if (application.appliedDate) {
            const appliedDate = new Date(application.appliedDate);
            newEvents.push({
              id: `app-${application.id}`,
              title: `Applied: ${application.companyName} - ${application.position}`,
              start: appliedDate,
              end: appliedDate,
              allDay: true,
              type: 'application',
              color: '#8b5cf6', // purple
              resource: application
            });
          }
          
          // Ajouter les entretiens comme événements
          if (application.interviews && application.interviews.length > 0) {
            application.interviews.forEach((interview, index) => {
              if (interview.date) {
                const interviewDate = new Date(interview.date);
                const [hours, minutes] = (interview.time || '09:00').split(':').map(Number);
                interviewDate.setHours(hours, minutes);
                
                // Créer une date de fin (par défaut, 1 heure plus tard)
                const endDate = new Date(interviewDate);
                endDate.setHours(endDate.getHours() + 1);
                
                // Couleur basée sur le type d'entretien
                let color = '#6366f1'; // indigo par défaut
                if (interview.type === 'hr') color = '#ec4899'; // pink
                if (interview.type === 'technical') color = '#14b8a6'; // teal
                if (interview.type === 'manager') color = '#f59e0b'; // amber
                if (interview.type === 'final') color = '#22c55e'; // green
                
                // Modifier la couleur si l'entretien est annulé
                if (interview.status === 'cancelled') color = '#ef4444'; // red
                
                newEvents.push({
                  id: `int-${application.id}-${index}`,
                  title: `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview: ${application.companyName}`,
                  start: interviewDate,
                  end: endDate,
                  allDay: false,
                  type: 'interview',
                  color,
                  resource: { ...application, interview }
                });
              }
            });
          }
        });
        
        setEvents(newEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicationsAndInterviews();
  }, [currentUser]);

  // Gestion du drag and drop des événements
  const handleEventDrop = async ({ event, start, end }: any) => {
    if (!currentUser) return;
    
    setIsDragging(false);
    
    // Utiliser end si fourni, sinon calculer la durée à partir de l'événement original
    const eventEnd = end || new Date(start.getTime() + (event.end.getTime() - event.start.getTime()));
    
    try {
      const eventId = event.id;
      const isApplication = event.type === 'application';
      
      if (isApplication) {
        // Mettre à jour la date de candidature
        const applicationId = eventId.replace('app-', '');
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        const newDate = moment(start).format('YYYY-MM-DD');
        
        await updateDoc(applicationRef, {
          appliedDate: newDate,
          updatedAt: serverTimestamp(),
          statusHistory: [
            ...(event.resource?.statusHistory || []),
            {
              status: event.resource?.status || 'applied',
              date: newDate,
              notes: 'Date updated via calendar drag and drop'
            }
          ]
        });
        
        // Mettre à jour l'événement local
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, start, end: start, resource: { ...e.resource, appliedDate: newDate } }
            : e
        ));
        
        toast.success('Application date updated');
      } else {
        // Mettre à jour la date/heure de l'entretien
        const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        // Récupérer l'application actuelle
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        let currentApplication: any = null;
        
        applicationsSnapshot.forEach(doc => {
          if (doc.id === applicationId) {
            currentApplication = { id: doc.id, ...doc.data() };
          }
        });
        
        if (!currentApplication || !currentApplication.interviews) {
          toast.error('Interview not found');
          return;
        }
        
        // Trouver l'index de l'entretien
        const interviewIndexNum = parseInt(interviewIndex);
        const interview = currentApplication.interviews[interviewIndexNum];
        
        if (!interview) {
          toast.error('Interview not found');
          return;
        }
        
        // Mettre à jour la date et l'heure
        const newDate = moment(start).format('YYYY-MM-DD');
        const newTime = moment(start).format('HH:mm');
        
        const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
          idx === interviewIndexNum 
            ? { ...int, date: newDate, time: newTime }
            : int
        );
        
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp()
        });
        
        // Mettre à jour l'événement local - utiliser eventEnd calculé plus haut
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, start, end: eventEnd, resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } } }
            : e
        ));
        
        toast.success('Interview date updated');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      // Recharger les événements en cas d'erreur
      if (currentUser) {
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        const newEvents: CalendarEvent[] = [];
        
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          if (application.appliedDate) {
            const appliedDate = new Date(application.appliedDate);
            newEvents.push({
              id: `app-${application.id}`,
              title: `Applied: ${application.companyName} - ${application.position}`,
              start: appliedDate,
              end: appliedDate,
              allDay: true,
              type: 'application',
              color: '#8b5cf6',
              resource: application
            });
          }
          
          if (application.interviews && application.interviews.length > 0) {
            application.interviews.forEach((interview, index) => {
              if (interview.date) {
                const interviewDate = new Date(interview.date);
                const [hours, minutes] = (interview.time || '09:00').split(':').map(Number);
                interviewDate.setHours(hours, minutes);
                
                const endDate = new Date(interviewDate);
                endDate.setHours(endDate.getHours() + 1);
                
                let color = '#6366f1';
                if (interview.type === 'hr') color = '#ec4899';
                if (interview.type === 'technical') color = '#14b8a6';
                if (interview.type === 'manager') color = '#f59e0b';
                if (interview.type === 'final') color = '#22c55e';
                if (interview.status === 'cancelled') color = '#ef4444';
                
                newEvents.push({
                  id: `int-${application.id}-${index}`,
                  title: `${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview: ${application.companyName}`,
                  start: interviewDate,
                  end: endDate,
                  allDay: false,
                  type: 'interview',
                  color,
                  resource: { ...application, interview }
                });
              }
            });
          }
        });
        
        setEvents(newEvents);
      }
    }
  };
  
  const handleEventResize = async ({ event, start, end }: any) => {
    if (!currentUser || event.type === 'application') return; // Les applications sont allDay, pas de resize
    
    setIsDragging(false);
    
    try {
      const eventId = event.id;
      const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      let currentApplication: any = null;
      
      applicationsSnapshot.forEach(doc => {
        if (doc.id === applicationId) {
          currentApplication = { id: doc.id, ...doc.data() };
        }
      });
      
      if (!currentApplication || !currentApplication.interviews) {
        return;
      }
      
      const interviewIndexNum = parseInt(interviewIndex);
      const interview = currentApplication.interviews[interviewIndexNum];
      
      if (!interview) {
        return;
      }
      
      // Calculer la nouvelle heure de fin
      const newTime = moment(start).format('HH:mm');
      const newDate = moment(start).format('YYYY-MM-DD');
      
      const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
        idx === interviewIndexNum 
          ? { ...int, date: newDate, time: newTime }
          : int
      );
      
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, start, end, resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } } }
          : e
      ));
      
      toast.success('Interview duration updated');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to update interview duration');
    }
  };

  // Filtre des événements selon les types sélectionnés
  const filteredEvents = events.filter(event => 
    (showApplications && event.type === 'application') || 
    (showInterviews && event.type === 'interview')
  );

  // Personnalisation de l'apparence des événements dans le calendrier
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '6px',
        opacity: isDragging ? 0.7 : 1,
        color: 'white',
        border: '0',
        display: 'block',
        fontWeight: 500,
        padding: '0',
        marginBottom: '2px',
        boxShadow: isDragging 
          ? '0 8px 16px rgba(0,0,0,0.2)' 
          : '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'grab',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        minHeight: selectedView === 'month' ? '22px' : '28px',
        overflow: 'hidden',
      }
    };
  };

  // Navigation dans le calendrier
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToPrevious = () => {
    const newDate = new Date(currentDate);
    if (selectedView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (selectedView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    if (selectedView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (selectedView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };


  // Fonction pour ajouter un événement
  const handleAddEvent = async (eventData: any) => {
    if (!currentUser) return;
    
    try {
      if (eventData.eventType === 'application') {
        // Ajouter une nouvelle candidature
        const applicationData = {
          companyName: eventData.companyName,
          position: eventData.position,
          location: eventData.location || '',
          status: 'applied',
          appliedDate: eventData.date,
          url: eventData.url || '',
          notes: eventData.notes || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          statusHistory: [{
            status: 'applied',
            date: eventData.date,
            notes: 'Application created from calendar'
          }]
        };
        
        const docRef = await addDoc(
          collection(db, 'users', currentUser.uid, 'jobApplications'), 
          applicationData
        );
        
        // Ajouter l'événement au state local
        const newEvent: CalendarEvent = {
          id: `app-${docRef.id}`,
          title: `Applied: ${eventData.companyName} - ${eventData.position}`,
          start: new Date(eventData.date),
          end: new Date(eventData.date),
          allDay: true,
          type: 'application',
          color: '#8b5cf6', // purple
          resource: { id: docRef.id, ...applicationData }
        };
        
        setEvents(prev => [...prev, newEvent]);
        toast.success('Job application added successfully');
      } else {
        // Pour un entretien, vérifier si une candidature existe déjà
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        // Chercher une candidature existante pour cette entreprise et poste
        let existingApplication: any = null;
        applicationsSnapshot.forEach(doc => {
          const app = doc.data() as any;
          if (
            app.companyName?.toLowerCase() === eventData.companyName.toLowerCase() &&
            app.position?.toLowerCase() === eventData.position.toLowerCase()
          ) {
            existingApplication = { id: doc.id, ...app };
          }
        });
        
        let applicationId;
        
        if (existingApplication) {
          // Utiliser la candidature existante
          applicationId = existingApplication.id;
        } else {
          // Créer une nouvelle candidature
          const applicationData = {
            companyName: eventData.companyName,
            position: eventData.position,
            location: eventData.location || '',
            status: 'interview',
            appliedDate: eventData.date, // Using the same date
            notes: eventData.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            statusHistory: [{
              status: 'applied',
              date: eventData.date,
              notes: 'Application created from calendar'
            }, {
              status: 'interview',
              date: eventData.date,
              notes: 'Interview scheduled from calendar'
            }]
          };
          
          const docRef = await addDoc(
            collection(db, 'users', currentUser.uid, 'jobApplications'), 
            applicationData
          );
          
          applicationId = docRef.id;
          
          // Add the application event too
          const newApplicationEvent: CalendarEvent = {
            id: `app-${docRef.id}`,
            title: `Applied: ${eventData.companyName} - ${eventData.position}`,
            start: new Date(eventData.date),
            end: new Date(eventData.date),
            allDay: true,
            type: 'application',
            color: '#8b5cf6', // purple
            resource: { id: docRef.id, ...applicationData }
          };
          
          setEvents(prev => [...prev, newApplicationEvent]);
        }
        
        // Ajouter l'entretien
        const interviewData = {
          id: crypto.randomUUID(),
          date: eventData.date,
          time: eventData.interviewTime,
          type: eventData.interviewType,
          status: 'scheduled',
          location: eventData.location || '',
          notes: eventData.notes || '',
          contactName: eventData.contactName || '',
          contactEmail: eventData.contactEmail || ''
        };
        
        // Mise à jour de la candidature avec le nouvel entretien
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: existingApplication?.interviews ? [...existingApplication.interviews, interviewData] : [interviewData],
          status: 'interview',
          updatedAt: serverTimestamp(),
          statusHistory: existingApplication?.statusHistory ? 
            [...existingApplication.statusHistory, {
              status: 'interview',
              date: eventData.date,
              notes: 'Interview added from calendar'
            }] : 
            [{
              status: 'applied',
              date: eventData.date,
              notes: 'Application created from calendar'
            }, {
              status: 'interview',
              date: eventData.date,
              notes: 'Interview scheduled from calendar'
            }]
        });
        
        // Déterminer la couleur en fonction du type d'entretien
        let color = '#6366f1'; // indigo par défaut
        if (eventData.interviewType === 'hr') color = '#ec4899'; // pink
        if (eventData.interviewType === 'technical') color = '#14b8a6'; // teal
        if (eventData.interviewType === 'manager') color = '#f59e0b'; // amber
        if (eventData.interviewType === 'final') color = '#22c55e'; // green
        
        // Créer la date et l'heure de l'entretien
        const interviewDate = new Date(eventData.date);
        const [hours, minutes] = eventData.interviewTime.split(':').map(Number);
        interviewDate.setHours(hours, minutes);
        
        // Créer une date de fin (par défaut, 1 heure plus tard)
        const endDate = new Date(interviewDate);
        endDate.setHours(endDate.getHours() + 1);
        
        // Ajouter l'événement d'entretien au state local
        const newInterviewEvent: CalendarEvent = {
          id: `int-${applicationId}-${interviewData.id}`,
          title: `${eventData.interviewType.charAt(0).toUpperCase() + eventData.interviewType.slice(1)} Interview: ${eventData.companyName}`,
          start: interviewDate,
          end: endDate,
          allDay: false,
          type: 'interview',
          color,
          resource: { 
            id: applicationId, 
            companyName: eventData.companyName,
            position: eventData.position,
            interview: interviewData
          }
        };
        
        setEvents(prev => [...prev, newInterviewEvent]);
        toast.success('Interview added successfully');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
      throw error;
    }
  };

  // Gestion du double-clic sur le calendrier
  const handleSlotSelect = (slotInfo: any) => {
    // Ne pas créer d'événement si on est en train de faire un drag
    if (isDragging) {
      return;
    }
    
    // Vérifier si on a cliqué sur un événement existant
    const clickedEvent = filteredEvents.find(event => {
      const slotStart = moment(slotInfo.start);
      const slotEnd = moment(slotInfo.end || slotInfo.start);
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      // Vérifier si le slot sélectionné chevauche avec un événement
      return (slotStart.isSameOrBefore(eventEnd) && slotEnd.isSameOrAfter(eventStart));
    });
    
    // Si on a cliqué sur un événement, ne pas créer de nouvel événement
    if (clickedEvent) {
      return;
    }
    
    // Ne pas créer d'événement si on vient de cliquer sur un événement existant
    if (justSelectedEvent) {
      return;
    }
    
    setSelectedSlot(slotInfo.start);
    setShowAddEventModal(true);
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-purple-600 dark:text-white mb-2">
            Calendar View
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Visualize and manage your job applications and interviews. Drag events to reschedule them.
          </p>
        </motion.div>

        {/* Contrôles avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          {/* View selection */}
          <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
            <button
              onClick={() => setSelectedView('month')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'month' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Month
            </button>
            <button
              onClick={() => setSelectedView('week')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'week' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Week
            </button>
            <button
              onClick={() => setSelectedView('day')}
              className={`px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 ${
                selectedView === 'day' 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Day
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 text-sm rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                showApplications 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input 
                type="checkbox" 
                checked={showApplications} 
                onChange={() => setShowApplications(!showApplications)} 
                className="sr-only"
              />
              <Briefcase className="w-4 h-4 mr-2" />
              Applications
              {showApplications && <Check className="w-4 h-4 ml-2" />}
            </motion.label>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2 text-sm rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                showInterviews 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input 
                type="checkbox" 
                checked={showInterviews} 
                onChange={() => setShowInterviews(!showInterviews)} 
                className="sr-only" 
              />
              <CalIcon className="w-4 h-4 mr-2" />
              Interviews
              {showInterviews && <Check className="w-4 h-4 ml-2" />}
            </motion.label>
          </div>
        </motion.div>
        
        {/* Calendrier avec navigation améliorée */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
        >
          {/* Contrôles de navigation du calendrier */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
            <div className="flex items-center gap-3">
              <button 
                onClick={navigateToPrevious}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={navigateToToday}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors active:scale-95 shadow-sm"
              >
                Today
              </button>
              <button 
                onClick={navigateToNext}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold ml-2 text-gray-900 dark:text-gray-100">
                {selectedView === 'month' && moment(currentDate).format('MMMM YYYY')}
                {selectedView === 'week' && `Week of ${moment(currentDate).startOf('week').format('MMM D')} - ${moment(currentDate).endOf('week').format('MMM D, YYYY')}`}
                {selectedView === 'day' && moment(currentDate).format('dddd, MMMM D, YYYY')}
              </h2>
            </div>
            
            {/* Hint pour drag and drop */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <GripVertical className="w-4 h-4" />
              <span>Drag events to reschedule</span>
            </div>
          </div>

          {/* Calendrier */}
          <div className="h-[75vh] p-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <DragAndDropCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={selectedView}
                date={currentDate}
                onNavigate={date => setCurrentDate(date)}
                onView={(view) => setSelectedView(view as any)}
                eventPropGetter={eventStyleGetter}
                popup
                tooltipAccessor={(event) => `${event.title}`}
                onSelectEvent={(event) => {
                  // Ne pas ouvrir le modal si on est en train de faire un drag
                  if (isDragging) {
                    return;
                  }
                  setJustSelectedEvent(true);
                  setSelectedEvent(event);
                  // Réinitialiser le flag après un délai pour éviter les doubles déclenchements
                  setTimeout(() => {
                    setJustSelectedEvent(false);
                  }, 300);
                }}
                selectable={true}
                onSelectSlot={handleSlotSelect}
                draggableAccessor={() => true}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                resizable
                onDragStart={() => {
                  setIsDragging(true);
                  setJustSelectedEvent(false); // Réinitialiser le flag lors du drag
                }}
                dayPropGetter={(date) => {
                  const today = new Date();
                  if (
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear()
                  ) {
                    return {
                      className: 'rbc-today',
                      style: {
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        borderLeft: '3px solid #8b5cf6',
                      },
                    };
                  }
                  return {};
                }}
                components={{
                  toolbar: () => null,
                  event: ({ event }: any) => (
                    <div 
                      className="rbc-event-content flex items-center gap-1.5 min-h-[24px] px-2 py-1"
                    >
                      <GripVertical className="w-3 h-3 opacity-60 flex-shrink-0" />
                      <span className="flex-1 truncate text-xs font-medium leading-tight">{event.title}</span>
                    </div>
                  ),
                  month: {
                    event: ({ event }: any) => (
                      <div 
                        className="rbc-event-content flex items-center gap-1.5 min-h-[22px] px-1.5 py-0.5 mb-0.5 last:mb-0"
                      >
                        <GripVertical className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                        <span className="flex-1 truncate text-xs font-medium leading-tight">{event.title}</span>
                      </div>
                    ),
                  },
                }}
              />
            )}
          </div>
        </motion.div>
        
        {/* Modal pour les détails d'événement */}
        <AnimatePresence>
        {selectedEvent && (
          <EventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
        </AnimatePresence>
        
        {/* Modal pour ajouter un événement */}
        <AnimatePresence>
        {showAddEventModal && selectedSlot && (
          <AddEventModal
            selectedDate={selectedSlot}
            onClose={() => {
              setShowAddEventModal(false);
              setSelectedSlot(null);
            }}
            onAddEvent={handleAddEvent}
          />
        )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}