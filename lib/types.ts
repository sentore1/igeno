// User Roles
export type UserRole = 
  | 'admin' 
  | 'trainer' 
  | 'student' 
  | 'caregiver' 
  | 'nurse' 
  | 'consultant' 
  | 'client';

// Division A - Care Management Types
export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
  notes?: string;
  created_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  availability: string[];
  rating?: number;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  caregiver_id?: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

// Division B - LMS Types
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor_id: string;
  thumbnail?: string;
  duration_hours: number;
  is_published: boolean;
  youtube_url?: string;
  prerequisites?: string;
  learning_outcomes?: string[];
  created_at: string;
}

export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  resource_type: 'pdf' | 'video' | 'link' | 'document' | 'other';
  resource_url: string;
  file_size?: number;
  is_downloadable: boolean;
  order_index: number;
  created_at: string;
}

export interface CourseQuiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url?: string;
  order: number;
  duration_minutes: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  completed_at?: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  passing_score: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string;
}

// Shared Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}
