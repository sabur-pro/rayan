// Types for academic data structures

export interface UniversityTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface UniversityItem {
  university_id: number;
  name: string;
  description: string;
  status: string;
}

export interface UniversityResponse {
  data: UniversityItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface FacultyTranslation {
  faculty_id: number;
  name: string;
  description: string;
  status: string;
}

export interface FacultyItem {
  id: number;
  university_id: number;
  created_at: string;
  updated_at: string;
  translations: FacultyTranslation[];
}

export interface FacultyResponse {
  data: FacultyItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface CourseTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface CourseItem {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
  translations: CourseTranslation[];
}

export interface CourseResponse {
  data: CourseItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface SemesterItem {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Number: number;
}

export interface SemesterResponse {
  data: SemesterItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface SubjectTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface MaterialTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
  paths?: string[];
}

export interface Material {
  id: number;
  course_id: number;
  semester_id: number;
  created_at: string;
  updated_at: string;
  material_translation: MaterialTranslation[];
}

export interface SubjectFacultyTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface SubjectFaculty {
  id: number;
  university_id: number;
  created_at: string;
  updated_at: string;
  faculty_translations: SubjectFacultyTranslation[];
}

export interface SubjectCourse {
  id: number;
  number: number;
  degree_id: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectSemester {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectItem {
  id: number;
  semester_id: number;
  course_id: number;
  semester: SubjectSemester;
  course: SubjectCourse;
  created_at: string;
  updated_at: string;
  translations: SubjectTranslation[];
  faculties: SubjectFaculty[];
  materials: Material[];
}

export interface SubjectResponse {
  data: SubjectItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface UpdateUserRequest {
  course_id: number;
  faculty_id: number;
  login: string;
  semester_id: number;
  university_id: number;
}

export interface UpdateUserResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MaterialTypeItem {
  material_type_id: number;
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface MaterialTypeResponse {
  data: MaterialTypeItem[];
  page: number;
  limit: number;
  total_count: number;
}

export interface MaterialDetailTranslation {
  lang_code: string;
  name: string;
  description: string;
  paths?: string[];
  status: string;
}

export interface MaterialDetailType {
  id: number;
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface MaterialDetailCourse {
  id: number;
  number: number;
  degree: {
    id: number;
  };
}

export interface MaterialDetailSemester {
  id: number;
  number: number;
}

export interface MaterialDetailSubjectTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

export interface MaterialDetailSubject {
  id: number;
  translations: MaterialDetailSubjectTranslation[];
}

export interface MaterialDetail {
  id: number;
  course: MaterialDetailCourse;
  semester: MaterialDetailSemester;
  material_type: MaterialDetailType;
  created_at: string;
  updated_at: string;
  translations: MaterialDetailTranslation[];
  subjects: MaterialDetailSubject[];
}

export interface MaterialResponse {
  data: MaterialDetail[];
  page: number;
  limit: number;
  total_count: number;
}
