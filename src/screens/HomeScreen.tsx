import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { academicService } from '../services/academicService';
import { ExtendedUserProfile } from '../types/user';
import {
  SubjectItem,
  UniversityItem,
  FacultyItem,
  CourseItem,
  SemesterItem,
  MaterialDetail,
  MaterialDetailTranslation,
} from '../types/academic';
import { MaterialTypesScreen } from './MaterialTypesScreen';
import { MaterialsScreen } from './MaterialsScreen';
import { MaterialViewerScreen } from './MaterialViewerScreen';

type SetupStep = 'check' | 'university' | 'faculty' | 'course' | 'semester' | 'complete';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken, login: authLogin } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [userData, setUserData] = useState<ExtendedUserProfile | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Academic setup states
  const [setupStep, setSetupStep] = useState<SetupStep>('check');
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loadingSetup, setLoadingSetup] = useState(false);
  
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<SemesterItem | null>(null);
  
  // Navigation state
  type NavigationScreen = 'subjects' | 'materialTypes' | 'materials' | 'viewer';
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState<number | null>(null);
  const [selectedMaterialTypeName, setSelectedMaterialTypeName] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | null>(null);
  const [selectedMaterialTranslation, setSelectedMaterialTranslation] = useState<MaterialDetailTranslation | null>(null);

  // Hide tab bar when viewing materials
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        tabBarStyle: currentScreen === 'viewer' 
          ? { display: 'none' }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            }
      });
    }
  }, [currentScreen, navigation, colors]);

  useEffect(() => {
    loadUserData();
  }, [accessToken]);

  useEffect(() => {
    if (userData) {
      checkAcademicInfo();
    }
  }, [userData]);
  
  useEffect(() => {
    if (setupStep === 'complete' && userData) {
      loadSubjects();
    }
  }, [userData, currentLanguage, setupStep]);

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

  const loadUserData = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const payload = userService.decodeJWT(accessToken);
      if (payload?.user_id) {
        const profile = await userService.getUserById(payload.user_id, accessToken);
        setUserData(profile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAcademicInfo = () => {
    if (!userData) return;
    
    const hasUniversity = userData.university?.id && userData.university.id !== 0;
    const hasFaculty = userData.faculty?.id && userData.faculty.id !== 0;
    const hasCourse = userData.course?.id && userData.course.id !== 0;
    const hasSemester = userData.semester?.id && userData.semester.id !== 0;

    if (hasUniversity && hasFaculty && hasCourse && hasSemester) {
      setSetupStep('complete');
    } else {
      setSetupStep('university');
      loadUniversities();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    if (setupStep === 'complete') {
      await loadSubjects();
    }
    setRefreshing(false);
  }, [accessToken, setupStep]);

  const loadUniversities = async () => {
    if (!accessToken) return;

    try {
      setLoadingSetup(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getUniversities(apiLangCode, 1, 50, accessToken);
      setUniversities(response.data);
    } catch (error) {
      console.error('Error loading universities:', error);
      showToast.error('Failed to load universities', t('common.error'));
    } finally {
      setLoadingSetup(false);
    }
  };

  const loadFaculties = async (universityId: number) => {
    if (!accessToken) return;

    try {
      setLoadingSetup(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getFaculties(universityId, apiLangCode, 1, 50, accessToken);
      setFaculties(response.data);
    } catch (error) {
      console.error('Error loading faculties:', error);
      showToast.error('Failed to load faculties', t('common.error'));
    } finally {
      setLoadingSetup(false);
    }
  };

  const loadCourses = async () => {
    if (!accessToken) return;

    try {
      setLoadingSetup(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getCourses(apiLangCode, 1, 50, accessToken);
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      showToast.error('Failed to load courses', t('common.error'));
    } finally {
      setLoadingSetup(false);
    }
  };

  const loadSemesters = async () => {
    if (!accessToken) return;

    try {
      setLoadingSetup(true);
      const response = await academicService.getSemesters(1, 50, accessToken);
      setSemesters(response.data);
    } catch (error) {
      console.error('Error loading semesters:', error);
      showToast.error('Failed to load semesters', t('common.error'));
    } finally {
      setLoadingSetup(false);
    }
  };

  const loadSubjects = async () => {
    if (!accessToken || !userData) return;

    const hasAcademicInfo =
      userData.university?.id &&
      userData.university.id !== 0 &&
      userData.faculty?.id &&
      userData.faculty.id !== 0 &&
      userData.course?.id &&
      userData.course.id !== 0 &&
      userData.semester?.id &&
      userData.semester.id !== 0;

    if (!hasAcademicInfo) {
      setSubjects([]);
      return;
    }

    try {
      setLoadingSubjects(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getSubjects(
        apiLangCode,
        userData.faculty.id,
        userData.semester.id,
        userData.course.id,
        1,
        50,
        accessToken
      );
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      showToast.error('Failed to load subjects', t('common.error'));
    } finally {
      setLoadingSubjects(false);
    }
  };

  const getTranslatedSubjectName = (subject: SubjectItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = subject.translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || subject.translations[0]?.name || 'Unknown Subject';
  };

  const getTranslatedText = (translations: any[], lang: string): string => {
    const apiLangCode = getLangCodeForAPI(lang);
    const translation = translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || translations[0]?.name || 'Unknown';
  };

  const getTranslatedFacultyName = (faculty: FacultyItem): string => {
    return faculty.translations[0]?.name || 'Unknown';
  };

  const getTranslatedCourseName = (course: CourseItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = course.translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || course.translations[0]?.name || `Course ${course.number}`;
  };

  const getMaterialsCountForLanguage = (subject: SubjectItem): number => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    // Count materials that have translation for current language
    return subject.materials.filter(material => 
      material.material_translation.some((t: { lang_code: string }) => t.lang_code === apiLangCode)
    ).length;
  };

  const handleUniversitySelect = async (university: UniversityItem) => {
    setSelectedUniversity(university);
    setSetupStep('faculty');
    await loadFaculties(university.university_id);
  };

  const handleFacultySelect = async (faculty: FacultyItem) => {
    setSelectedFaculty(faculty);
    setSetupStep('course');
    await loadCourses();
  };

  const handleCourseSelect = async (course: CourseItem) => {
    setSelectedCourse(course);
    setSetupStep('semester');
    await loadSemesters();
  };

  const handleSemesterSelect = async (semester: SemesterItem) => {
    if (!accessToken || !selectedUniversity || !selectedFaculty || !selectedCourse || !userData) return;

    try {
      setLoadingSetup(true);
      const response = await academicService.updateUserAcademicInfo(
        {
          course_id: selectedCourse.id,
          faculty_id: selectedFaculty.id,
          login: userData.login,
          semester_id: semester.ID,
          university_id: selectedUniversity.university_id,
        },
        accessToken
      );

      await authLogin(response);
      await loadUserData();
      setSetupStep('complete');
    } catch (error) {
      console.error('Error saving academic info:', error);
      showToast.error('Failed to save academic information', t('common.error'));
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleSubjectPress = (subject: SubjectItem) => {
    setSelectedSubject(subject);
    setCurrentScreen('materialTypes');
  };

  const handleMaterialTypePress = (materialTypeId: number, materialTypeName: string) => {
    setSelectedMaterialTypeId(materialTypeId);
    setSelectedMaterialTypeName(materialTypeName);
    setCurrentScreen('materials');
  };

  const handleMaterialPress = (material: MaterialDetail, translation: MaterialDetailTranslation) => {
    setSelectedMaterial(material);
    setSelectedMaterialTranslation(translation);
    setCurrentScreen('viewer');
  };

  const handleBackFromMaterialTypes = () => {
    setCurrentScreen('subjects');
    setSelectedSubject(null);
  };

  const handleBackFromMaterials = () => {
    setCurrentScreen('materialTypes');
    setSelectedMaterialTypeId(null);
    setSelectedMaterialTypeName('');
  };

  const handleBackFromViewer = () => {
    setCurrentScreen('materials');
    setSelectedMaterial(null);
    setSelectedMaterialTranslation(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderUniversities = () => (
    <>
      <Text style={styles.setupTitle}>Выберите университет</Text>
      <Text style={styles.setupSubtitle}>Шаг 1 из 4</Text>
      {loadingSetup ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {universities.map((university) => (
            <TouchableOpacity
              key={university.university_id}
              style={styles.universityCard}
              onPress={() => handleUniversitySelect(university)}
            >
              <View style={styles.cardIconLarge}>
                <Ionicons name="school" size={40} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{university.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {university.description}
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderFaculties = () => (
    <>
      <Text style={styles.setupTitle}>Выберите факультет</Text>
      <Text style={styles.setupSubtitle}>Шаг 2 из 4</Text>
      {selectedUniversity && (
        <View style={styles.selectedInfo}>
          <Ionicons name="school" size={16} color={colors.textSecondary} />
          <Text style={styles.selectedText}>{selectedUniversity.name}</Text>
        </View>
      )}
      {loadingSetup ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.cardsColumn}>
          {faculties.map((faculty) => (
            <TouchableOpacity
              key={faculty.id}
              style={styles.facultyCard}
              onPress={() => handleFacultySelect(faculty)}
            >
              <View style={styles.cardIconMedium}>
                <Ionicons name="library" size={28} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitleMedium}>
                  {getTranslatedFacultyName(faculty)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderCourses = () => (
    <>
      <Text style={styles.setupTitle}>Выберите курс</Text>
      <Text style={styles.setupSubtitle}>Шаг 3 из 4</Text>
      {selectedFaculty && (
        <View style={styles.selectedInfo}>
          <Ionicons name="library" size={16} color={colors.textSecondary} />
          <Text style={styles.selectedText}>{getTranslatedFacultyName(selectedFaculty)}</Text>
        </View>
      )}
      {loadingSetup ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.coursesGrid}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => handleCourseSelect(course)}
            >
              <View style={styles.courseNumber}>
                <Text style={styles.courseNumberText}>{course.number}</Text>
              </View>
              <Text style={styles.courseText}>{t('profile.course')}</Text>
              <Text style={styles.courseDesc}>{getTranslatedCourseName(course)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderSemesters = () => (
    <>
      <Text style={styles.setupTitle}>Выберите семестр</Text>
      <Text style={styles.setupSubtitle}>Шаг 4 из 4</Text>
      {selectedCourse && (
        <View style={styles.selectedInfo}>
          <Ionicons name="ribbon" size={16} color={colors.textSecondary} />
          <Text style={styles.selectedText}>{t('profile.course')} {selectedCourse.number}</Text>
        </View>
      )}
      {loadingSetup ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.semestersGrid}>
          {semesters.map((semester) => (
            <TouchableOpacity
              key={semester.ID}
              style={styles.semesterCard}
              onPress={() => handleSemesterSelect(semester)}
            >
              <View style={styles.semesterNumber}>
                <Text style={styles.semesterNumberText}>{semester.Number}</Text>
              </View>
              <Text style={styles.semesterText}>{t('profile.semester')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderSubjects = () => (
    <>
      {/* {userData && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('profile.course')}</Text>
              <Text style={styles.infoValue}>{userData.course.number}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('profile.semester')}</Text>
              <Text style={styles.infoValue}>{userData.semester.number}</Text>
            </View>
          </View>
        </View>
      )} */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('home.subjects')} ({subjects.length})
        </Text>
        
        {loadingSubjects ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No subjects found</Text>
          </View>
        ) : (
          <View style={styles.subjectsGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={styles.subjectGridCard}
                onPress={() => handleSubjectPress(subject)}
              >
                <View style={styles.subjectIconLarge}>
                  <Ionicons name="book" size={32} color={colors.primary} />
                </View>
                <Text style={styles.subjectGridTitle} numberOfLines={2}>
                  {getTranslatedSubjectName(subject)}
                </Text>
                {getMaterialsCountForLanguage(subject) > 0 && (
                  <View style={styles.subjectGridMeta}>
                    <Ionicons
                      name="document-text"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.subjectGridMetaText}>
                      {getMaterialsCountForLanguage(subject)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </>
  );

  // Navigation rendering
  if (currentScreen === 'materialTypes' && selectedSubject && userData) {
    return (
      <MaterialTypesScreen
        courseId={userData.course?.id || 0}
        semesterId={userData.semester?.id || 0}
        subjectId={selectedSubject.id}
        subjectName={getTranslatedSubjectName(selectedSubject)}
        onBack={handleBackFromMaterialTypes}
        onMaterialTypePress={handleMaterialTypePress}
      />
    );
  }

  if (currentScreen === 'materials' && selectedSubject && selectedMaterialTypeId && userData) {
    return (
      <MaterialsScreen
        courseId={userData.course?.id || 0}
        semesterId={userData.semester?.id || 0}
        subjectId={selectedSubject.id}
        materialTypeId={selectedMaterialTypeId}
        materialTypeName={selectedMaterialTypeName}
        subjectName={getTranslatedSubjectName(selectedSubject)}
        onBack={handleBackFromMaterials}
        onMaterialPress={handleMaterialPress}
      />
    );
  }

  if (currentScreen === 'viewer' && selectedMaterial && selectedMaterialTranslation) {
    return (
      <MaterialViewerScreen
        material={selectedMaterial}
        translation={selectedMaterialTranslation}
        onBack={handleBackFromViewer}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Minimalist Header with Blur */}
      {userData && setupStep === 'complete' && (
        <BlurView
          intensity={80}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={styles.fixedHeader}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t('navigation.home')}</Text>
              <Text style={styles.headerSubtitle}>@{userData.login}</Text>
            </View>
            <View style={styles.headerRight}>
              {navigation && (
                <TouchableOpacity
                  style={styles.headerIcon}
                  onPress={() => navigation.navigate('ProfileTab', { screen: 'Favorites' })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="star-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
              <View style={styles.headerIcon}>
                <Ionicons name="school-outline" size={24} color={colors.primary} />
              </View>
            </View>
          </View>
          
          {/* Academic Info - One Line */}
          {(userData.faculty?.id || userData.course?.id || userData.semester?.id) && (
            <View style={styles.academicInfo}>
              <Text style={styles.academicText} numberOfLines={1}>
                {userData.faculty?.id && userData.faculty.id !== 0 && userData.faculty.translations && (
                  <Text>{getTranslatedText(userData.faculty.translations, currentLanguage)}</Text>
                )}
                {userData.course?.id && userData.course.id !== 0 && (
                  <Text>
                    {userData.faculty?.id && userData.faculty.id !== 0 ? ' • ' : ''}
                    {userData.course.number} {t('profile.course').toLowerCase()}
                  </Text>
                )}
                {userData.semester?.id && userData.semester.id !== 0 && (
                  <Text>
                    {' • '}{userData.semester.number} {t('profile.semester').toLowerCase()}
                  </Text>
                )}
              </Text>
            </View>
          )}
        </BlurView>
      )}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={setupStep === 'complete' ? styles.contentWithHeader : styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {setupStep !== 'complete' && (
          <View style={styles.header}>
            <Text style={styles.title}>{t('navigation.home')}</Text>
          </View>
        )}

        {setupStep === 'university' && renderUniversities()}
        {setupStep === 'faculty' && renderFaculties()}
        {setupStep === 'course' && renderCourses()}
        {setupStep === 'semester' && renderSemesters()}
        {setupStep === 'complete' && renderSubjects()}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    contentWithHeader: {
      padding: 20,
      paddingTop: 10,
    },
    fixedHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '10',
      justifyContent: 'center',
      alignItems: 'center',
    },
    academicInfo: {
      marginTop: 2,
    },
    academicText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
      lineHeight: 18,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    setupTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    setupSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    selectedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      gap: 8,
    },
    selectedText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    cardsGrid: {
      gap: 16,
    },
    universityCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    cardIconLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    cardArrow: {
      alignSelf: 'flex-end',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardsColumn: {
      gap: 12,
    },
    facultyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardIconMedium: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardBody: {
      flex: 1,
    },
    cardTitleMedium: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    coursesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    courseCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    courseNumber: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    courseNumberText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
    },
    courseText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    courseDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    semestersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    semesterCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    semesterNumber: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    semesterNumberText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    semesterText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    infoItem: {
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    subjectsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    subjectGridCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      minHeight: 180,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    subjectIconLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    subjectGridTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 12,
      flex: 1,
    },
    subjectGridMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
    },
    subjectGridMetaText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
