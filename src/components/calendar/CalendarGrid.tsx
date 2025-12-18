import { useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-premium.css';
import { CalendarEvent, CalendarView } from './types';
import { EventPill } from './EventPill';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

// Max events to show before collapsing with "show more"
const MAX_EVENTS_MONTH = 3;
const MAX_ALLDAY_EVENTS_WEEK = 3;
const MAX_ALLDAY_EVENTS_DAY = 4;

interface CalendarGridProps {
  events: CalendarEvent[];
  currentDate: Date;
  selectedView: CalendarView;
  onNavigate: (date: Date) => void;
  onView: (view: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: any) => void;
  onEventDrop: (args: any) => void;
  onEventResize: (args: any) => void;
  onDragStart: () => void;
  eventStyleGetter: (event: CalendarEvent) => any;
  isDragging: boolean;
}

export const CalendarGrid = ({
  events,
  currentDate,
  selectedView,
  onNavigate,
  onView,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  onDragStart,
  eventStyleGetter,
  isDragging,
}: CalendarGridProps) => {
  // Filter events to limit events per day with "show more" hover
  const filteredEvents = useMemo(() => {
    // For month view: limit all events per day
    if (selectedView === 'month') {
      // Group all events by date
      const eventsByDate = new Map<string, CalendarEvent[]>();
      events.forEach(event => {
        const dateKey = moment(event.start).format('YYYY-MM-DD');
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
      });
      
      // Limit events per day
      const limitedEvents: CalendarEvent[] = [];
      eventsByDate.forEach((dayEvents, dateKey) => {
        if (dayEvents.length <= MAX_EVENTS_MONTH) {
          limitedEvents.push(...dayEvents);
        } else {
          // Take only the first N-1 events
          const visibleEvents = dayEvents.slice(0, MAX_EVENTS_MONTH - 1);
          limitedEvents.push(...visibleEvents);
          
          // Create a "show more" placeholder event
          // Set time to end of day (23:59:59) to ensure it appears last when sorted
          const hiddenCount = dayEvents.length - visibleEvents.length;
          const showMoreDate = new Date(dateKey);
          showMoreDate.setHours(23, 59, 59, 999);
          const showMoreEvent: CalendarEvent = {
            id: `show-more-${dateKey}`,
            title: `~${hiddenCount} more`, // ~ sorts after letters
            start: showMoreDate,
            end: showMoreDate,
            allDay: true,
            type: 'application',
            resource: {
              isShowMore: true,
              hiddenEvents: dayEvents.slice(MAX_EVENTS_MONTH - 1),
              hiddenCount,
            },
          };
          limitedEvents.push(showMoreEvent);
        }
      });
      
      return limitedEvents;
    }

    // For week/day views: only limit all-day events
    const maxAllDay = selectedView === 'week' ? MAX_ALLDAY_EVENTS_WEEK : MAX_ALLDAY_EVENTS_DAY;
    
    // Separate all-day events (applications, wishlists, campaigns) from timed events (interviews)
    const allDayEvents = events.filter(e => e.allDay === true);
    const timedEvents = events.filter(e => e.allDay !== true);
    
    // Group all-day events by date
    const allDayByDate = new Map<string, CalendarEvent[]>();
    allDayEvents.forEach(event => {
      const dateKey = moment(event.start).format('YYYY-MM-DD');
      if (!allDayByDate.has(dateKey)) {
        allDayByDate.set(dateKey, []);
      }
      allDayByDate.get(dateKey)!.push(event);
    });
    
    // Limit all-day events per day
    const limitedAllDayEvents: CalendarEvent[] = [];
    allDayByDate.forEach((dayEvents, dateKey) => {
      if (dayEvents.length <= maxAllDay) {
        limitedAllDayEvents.push(...dayEvents);
      } else {
        // Take only the first N events
        const visibleEvents = dayEvents.slice(0, maxAllDay - 1);
        limitedAllDayEvents.push(...visibleEvents);
        
        // Create a "show more" placeholder event
        // Set time to end of day (23:59:59) to ensure it appears last when sorted
        const hiddenCount = dayEvents.length - visibleEvents.length;
        const showMoreDate = new Date(dateKey);
        showMoreDate.setHours(23, 59, 59, 999);
        const showMoreEvent: CalendarEvent = {
          id: `show-more-${dateKey}`,
          title: `~${hiddenCount} more`, // ~ sorts after letters
          start: showMoreDate,
          end: showMoreDate,
          allDay: true,
          type: 'application',
          resource: {
            isShowMore: true,
            hiddenEvents: dayEvents.slice(maxAllDay - 1),
            hiddenCount,
          },
        };
        limitedAllDayEvents.push(showMoreEvent);
      }
    });
    
    return [...limitedAllDayEvents, ...timedEvents];
  }, [events, selectedView]);

  return (
    <div className="calendar-premium-container">
      <div className="h-[calc(100vh-160px)] min-h-[650px]">
        <DragAndDropCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          view={selectedView}
          date={currentDate}
          onNavigate={onNavigate}
          onView={onView}
          eventPropGetter={eventStyleGetter}
          tooltipAccessor={(event: CalendarEvent) => `${event.title}`}
          onSelectEvent={(event: CalendarEvent) => {
            if (!isDragging) {
              onSelectEvent(event);
            }
          }}
          selectable={true}
          onSelectSlot={onSelectSlot}
          draggableAccessor={() => true}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          resizable
          onDragStart={onDragStart}
          dayPropGetter={(date: Date) => {
            const today = new Date();
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Check if dark mode is active
            const isDarkMode = document.documentElement.classList.contains('dark');

            if (isToday) {
              return {
                className: 'rbc-today',
                style: {
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  borderLeft: isDarkMode ? '2px solid #a855f7' : '2px solid #3b82f6',
                },
              };
            }

            if (isWeekend) {
              return {
                style: {
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.015)' 
                    : 'rgba(0, 0, 0, 0.02)',
                },
              };
            }

            return {};
          }}
          components={{
            toolbar: () => null, // We handle toolbar separately
            event: ({ event }: any) => (
              <div className="rbc-event-content h-full p-0">
                <EventPill event={event} variant={selectedView} />
              </div>
            ),
            month: {
              event: ({ event }: any) => (
                <div className="rbc-event-content p-0">
                  <EventPill event={event} variant="month" />
                </div>
              ),
            },
            week: {
              event: ({ event }: any) => (
                <div className="rbc-event-content h-full p-0">
                  <EventPill event={event} variant="week" />
                </div>
              ),
            },
            day: {
              event: ({ event }: any) => (
                <div className="rbc-event-content h-full p-0">
                  <EventPill event={event} variant="day" />
                </div>
              ),
            },
          }}
        />
      </div>
    </div>
  );
};

