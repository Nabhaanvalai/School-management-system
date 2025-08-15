export interface Timetable {
  _id: string;
  classId: string;
  academicYear: string;
  schedule: DaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  periods: Period[];
}

export interface Period {
  slot: string; // A1, B1, C1, etc.
  subject: string;
  teacherId: string;
  teacherName?: string;
  startTime: string;
  endTime: string;
}

export interface CreateTimetableData {
  classId: string;
  academicYear: string;
  schedule: DaySchedule[];
}

export interface UpdateTimetableData extends Partial<CreateTimetableData> {}

export interface TimetableFilters {
  standard?: string;
  section?: string;
  academicYear?: string;
  teacherId?: string;
}

export interface ClassInfo {
  _id: string;
  standard: string;
  section: string;
  name: string;
}

export interface TimeSlot {
  slot: string;
  startTime: string;
  endTime: string;
}

export interface TeacherOption {
  _id: string;
  name: string;
  subjects: string[];
}

export interface DragDropItem {
  type: 'period';
  period: Period;
  day: string;
  slotIndex: number;
}