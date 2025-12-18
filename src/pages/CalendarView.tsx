import { useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment';
import { collection, query, getDocs, getDoc, addDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { notify } from '@/lib/notify';
import {
  CalendarTopbar,
  CalendarGrid,
  EventModal,
  AddEventModal,
  UpcomingEventsPanel,
} from '../components/calendar';
import { CalendarEvent, CalendarView as CalendarViewType } from '../components/calendar/types';
import { KanbanBoard, BoardType } from '../types/job';
import { useGoogleCalendar, GoogleCalendarEvent } from '../hooks/useGoogleCalendar';

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
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived' | 'wishlist';
  date: string;
  notes?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'archived' | 'wishlist';
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
  const [showWishlists, setShowWishlists] = useState(true);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justSelectedEvent, setJustSelectedEvent] = useState(false);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | undefined>(undefined);
  const [currentBoardType, setCurrentBoardType] = useState<BoardType>('jobs');
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Google Calendar hook
  const {
    isConnected: isGoogleConnected,
    isLoading: isGoogleLoading,
    email: googleEmail,
    error: googleError,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    fetchEvents: fetchGoogleEvents,
    createEvent: createGoogleEvent,
  } = useGoogleCalendar();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  // Fetch boards from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchBoards = async () => {
      try {
        const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
        const boardsSnapshot = await getDocs(query(boardsRef, orderBy('createdAt', 'asc')));
        const boardsData: KanbanBoard[] = [];
        boardsSnapshot.forEach((doc) => {
          boardsData.push({ id: doc.id, ...doc.data() } as KanbanBoard);
        });
        setBoards(boardsData);
        
        // Set default board as current
        const defaultBoard = boardsData.find(b => b.isDefault);
        if (defaultBoard) {
          setCurrentBoardId(defaultBoard.id);
          setCurrentBoardType(defaultBoard.boardType || 'jobs');
        } else if (boardsData.length > 0) {
          setCurrentBoardId(boardsData[0].id);
          setCurrentBoardType(boardsData[0].boardType || 'jobs');
        }
      } catch (error) {
        console.error('Error fetching boards:', error);
      }
    };
    
    fetchBoards();
  }, [currentUser]);

  // Fetch applications and interviews from Firestore
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    const fetchApplicationsAndInterviews = async () => {
      try {
        setIsLoading(true);
        
        // Fetch boards first to map board info
        const boardsRef = collection(db, 'users', currentUser.uid, 'boards');
        const boardsSnapshot = await getDocs(query(boardsRef, orderBy('createdAt', 'asc')));
        const boardsMap = new Map<string, KanbanBoard>();
        let defaultBoard: KanbanBoard | null = null;
        
        boardsSnapshot.forEach((doc) => {
          const board = { id: doc.id, ...doc.data() } as KanbanBoard;
          boardsMap.set(board.id, board);
          if (board.isDefault) {
            defaultBoard = board;
          }
        });
        
        // Fetch applications
        const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
        const applicationsSnapshot = await getDocs(query(applicationsRef));
        
        const newEvents: CalendarEvent[] = [];
        
        applicationsSnapshot.forEach((doc) => {
          const application = { id: doc.id, ...doc.data() } as JobApplication & { boardId?: string };
          
          // Get board info for this application
          const boardId = application.boardId;
          const board = boardId ? boardsMap.get(boardId) : defaultBoard;
          const boardInfo = board ? {
            boardId: board.id,
            boardName: board.name,
            boardIcon: board.icon,
            boardColor: board.color,
            boardType: board.boardType || 'jobs',
          } : null;
          
          // Add application/wishlist date as event
          if (application.appliedDate) {
            const appliedDate = new Date(application.appliedDate);
            const isWishlist = application.status === 'wishlist';
            newEvents.push({
              id: `app-${application.id}`,
              title: isWishlist 
                ? `Wishlist: ${application.companyName} - ${application.position}`
                : `Applied: ${application.companyName} - ${application.position}`,
              start: appliedDate,
              end: appliedDate,
              allDay: true,
              type: isWishlist ? 'wishlist' : 'application',
              color: isWishlist ? '#ec4899' : '#8b5cf6',
              resource: { ...application, ...boardInfo },
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
                  resource: { ...application, interview, ...boardInfo },
                });
              }
            });
          }
        });
        
        setEvents(newEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        notify.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicationsAndInterviews();
  }, [currentUser]);

  // Fetch Google Calendar events when connected and date changes
  const loadGoogleEvents = useCallback(async () => {
    if (!isGoogleConnected) {
      setGoogleEvents([]);
      return;
    }

    try {
      // Calculate date range based on current view
      let startDate: Date;
      let endDate: Date;

      if (selectedView === 'month') {
        startDate = moment(currentDate).startOf('month').subtract(1, 'week').toDate();
        endDate = moment(currentDate).endOf('month').add(1, 'week').toDate();
      } else if (selectedView === 'week') {
        startDate = moment(currentDate).startOf('week').toDate();
        endDate = moment(currentDate).endOf('week').toDate();
      } else {
        startDate = moment(currentDate).startOf('day').toDate();
        endDate = moment(currentDate).endOf('day').toDate();
      }

      const gEvents = await fetchGoogleEvents(startDate, endDate);
      
      // Convert Google events to CalendarEvent format
      const convertedEvents: CalendarEvent[] = gEvents.map((gEvent: GoogleCalendarEvent) => ({
        id: `google-${gEvent.id}`,
        title: gEvent.summary,
        start: gEvent.start,
        end: gEvent.end,
        allDay: gEvent.allDay,
        type: 'google' as const,
        color: '#4285F4', // Google blue
        resource: {
          googleEventId: gEvent.id,
          description: gEvent.description,
          location: gEvent.location,
          htmlLink: gEvent.htmlLink,
          isGoogleEvent: true,
        },
      }));

      setGoogleEvents(convertedEvents);
    } catch (error) {
      console.error('Error fetching Google events:', error);
    }
  }, [isGoogleConnected, currentDate, selectedView, fetchGoogleEvents]);

  useEffect(() => {
    loadGoogleEvents();
  }, [loadGoogleEvents]);

  // Handle drag and drop
  const handleEventDrop = async ({ event, start, end }: any) => {
    if (!currentUser) return;
    
    // Clear timeout and reset dragging state
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    setIsDragging(false);
    
    const eventEnd = end || new Date(start.getTime() + (event.end.getTime() - event.start.getTime()));
    
    try {
      const eventId = event.id;
      const isApplicationOrWishlist = event.type === 'application' || event.type === 'wishlist';
      
      if (isApplicationOrWishlist) {
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
        
        notify.success('Application date updated');
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
          notify.error('Interview not found');
          return;
        }
        
        const interviewIndexNum = parseInt(interviewIndex);
        const interview = currentApplication.interviews[interviewIndexNum];
        
        if (!interview) {
          notify.error('Interview not found');
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
        
        notify.success('Interview date updated');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      notify.error('Failed to update event');
    }
  };
  
  const handleEventResize = async ({ event, start, end }: any) => {
    if (!currentUser || event.type === 'application' || event.type === 'wishlist') return;
    
    // Clear timeout and reset dragging state
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
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
      
      notify.success('Interview duration updated');
    } catch (error) {
      console.error('Error resizing event:', error);
      notify.error('Failed to update interview duration');
    }
  };

  // Filter events
  // Merge local events with Google events
  const allEvents = [...events, ...googleEvents];
  
  const filteredEvents = allEvents.filter(
    (event) =>
      (showApplications && event.type === 'application') || 
      (showInterviews && event.type === 'interview') ||
      (showWishlists && event.type === 'wishlist') ||
      (showGoogleEvents && event.type === 'google')
  );

  // Event style getter - Minimal styling, EventPill handles the rest
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '0',
        margin: '0',
        boxShadow: 'none',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.12s ease-out',
        minHeight: selectedView === 'month' ? '22px' : '36px',
        overflow: 'visible',
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
        // Determine if this is a campaigns board
        const isCampaign = eventData.boardType === 'campaigns' || currentBoardType === 'campaigns';
        const defaultStatus = isCampaign ? 'targets' : 'applied';
        
        // For campaigns, use contactRole as position if position is empty
        const effectivePosition = isCampaign 
          ? (eventData.position || eventData.contactRole || 'Outreach')
          : eventData.position;
        
        const applicationData: any = {
          companyName: eventData.companyName,
          position: effectivePosition,
          location: eventData.location || '',
          status: defaultStatus,
          appliedDate: eventData.date || eventData.appliedDate,
          url: eventData.url || '',
          description: eventData.description || '',
          fullJobDescription: eventData.fullJobDescription || '',
          notes: eventData.notes || '',
          salary: eventData.salary || '',
          contactName: eventData.contactName || '',
          contactEmail: eventData.contactEmail || '',
          contactPhone: eventData.contactPhone || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          generatedEmails: [],
          stickyNotes: [],
          // Include jobInsights and jobTags if extracted by AI
          ...(eventData.jobInsights && { jobInsights: eventData.jobInsights }),
          ...(eventData.jobTags && { jobTags: eventData.jobTags }),
          // Campaign-specific fields
          ...(isCampaign && {
            contactRole: eventData.contactRole || '',
            contactLinkedIn: eventData.contactLinkedIn || '',
            outreachChannel: eventData.outreachChannel || 'email',
            messageSent: eventData.messageSent || '',
            relationshipGoal: eventData.relationshipGoal || 'networking',
            warmthLevel: eventData.warmthLevel || 'cold',
            lastContactedAt: eventData.date || eventData.appliedDate || new Date().toISOString().split('T')[0],
            conversationHistory: [],
            meetings: [],
          }),
          // Associate with current board
          ...(eventData.boardId && { boardId: eventData.boardId }),
          ...(currentBoardId && !eventData.boardId && { boardId: currentBoardId }),
          statusHistory: [
            {
              status: defaultStatus,
              date: eventData.date || eventData.appliedDate,
              notes: isCampaign ? 'Outreach created from calendar' : 'Application created from calendar',
            },
          ],
        };
        
        const docRef = await addDoc(
          collection(db, 'users', currentUser.uid, 'jobApplications'), 
          applicationData
        );
        
        const isWishlist = applicationData.status === 'wishlist';
        const newEvent: CalendarEvent = {
          id: `app-${docRef.id}`,
          title: isWishlist 
            ? `Wishlist: ${eventData.companyName} - ${effectivePosition}`
            : isCampaign 
              ? `Outreach: ${eventData.contactName || eventData.companyName}`
              : `Applied: ${eventData.companyName} - ${effectivePosition}`,
          start: new Date(eventData.date || eventData.appliedDate),
          end: new Date(eventData.date || eventData.appliedDate),
          allDay: true,
          type: isWishlist ? 'wishlist' : 'application',
          color: isWishlist ? '#ec4899' : isCampaign ? '#8B5CF6' : '#8b5cf6',
          resource: { id: docRef.id, ...applicationData },
        };
        
        setEvents((prev) => [...prev, newEvent]);
        notify.success(isCampaign ? 'Outreach added successfully' : 'Job application added successfully');
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
        
        // Sync interview to Google Calendar if connected
        if (isGoogleConnected) {
          try {
            const interviewTitle = `${eventData.interviewType.charAt(0).toUpperCase() + eventData.interviewType.slice(1)} Interview - ${eventData.companyName}`;
            const description = `Position: ${eventData.position}\n${eventData.notes ? `Notes: ${eventData.notes}` : ''}`;
            
            await createGoogleEvent({
              summary: interviewTitle,
              description,
              start: interviewDate,
              end: endDate,
              location: eventData.location,
            });
            
            notify.success('Interview added and synced to Google Calendar');
          } catch (googleError) {
            console.error('Failed to sync to Google Calendar:', googleError);
            notify.success('Interview added (Google Calendar sync failed)');
          }
        } else {
          notify.success('Interview added successfully');
        }
      }
    } catch (error) {
      console.error('Error adding event:', error);
      notify.error('Failed to add event');
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

  const handleOpenAddEvent = () => {
    setSelectedSlot(new Date());
    setShowAddEventModal(true);
  };

  const handleSelectEventFromPanel = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  return (
    <AuthLayout small>
      <div className="flex w-full min-h-0 flex-1 overflow-hidden">
        {/* Main Content - Calendar */}
        <div className="flex-1 min-h-0 overflow-y-auto py-6 px-6 lg:px-8">
          <div className="w-full max-w-5xl mx-auto">
            {/* Topbar */}
            <CalendarTopbar
              currentDate={currentDate}
              selectedView={selectedView}
              onPrevious={navigateToPrevious}
              onNext={navigateToNext}
              onToday={navigateToToday}
              onViewChange={setSelectedView}
              onAddEvent={handleOpenAddEvent}
              showApplications={showApplications}
              showInterviews={showInterviews}
              showWishlists={showWishlists}
              onToggleApplications={() => setShowApplications(!showApplications)}
              onToggleInterviews={() => setShowInterviews(!showInterviews)}
              onToggleWishlists={() => setShowWishlists(!showWishlists)}
              googleCalendar={{
                isConnected: isGoogleConnected,
                isLoading: isGoogleLoading,
                email: googleEmail,
                onConnect: connectGoogle,
                onDisconnect: disconnectGoogle,
                showGoogleEvents,
                onToggleGoogleEvents: () => setShowGoogleEvents(!showGoogleEvents),
              }}
            />

            {/* Calendar */}
            <div className="mt-6">
              {isLoading ? (
                <div className="h-[calc(100vh-280px)] flex items-center justify-center bg-white dark:bg-[#242325] rounded-xl border border-gray-200 dark:border-[#3d3c3e]">
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
                    // Check if this is a quick click (not a drag)
                    const timeSinceDragStart = Date.now() - dragStartTimeRef.current;

                    // If drag was started less than 150ms ago, or no drag is happening, open modal
                    if (timeSinceDragStart < 150 || !isDragging) {
                      // Cancel any pending drag timeout
                      if (dragTimeoutRef.current) {
                        clearTimeout(dragTimeoutRef.current);
                        dragTimeoutRef.current = null;
                      }
                      setIsDragging(false);
                      setJustSelectedEvent(true);
                      setSelectedEvent(event);
                      setTimeout(() => {
                        setJustSelectedEvent(false);
                      }, 300);
                    }
                  }}
                  onSelectSlot={handleSlotSelect}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                  onDragStart={() => {
                    // Record when drag started
                    dragStartTimeRef.current = Date.now();
                    setJustSelectedEvent(false);

                    // Only set isDragging to true after 150ms (real drag, not a click)
                    if (dragTimeoutRef.current) {
                      clearTimeout(dragTimeoutRef.current);
                    }
                    dragTimeoutRef.current = setTimeout(() => {
                      setIsDragging(true);
                    }, 150);
                  }}
                  eventStyleGetter={eventStyleGetter}
                  isDragging={isDragging}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Upcoming Events (Premium) */}
        <div className="hidden xl:block w-[380px] flex-shrink-0 h-full">
          <UpcomingEventsPanel
            events={filteredEvents}
            onSelectEvent={handleSelectEventFromPanel}
            onAddEvent={handleOpenAddEvent}
          />
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
            boards={boards}
            currentBoardId={currentBoardId}
            currentBoardType={currentBoardType}
          />
        )}
      </div>
    </AuthLayout>
  );
}
