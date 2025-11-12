export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

// New types for extended user profile
export interface Translation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface Course {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: number;
  created_at: string;
  updated_at: string;
  translations: Translation[] | null;
}

export interface Subject {
  subject_id: number;
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface Faculty {
  id: number;
  university_id: number;
  subjects: Subject[] | null;
  created_at: string;
  updated_at: string;
  translations: Translation[] | null;
}

export interface ExtendedUserProfile {
  id: number;
  login: string;
  role: string;
  lang_code: string;
  created_at: string;
  updated_at: string;
  course: Course;
  semester: Semester;
  university: University;
  faculty: Faculty;
}

export interface JWTPayload {
  session_id: string;
  user_id: number;
  phone: string;
  role: string;
  iss: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
}