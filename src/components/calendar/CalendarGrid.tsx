import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './calendar-premium.css';
import { GripVertical } from 'lucide-react';
import { CalendarEvent, CalendarView } from './types';
import { EventPill } from './EventPill';

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

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
  return (
    <div className="calendar-premium-container">
      <div className="h-[calc(100vh-160px)] min-h-[650px]">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          view={selectedView}
          date={currentDate}
          onNavigate={onNavigate}
          onView={onView}
          eventPropGetter={eventStyleGetter}
          popup
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

            if (isToday) {
              return {
                className: 'rbc-today',
                style: {
                  background:
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                  borderLeft: '2px solid #3b82f6',
                },
              };
            }

            if (isWeekend) {
              return {
                style: {
                  backgroundColor: 'rgba(249, 250, 251, 0.5)',
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

