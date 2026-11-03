export type TopicStatus = 'not_started' | 'in_progress' | 'completed';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type AssessmentType = 'exam' | 'assignment' | 'quiz' | 'project' | 'presentation';
export type MaterialType = 'textbook' | 'slides' | 'notes' | 'video' | 'practice_problems' | 'past_paper' | 'custom';

export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  estimatedHours: number;
  difficulty: DifficultyLevel;
  notes?: string;
  completedAt?: string;
  associatedMaterials?: string[]; // IDs or names of study materials
}

export interface Unit {
  id: string;
  title: string;
  topics: Topic[];
}

export interface StudyMaterial {
  id: string;
  subjectId: string;
  title: string;
  type: MaterialType;
  scopeOrPages?: string; // e.g. "Pages 40-95" or "Chapters 1-3" or "Lecture 1-8"
  linkOrLocation?: string;
  estimatedHours?: number;
  isCompleted?: boolean;
}

export interface DailyStudyTask {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  topicId?: string;
  topicTitle: string;
  materialTitle?: string;
  action: string; // e.g. "Study topic & read textbook pages 45-68"
  estimatedHours: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface DayPlan {
  dayNumber: number; // 1, 2, 3...
  date: string; // ISO date YYYY-MM-DD
  dateFormatted: string; // "Mon, Nov 3"
  isToday: boolean;
  isPast: boolean;
  isExamDay: boolean;
  isRevisionDay: boolean;
  examTitles?: string[];
  tasks: DailyStudyTask[];
  totalHours: number;
  allCompleted: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string; // e.g. 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'teal'
  targetExamDate: string; // ISO string YYYY-MM-DDTHH:mm or YYYY-MM-DD
  credits?: number;
  notes?: string;
  units: Unit[];
  materials?: StudyMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  subjectId: string;
  title: string;
  type: AssessmentType;
  dueDate: string; // ISO datetime string YYYY-MM-DDTHH:mm
  weightPercentage: number; // e.g. 20 (%)
  isCompleted: boolean;
  completedAt?: string;
  syllabusScope?: string; // e.g. "Units 1-3"
  notes?: string;
  remindersSent?: string[]; // tracks which notification keys e.g. "7d", "1d" have fired
}

export interface NotificationLog {
  id: string;
  assessmentId: string;
  title: string;
  body: string;
  timestamp: string;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  notify7Days: boolean;
  notify3Days: boolean;
  notify1Day: boolean;
  notifyDueDay: boolean;
  morningAlertTime: string; // "08:00"
}
