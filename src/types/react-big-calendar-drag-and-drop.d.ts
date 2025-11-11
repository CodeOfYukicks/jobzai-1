declare module 'react-big-calendar/lib/addons/dragAndDrop' {
  import { ComponentType } from 'react';
  import { CalendarProps } from 'react-big-calendar';
  
  export default function withDragAndDrop(Calendar: ComponentType<CalendarProps>): ComponentType<CalendarProps>;
}





