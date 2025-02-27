import { gapi } from 'gapi-script';

export const addEventToGoogleCalendar = async (event: {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}) => {
  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    return response.result;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};

export const formatInterviewForGoogleCalendar = (interview: any) => {
  return {
    summary: `Interview: ${interview.type} at ${interview.companyName}`,
    description: `Interview for position: ${interview.position}\nNotes: ${interview.notes || ''}`,
    start: {
      dateTime: new Date(interview.date + 'T' + interview.time).toISOString(),
    },
    end: {
      dateTime: new Date(
        new Date(interview.date + 'T' + interview.time).getTime() + 60 * 60 * 1000
      ).toISOString(), // +1 heure par défaut
    },
  };
}; 