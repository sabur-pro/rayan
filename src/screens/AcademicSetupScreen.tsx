import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { academicService } from '../services/academicService';
import {
  UniversityItem,
  FacultyItem,
  CourseItem,
  SemesterItem,
} from '../types/academic';

type Step = 'university' | 'faculty' | 'course' | 'semester';

interface AcademicSetupScreenProps {
  userLogin: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const AcademicSetupScreen: React.FC<AcademicSetupScreenProps> = ({
  userLogin,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken, login } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [currentStep, setCurrentStep] = useState<Step>('university');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<SemesterItem | null>(null);

  useEffect(() => {
    if (currentStep === 'university') {
      loadUniversities();
    }
  }, [currentStep]);

  const getLangCodeForAPI = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      en: 'en',
      ru: 'ru',
      tj: 'tj',
      kk: 'kz',
      uz: 'uz',
      ky: 'kg',
    };
    return langMap[lang] || lang;
  };

  const loadUniversities = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getUniversities(apiLangCode, 1, 50, accessToken);
      setUniversities(response.data);
    } catch (error) {
      console.error('Error loading universities:', error);
      showToast.error('Failed to load universities', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async (universityId: number) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getFaculties(universityId, apiLangCode, 1, 50, accessToken);
      setFaculties(response.data);
    } catch (error) {
      console.error('Error loading faculties:', error);
      showToast.error('Failed to load faculties', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (limit?: number) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getCourses(apiLangCode, 1, limit || 50, accessToken);
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      showToast.error('Failed to load courses', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadSemesters = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await academicService.getSemesters(1, 50, accessToken);
      setSemesters(response.data);
    } catch (error) {
      console.error('Error loading semesters:', error);
      showToast.error('Failed to load semesters', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUniversitySelect = async (university: UniversityItem) => {
    setSelectedUniversity(university);
    
    // Clear faculties and courses when university changes
    setFaculties([]);
    setCourses([]);
    
    setCurrentStep('faculty');
    await loadFaculties(university.university_id);
  };

  const handleFacultySelect = async (faculty: FacultyItem) => {
    setSelectedFaculty(faculty);
    
    // Clear courses list when faculty changes
    setCourses([]);
    
    setCurrentStep('course');
    
    // Apply course limit logic for university ID=1
    let courseLimit = 50; // Default limit
    if (selectedUniversity?.university_id === 1) {
      console.log('[AcademicSetupScreen] University ID:', selectedUniversity.university_id, 'Faculty ID:', faculty.id);
      // Faculty 1, 2 → limit 6
      // Faculty 3, 4, 5 → limit 5
      if (faculty.id === 1 || faculty.id === 2) {
        courseLimit = 6;
        console.log('[AcademicSetupScreen] Faculty 1 or 2 detected, setting course limit to 6');
      } else if (faculty.id === 3 || faculty.id === 4 || faculty.id === 5) {
        courseLimit = 5;
        console.log('[AcademicSetupScreen] Faculty 3, 4 or 5 detected, setting course limit to 5');
      }
    }
    
    console.log('[AcademicSetupScreen] Loading courses with limit:', courseLimit);
    await loadCourses(courseLimit);
  };

  const handleCourseSelect = async (course: CourseItem) => {
    setSelectedCourse(course);
    
    // Auto-select semester for courses > 3
    if (course.number > 3) {
      await loadSemesters();
      // Find semester with ID=1
      const targetSemester = semesters.find(s => s.ID === 1);
      if (targetSemester) {
        showToast.info(
          'Цикл все материалы у них в первом семестре / All materials for this course are in the first semester',
          t('common.info') || 'Information'
        );
        // Auto-select semester after showing toast
        setTimeout(() => handleSemesterSelect(targetSemester), 1500);
      } else {
        // If semester 1 not found, continue to semester selection
        setCurrentStep('semester');
      }
    } else {
      setCurrentStep('semester');
      await loadSemesters();
    }
  };

  const handleSemesterSelect = async (semester: SemesterItem) => {
    setSelectedSemester(semester);
    await submitAcademicInfo(semester);
  };

  const submitAcademicInfo = async (semester: SemesterItem) => {
    if (!accessToken || !selectedUniversity || !selectedFaculty || !selectedCourse) return;

    try {
      setSubmitting(true);
      const response = await academicService.updateUserAcademicInfo(
        {
          course_id: selectedCourse.id,
          faculty_id: selectedFaculty.id,
          login: userLogin,
          semester_id: semester.ID,
          university_id: selectedUniversity.university_id,
        },
        accessToken
      );

      // Update tokens
      await login(response);

      showToast.success(
        'Academic information saved successfully',
        t('common.success')
      );
      // Complete after showing toast
      setTimeout(() => onComplete(), 1000);
    } catch (error) {
      console.error('Error saving academic info:', error);
      showToast.error('Failed to save academic information', t('common.error'));
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'university') {
      onCancel();
    } else if (currentStep === 'faculty') {
      setCurrentStep('university');
      setSelectedFaculty(null);
    } else if (currentStep === 'course') {
      setCurrentStep('faculty');
      setSelectedCourse(null);
    } else if (currentStep === 'semester') {
      setCurrentStep('course');
      setSelectedSemester(null);
    }
  };

  const getTranslatedName = (faculty: FacultyItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = faculty.translations.find(t => t.faculty_id === faculty.id);
    return translation?.name || faculty.translations[0]?.name || 'Unknown';
  };

  const getCourseTranslatedName = (course: CourseItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = course.translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || course.translations[0]?.name || `Course ${course.number}`;
  };

  const renderHeader = () => {
    const stepTitles = {
      university: 'Select University',
      faculty: 'Select Faculty',
      course: 'Select Course',
      semester: 'Select Semester',
    };

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
        <View style={styles.headerRight} />
      </View>
    );
  };

  const renderProgress = () => {
    const steps: Step[] = ['university', 'faculty', 'course', 'semester'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                index <= currentIndex && styles.progressDotActive,
              ]}
            >
              {index < currentIndex ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={styles.progressNumber}>{index + 1}</Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  index < currentIndex && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderUniversities = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {universities.map((university) => (
        <TouchableOpacity
          key={university.university_id}
          style={styles.card}
          onPress={() => handleUniversitySelect(university)}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="school" size={32} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{university.name}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {university.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFaculties = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {faculties.map((faculty) => (
        <TouchableOpacity
          key={faculty.id}
          style={styles.card}
          onPress={() => handleFacultySelect(faculty)}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{getTranslatedName(faculty)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCourses = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {courses.map((course) => (
        <TouchableOpacity
          key={course.id}
          style={styles.card}
          onPress={() => handleCourseSelect(course)}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.courseNumber}>{course.number}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('profile.course')} {course.number}
            </Text>
            <Text style={styles.cardDescription}>{getCourseTranslatedName(course)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSemesters = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {semesters.map((semester) => (
        <TouchableOpacity
          key={semester.ID}
          style={styles.card}
          onPress={() => handleSemesterSelect(semester)}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.semesterNumber}>{semester.Number}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('profile.semester')} {semester.Number}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    if (loading || submitting) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {submitting ? 'Saving...' : t('common.loading')}
          </Text>
        </View>
      );
    }

    switch (currentStep) {
      case 'university':
        return renderUniversities();
      case 'faculty':
        return renderFaculties();
      case 'course':
        return renderCourses();
      case 'semester':
        return renderSemesters();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderProgress()}
      {renderContent()}
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerRight: {
      width: 32,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
      justifyContent: 'center',
    },
    progressItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    progressNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressLine: {
      width: 40,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    progressLineActive: {
      backgroundColor: colors.primary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    courseNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    semesterNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
