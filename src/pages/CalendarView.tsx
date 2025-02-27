import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { 
  Calendar as CalendarIcon, 
  Briefcase, 
  Calendar as CalIcon, 
  Check, 
  RefreshCw, 
  Link, 
  Settings,
  X,
  MapPin,
  Clock,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Interview, JobApplication } from './JobApplicationsPage'; // Import des types

// Setup le localisateur pour le calendrier
const localizer = momentLocalizer(moment);

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
  if (!event) return null;
  
  const isInterview = event.type === 'interview';
  const resource = event.resource || {};
  const application = isInterview ? resource : resource;
  const interview = isInterview ? resource.interview : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
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
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [showApplications, setShowApplications] = useState(true);
  const [showInterviews, setShowInterviews] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Connecter à Google Calendar (cette fonction serait implémentée avec l'API Google)
  const connectToGoogleCalendar = async () => {
    // Note: Ceci est un exemple de workflow, l'implémentation réelle nécessite l'API Google
    toast.info('Connecting to Google Calendar...');
    
    // Simuler une connexion réussie après 1 seconde
    setTimeout(() => {
      setGoogleCalendarConnected(true);
      toast.success('Connected to Google Calendar');
    }, 1000);
    
    // L'implémentation réelle utiliserait l'API Google OAuth
    // et le flux d'autorisation pour obtenir un jeton d'accès
  };

  // Synchroniser avec Google Calendar
  const syncWithGoogleCalendar = () => {
    toast.info('Syncing with Google Calendar...');
    
    // Simuler une synchronisation réussie après 1 seconde
    setTimeout(() => {
      toast.success('Synced with Google Calendar');
    }, 1000);
    
    // L'implémentation réelle enverrait les événements vers Google Calendar
    // et récupérerait également les événements Google Calendar
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
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block',
        fontWeight: 500,
        padding: '4px 8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        cursor: 'pointer'
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

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Calendar View
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize your job applications and interviews in calendar format
          </p>
        </div>

        {/* Filtres et contrôles */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedView('month')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                selectedView === 'month' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Month
            </button>
            <button
              onClick={() => setSelectedView('week')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                selectedView === 'week' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Week
            </button>
            <button
              onClick={() => setSelectedView('day')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                selectedView === 'day' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Day
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className={`px-3 py-1.5 text-sm rounded-lg flex items-center cursor-pointer ${
              showApplications ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              <input 
                type="checkbox" 
                checked={showApplications} 
                onChange={() => setShowApplications(!showApplications)} 
                className="sr-only"
              />
              <Briefcase className="w-4 h-4 mr-1.5" />
              Applications
              {showApplications && <Check className="w-4 h-4 ml-1.5" />}
            </label>
            <label className={`px-3 py-1.5 text-sm rounded-lg flex items-center cursor-pointer ${
              showInterviews ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              <input 
                type="checkbox" 
                checked={showInterviews} 
                onChange={() => setShowInterviews(!showInterviews)} 
                className="sr-only" 
              />
              <CalIcon className="w-4 h-4 mr-1.5" />
              Interviews
              {showInterviews && <Check className="w-4 h-4 ml-1.5" />}
            </label>
          </div>
        </div>

        {/* Section Google Calendar */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                googleCalendarConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {googleCalendarConnected 
                    ? 'Your calendar is connected' 
                    : 'Connect to see interviews in your Google Calendar'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!googleCalendarConnected ? (
                <button 
                  onClick={connectToGoogleCalendar}
                  className="px-4 py-2 bg-white dark:bg-gray-700 text-sm border border-gray-200 dark:border-gray-600 rounded-lg flex items-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Link className="w-4 h-4 mr-1.5" />
                  Connect
                </button>
              ) : (
                <>
                  <button 
                    onClick={syncWithGoogleCalendar}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-sm border border-gray-200 dark:border-gray-600 rounded-lg flex items-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Sync Now
                  </button>
                  <button className="px-4 py-2 bg-white dark:bg-gray-700 text-sm border border-gray-200 dark:border-gray-600 rounded-lg flex items-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <Settings className="w-4 h-4 mr-1.5" />
                    Settings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Calendrier avec navigation améliorée */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Contrôles de navigation du calendrier */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={navigateToPrevious}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={navigateToToday}
                className="px-3 py-1.5 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={navigateToNext}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-medium ml-2">
                {selectedView === 'month' && moment(currentDate).format('MMMM YYYY')}
                {selectedView === 'week' && `Week of ${moment(currentDate).startOf('week').format('MMM D')} - ${moment(currentDate).endOf('week').format('MMM D, YYYY')}`}
                {selectedView === 'day' && moment(currentDate).format('dddd, MMMM D, YYYY')}
              </h2>
            </div>
          </div>

          {/* Calendrier */}
          <div className="h-[70vh]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={selectedView}
                date={currentDate}
                onNavigate={date => setCurrentDate(date)}
                onView={(view) => setSelectedView(view as 'month' | 'week' | 'day')}
                eventPropGetter={eventStyleGetter}
                popup
                tooltipAccessor={(event) => `${event.title}`}
                onSelectEvent={(event) => {
                  setSelectedEvent(event);
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
                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                      },
                    };
                  }
                  return {};
                }}
                components={{
                  toolbar: () => null, // On supprime la toolbar par défaut car on a notre propre navigation
                }}
              />
            )}
          </div>
        </div>
        
        {/* Modal pour les détails d'événement */}
        {selectedEvent && (
          <EventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
      </div>
    </AuthLayout>
  );
}