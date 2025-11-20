import { useState, useEffect } from 'react';
import moment from 'moment';
import { collection, query, getDocs, getDoc, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { toast } from 'sonner';
import {
  CalendarSidebar,
  CalendarTopbar,
  CalendarGrid,
  EventModal,
  AddEventModal,
} from '../components/calendar';
import { CalendarEvent, CalendarView as CalendarViewType } from '../components/calendar/types';

// Types from JobApplicationsPage
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

export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<CalendarViewType>('month');
  const [showApplications, setShowApplications] = useState(true);
  const [showInterviews, setShowInterviews] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justSelectedEvent, setJustSelectedEvent] = useState(false);

  // Fetch applications and interviews from Firestore
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    const fetchApplicationsAndInterviews = async () => {
      try {
        setIsLoading(true);
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        const newEvents: CalendarEvent[] = [];
        
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication;
          
          // Add application date as event
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
              resource: application,
            });
          }
          
          // Add interviews as events
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
                  resource: { ...application, interview },
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

  // Handle drag and drop
  const handleEventDrop = async ({ event, start, end }: any) => {
    if (!currentUser) return;
    
    setIsDragging(false);
    
    const eventEnd = end || new Date(start.getTime() + (event.end.getTime() - event.start.getTime()));
    
    try {
      const eventId = event.id;
      const isApplication = event.type === 'application';
      
      if (isApplication) {
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
              notes: 'Date updated via calendar drag and drop',
            },
          ],
        });

        setEvents((prev) =>
          prev.map((e) =>
          e.id === eventId 
            ? { ...e, start, end: start, resource: { ...e.resource, appliedDate: newDate } }
            : e
          )
        );
        
        toast.success('Application date updated');
      } else {
        const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        let currentApplication: any = null;
        
        applicationsSnapshot.forEach((doc) => {
          if (doc.id === applicationId) {
            currentApplication = { id: doc.id, ...doc.data() };
          }
        });
        
        if (!currentApplication || !currentApplication.interviews) {
          toast.error('Interview not found');
          return;
        }
        
        const interviewIndexNum = parseInt(interviewIndex);
        const interview = currentApplication.interviews[interviewIndexNum];
        
        if (!interview) {
          toast.error('Interview not found');
          return;
        }
        
        const newDate = moment(start).format('YYYY-MM-DD');
        const newTime = moment(start).format('HH:mm');
        
        const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
          idx === interviewIndexNum ? { ...int, date: newDate, time: newTime } : int
        );
        
        await updateDoc(applicationRef, {
          interviews: updatedInterviews,
          updatedAt: serverTimestamp(),
        });
        
        setEvents((prev) =>
          prev.map((e) =>
          e.id === eventId 
              ? {
                  ...e,
                  start,
                  end: eventEnd,
                  resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } },
                }
              : e
          )
        );
        
        toast.success('Interview date updated');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };
  
  const handleEventResize = async ({ event, start, end }: any) => {
    if (!currentUser || event.type === 'application') return;
    
    setIsDragging(false);
    
    try {
      const eventId = event.id;
      const [applicationId, interviewIndex] = eventId.replace('int-', '').split('-');
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      let currentApplication: any = null;
      
      applicationsSnapshot.forEach((doc) => {
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
      
      const newTime = moment(start).format('HH:mm');
      const newDate = moment(start).format('YYYY-MM-DD');
      
      const updatedInterviews = currentApplication.interviews.map((int: Interview, idx: number) => 
        idx === interviewIndexNum ? { ...int, date: newDate, time: newTime } : int
      );
      
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp(),
      });
      
      setEvents((prev) =>
        prev.map((e) =>
        e.id === eventId 
          ? { ...e, start, end, resource: { ...e.resource, interview: { ...interview, date: newDate, time: newTime } } }
          : e
        )
      );
      
      toast.success('Interview duration updated');
    } catch (error) {
      console.error('Error resizing event:', error);
      toast.error('Failed to update interview duration');
    }
  };

  // Filter events
  const filteredEvents = events.filter(
    (event) =>
      (showApplications && event.type === 'application') || (showInterviews && event.type === 'interview')
  );

  // Event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const baseColor = event.color || '#8b5cf6';
    
    return {
      style: {
        backgroundColor: baseColor,
        borderRadius: '8px',
        opacity: isDragging ? 0.5 : 1,
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: 500,
        padding: '0',
        marginBottom: '3px',
        boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'grab',
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
        minHeight: selectedView === 'month' ? '24px' : '32px',
        overflow: 'hidden',
        position: 'relative' as const,
      },
    };
  };

  // Navigation
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

  // Add event handler
  const handleAddEvent = async (eventData: any) => {
    if (!currentUser) return;
    
    try {
      if (eventData.eventType === 'application') {
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
          statusHistory: [
            {
            status: 'applied',
            date: eventData.date,
              notes: 'Application created from calendar',
            },
          ],
        };
        
        const docRef = await addDoc(
          collection(db, 'users', currentUser.uid, 'jobApplications'), 
          applicationData
        );
        
        const newEvent: CalendarEvent = {
          id: `app-${docRef.id}`,
          title: `Applied: ${eventData.companyName} - ${eventData.position}`,
          start: new Date(eventData.date),
          end: new Date(eventData.date),
          allDay: true,
          type: 'application',
          color: '#8b5cf6',
          resource: { id: docRef.id, ...applicationData },
        };
        
        setEvents((prev) => [...prev, newEvent]);
        toast.success('Job application added successfully');
      } else {
        let existingApplication: any = null;
        let applicationId: string;
        
        if (eventData.linkedApplicationId) {
          applicationId = eventData.linkedApplicationId;
          const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
          const applicationDoc = await getDoc(applicationRef);
          if (applicationDoc.exists()) {
            existingApplication = { id: applicationDoc.id, ...applicationDoc.data() };
          }
        } else {
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
          applicationsSnapshot.forEach((doc) => {
          const app = doc.data() as any;
          if (
            app.companyName?.toLowerCase() === eventData.companyName.toLowerCase() &&
            app.position?.toLowerCase() === eventData.position.toLowerCase()
          ) {
            existingApplication = { id: doc.id, ...app };
          }
        });
        
        if (existingApplication) {
          applicationId = existingApplication.id;
        } else {
          const applicationData = {
            companyName: eventData.companyName,
            position: eventData.position,
            location: eventData.location || '',
            status: 'interview',
              appliedDate: eventData.date,
            notes: eventData.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
              statusHistory: [
                {
              status: 'applied',
              date: eventData.date,
                  notes: 'Application created from calendar',
                },
                {
              status: 'interview',
              date: eventData.date,
                  notes: 'Interview scheduled from calendar',
                },
              ],
          };
          
          const docRef = await addDoc(
            collection(db, 'users', currentUser.uid, 'jobApplications'), 
            applicationData
          );
          
          applicationId = docRef.id;
          
          const newApplicationEvent: CalendarEvent = {
            id: `app-${docRef.id}`,
            title: `Applied: ${eventData.companyName} - ${eventData.position}`,
            start: new Date(eventData.date),
            end: new Date(eventData.date),
            allDay: true,
            type: 'application',
              color: '#8b5cf6',
              resource: { id: docRef.id, ...applicationData },
          };
          
            setEvents((prev) => [...prev, newApplicationEvent]);
          }
        }
        
        const interviewData = {
          id: crypto.randomUUID(),
          date: eventData.date,
          time: eventData.interviewTime,
          type: eventData.interviewType,
          status: 'scheduled',
          location: eventData.location || '',
          notes: eventData.notes || '',
          contactName: eventData.contactName || '',
          contactEmail: eventData.contactEmail || '',
        };
        
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
        await updateDoc(applicationRef, {
          interviews: existingApplication?.interviews
            ? [...existingApplication.interviews, interviewData]
            : [interviewData],
          status: 'interview',
          updatedAt: serverTimestamp(),
          statusHistory: existingApplication?.statusHistory
            ? [
                ...existingApplication.statusHistory,
                {
              status: 'interview',
              date: eventData.date,
                  notes: 'Interview added from calendar',
                },
              ]
            : [
                {
              status: 'applied',
              date: eventData.date,
                  notes: 'Application created from calendar',
                },
                {
              status: 'interview',
              date: eventData.date,
                  notes: 'Interview scheduled from calendar',
                },
              ],
        });

        let color = '#6366f1';
        if (eventData.interviewType === 'hr') color = '#ec4899';
        if (eventData.interviewType === 'technical') color = '#14b8a6';
        if (eventData.interviewType === 'manager') color = '#f59e0b';
        if (eventData.interviewType === 'final') color = '#22c55e';

        const interviewDate = new Date(eventData.date);
        const [hours, minutes] = eventData.interviewTime.split(':').map(Number);
        interviewDate.setHours(hours, minutes);
        
        const endDate = new Date(interviewDate);
        endDate.setHours(endDate.getHours() + 1);
        
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
            interview: interviewData,
          },
        };
        
        setEvents((prev) => [...prev, newInterviewEvent]);
        toast.success('Interview added successfully');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
      throw error;
    }
  };

  const handleSlotSelect = (slotInfo: any) => {
    if (isDragging) {
      return;
    }
    
    const clickedEvent = filteredEvents.find((event) => {
      const slotStart = moment(slotInfo.start);
      const slotEnd = moment(slotInfo.end || slotInfo.start);
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      return slotStart.isSameOrBefore(eventEnd) && slotEnd.isSameOrAfter(eventStart);
    });
    
    if (clickedEvent) {
      return;
    }
    
    if (justSelectedEvent) {
      return;
    }
    
    setSelectedSlot(slotInfo.start);
    setShowAddEventModal(true);
  };

  return (
    <AuthLayout small>
      <div className="flex w-full">
        {/* Sidebar */}
        <CalendarSidebar
          selectedView={selectedView}
          onViewChange={setSelectedView}
          onAddEvent={() => {
            setSelectedSlot(new Date());
            setShowAddEventModal(true);
          }}
          onTodayClick={navigateToToday}
          showApplications={showApplications}
          showInterviews={showInterviews}
          onToggleApplications={() => setShowApplications(!showApplications)}
          onToggleInterviews={() => setShowInterviews(!showInterviews)}
        />

        {/* Main Content */}
        <div className="flex-1 min-h-screen py-6 px-8 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto">
            {/* Topbar */}
            <CalendarTopbar
              currentDate={currentDate}
              selectedView={selectedView}
              onPrevious={navigateToPrevious}
              onNext={navigateToNext}
              onToday={navigateToToday}
            />

            {/* Calendar */}
            <div className="mt-6">
            {isLoading ? (
                <div className="h-[calc(100vh-280px)] flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading calendar...</p>
                </div>
              </div>
            ) : (
                <CalendarGrid
                events={filteredEvents}
                  currentDate={currentDate}
                  selectedView={selectedView}
                  onNavigate={setCurrentDate}
                  onView={setSelectedView}
                onSelectEvent={(event: CalendarEvent) => {
                  if (isDragging) {
                    return;
                  }
                  setJustSelectedEvent(true);
                  setSelectedEvent(event);
                  setTimeout(() => {
                    setJustSelectedEvent(false);
                  }, 300);
                }}
                onSelectSlot={handleSlotSelect}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onDragStart={() => {
                  setIsDragging(true);
                    setJustSelectedEvent(false);
                  }}
                  eventStyleGetter={eventStyleGetter}
                  isDragging={isDragging}
              />
            )}
          </div>
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

        {/* Add Event Modal */}
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
      </div>
    </AuthLayout>
  );
}
