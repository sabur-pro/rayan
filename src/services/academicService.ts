import { BaseApiService } from './base';
import {
  UniversityResponse,
  FacultyResponse,
  CourseResponse,
  SemesterResponse,
  SubjectResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  MaterialTypeResponse,
  MaterialResponse,
} from '../types/academic';

class AcademicService extends BaseApiService {
  async getUniversities(
    langCode: string,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<UniversityResponse> {
    return this.makeRequest<UniversityResponse>(
      `/university?page=${page}&limit=${limit}&lang_code=${langCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getFaculties(
    universityId: number,
    langCode: string,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<FacultyResponse> {
    return this.makeRequest<FacultyResponse>(
      `/faculty?page=${page}&limit=${limit}&university_id=${universityId}&lang_code=${langCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getCourses(
    langCode: string,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<CourseResponse> {
    return this.makeRequest<CourseResponse>(
      `/course?page=${page}&limit=${limit}&lang_code=${langCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getSemesters(
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<SemesterResponse> {
    return this.makeRequest<SemesterResponse>(
      `/semester?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getSubjects(
    langCode: string,
    facultyId: number,
    semesterId: number,
    courseId: number,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<SubjectResponse> {
    return this.makeRequest<SubjectResponse>(
      `/subject?lang_code=${langCode}&faculty_id=${facultyId}&semester_id=${semesterId}&course_id=${courseId}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async updateUserAcademicInfo(
    request: UpdateUserRequest,
    accessToken: string
  ): Promise<UpdateUserResponse> {
    return this.makeRequest<UpdateUserResponse>('/user', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  }

  async getMaterialTypes(
    subjectId: number,
    langCode: string,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<MaterialTypeResponse> {
    return this.makeRequest<MaterialTypeResponse>(
      `/material-type?page=${page}&limit=${limit}&lang_code=${langCode}&subject_id=${subjectId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getMaterials(
    courseId: number,
    semesterId: number,
    subjectId: number,
    materialTypeId: number,
    langCode: string,
    page: number = 1,
    limit: number = 10,
    accessToken: string
  ): Promise<MaterialResponse> {
    return this.makeRequest<MaterialResponse>(
      `/material?page=${page}&limit=${limit}&course_id=${courseId}&semester_id=${semesterId}&subject_id=${subjectId}&material_type_id=${materialTypeId}&lang_code=${langCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }
}

export const academicService = new AcademicService();
