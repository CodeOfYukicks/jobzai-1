declare module 'react-big-calendar' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface CalendarProps {
    localizer: any;
    events: any[];
    startAccessor: string | ((event: any) => Date);
    endAccessor: string | ((event: any) => Date);
    style?: React.CSSProperties;
    views?: string[];
    view?: string;
    date?: Date;
    onNavigate?: (date: Date) => void;
    onView?: (view: string) => void;
    eventPropGetter?: (event: any) => { style?: React.CSSProperties, className?: string };
    popup?: boolean;
    tooltipAccessor?: (event: any) => string;
    onSelectEvent?: (event: any) => void;
    selectable?: boolean;
    onSelectSlot?: (slotInfo: any) => void;
    draggableAccessor?: (event: any) => boolean | (() => boolean);
    onEventDrop?: (args: { event: any; start: Date; end: Date }) => void;
    onEventResize?: (args: { event: any; start: Date; end: Date }) => void;
    resizable?: boolean;
    onDragStart?: () => void;
    dayPropGetter?: (date: Date) => { style?: React.CSSProperties, className?: string };
    components?: {
      toolbar?: ComponentType<any>;
      event?: ComponentType<any>;
      [key: string]: any;
    };
  }
  
  export const Calendar: ComponentType<CalendarProps>;
  export const momentLocalizer: (moment: any) => any;
  export type View = string;
} 