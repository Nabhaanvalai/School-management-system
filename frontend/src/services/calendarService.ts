import axios from 'axios';

export interface AcademicEvent {
  _id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'holiday' | 'exam' | 'event' | 'sports' | 'cultural' | 'academic';
  isMultiDay: boolean;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'holiday' | 'exam' | 'event' | 'sports' | 'cultural' | 'academic';
  academicYear: string;
}

export interface CalendarFilters {
  month?: number;
  year?: number;
  type?: string;
  academicYear?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const calendarAPI = axios.create({
  baseURL: `${API_BASE_URL}/calendar`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
calendarAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const calendarService = {
  async getEvents(filters?: CalendarFilters): Promise<AcademicEvent[]> {
    const params = new URLSearchParams();
    
    if (filters?.month !== undefined) params.append('month', filters.month.toString());
    if (filters?.year !== undefined) params.append('year', filters.year.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.academicYear) params.append('academicYear', filters.academicYear);
    
    const response = await calendarAPI.get(`/?${params.toString()}`);
    return response.data.map((event: any) => ({
      ...event,
      date: new Date(event.date),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    }));
  },

  async getEventById(id: string): Promise<AcademicEvent> {
    const response = await calendarAPI.get(`/${id}`);
    const event = response.data;
    return {
      ...event,
      date: new Date(event.date),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    };
  },

  async createEvent(eventData: CreateEventData): Promise<AcademicEvent> {
    const response = await calendarAPI.post('/', eventData);
    const event = response.data;
    return {
      ...event,
      date: new Date(event.date),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    };
  },

  async updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<AcademicEvent> {
    const response = await calendarAPI.put(`/${id}`, eventData);
    const event = response.data;
    return {
      ...event,
      date: new Date(event.date),
      endDate: event.endDate ? new Date(event.endDate) : undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    };
  },

  async deleteEvent(id: string): Promise<void> {
    await calendarAPI.delete(`/${id}`);
  }
};