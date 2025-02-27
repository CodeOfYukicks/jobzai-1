import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { Calendar as CalendarIcon, Briefcase, ArrowRight, Calendar as CalIcon, Check, RefreshCw, Link, Settings } from 'lucide-react';
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

export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [showApplications, setShowApplications] = useState(true);
  const [showInterviews, setShowInterviews] = useState(true);

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
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block'
      }
    };
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
        
        {/* Calendrier */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-[70vh]">
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
              onView={(view) => setSelectedView(view as 'month' | 'week' | 'day')}
              eventPropGetter={eventStyleGetter}
              popup
              tooltipAccessor={(event) => `${event.title}`}
              onSelectEvent={(event) => {
                // Afficher des détails sur l'événement sélectionné
                toast.info(`Selected: ${event.title}`);
              }}
            />
          )}
        </div>
      </div>
    </AuthLayout>
  );
}