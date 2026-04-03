export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  meetingLink?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface ICalendarService {
  createEvent(userId: string, event: CalendarEvent): Promise<CalendarEvent>;
  updateEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(userId: string, eventId: string): Promise<void>;
  getAvailability(userId: string, start: Date, end: Date): Promise<TimeSlot[]>;
}
