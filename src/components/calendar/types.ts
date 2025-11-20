// Calendar-specific type definitions

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  type: 'interview' | 'application';
  color?: string;
}

export interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

export interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
}

export type CalendarView = 'month' | 'week' | 'day';

