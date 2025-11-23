import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, SupportedLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateTimeRemaining } from '../utils/jwt';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { academicService } from '../services/academicService';
import { ExtendedUserProfile } from '../types/user';
import { SubscriptionScreen } from './SubscriptionScreen';
import {
  UniversityItem,
  FacultyItem,
  CourseItem,
  SemesterItem,
} from '../types/academic';

interface ProfileScreenProps {
  onLogout: () => void;
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, navigation }) => {
  const { t, i18n } = useTranslation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { currentLanguage, setLanguage } = useLanguage();
  const { accessToken, login: authLogin, subscription, freeTrialInfo, recheckSubscription } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [userData, setUserData] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  // Academic modals
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  
  // Academic data
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loadingAcademic, setLoadingAcademic] = useState(false);

  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
  }, [accessToken]);

  // Reload data when language changes
  useEffect(() => {
    if (userData) {
      loadUserData();
    }
  }, [currentLanguage]);

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

  // Start shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadUserData = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      // Reset animation
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      const payload = userService.decodeJWT(accessToken);
      if (payload?.user_id) {
        const profile = await userService.getUserById(payload.user_id, accessToken);
        setUserData(profile);
        
        // Animate content in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      
      // Handle 402 - subscription required
      if (error.status === 402) {
        console.log('402 error - showing subscription modal');
        setShowSubscriptionModal(true);
        animateModalIn();
      } else {
        showToast.error('Failed to load profile data', t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [accessToken]);

  const loadUniversities = async () => {
    if (!accessToken) return;
    try {
      setLoadingAcademic(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getUniversities(apiLangCode, 1, 50, accessToken);
      setUniversities(response.data);
    } catch (error) {
      console.error('Error loading universities:', error);
      showToast.error('Failed to load universities', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const loadFaculties = async (universityId: number) => {
    if (!accessToken) return;
    try {
      setLoadingAcademic(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getFaculties(universityId, apiLangCode, 1, 50, accessToken);
      setFaculties(response.data);
    } catch (error) {
      console.error('Error loading faculties:', error);
      showToast.error('Failed to load faculties', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const loadCourses = async (limit?: number) => {
    if (!accessToken) return;
    try {
      setLoadingAcademic(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getCourses(apiLangCode, 1, limit || 50, accessToken);
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      showToast.error('Failed to load courses', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const loadSemesters = async () => {
    if (!accessToken) return;
    try {
      setLoadingAcademic(true);
      const response = await academicService.getSemesters(1, 50, accessToken);
      setSemesters(response.data);
    } catch (error) {
      console.error('Error loading semesters:', error);
      showToast.error('Failed to load semesters', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const languages = [
    { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
    { code: 'ru' as SupportedLanguage, name: 'Русский', flag: '🇷🇺' },
    { code: 'tj' as SupportedLanguage, name: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'kk' as SupportedLanguage, name: 'Қазақша', flag: '🇰🇿' },
    { code: 'uz' as SupportedLanguage, name: 'O\'zbekcha', flag: '🇺🇿' },
    { code: 'ky' as SupportedLanguage, name: 'Кыргызча', flag: '🇰🇬' },
  ];

  const themes = [
    { mode: 'light' as const, name: t('theme.light'), icon: 'sunny' },
    { mode: 'dark' as const, name: t('theme.dark'), icon: 'moon' },
    { mode: 'reading' as const, name: t('theme.reading'), icon: 'book' },
    { mode: 'system' as const, name: t('theme.system'), icon: 'settings' },
  ];

  const handleLanguageChange = useCallback((language: SupportedLanguage) => {
    console.log('[ProfileScreen] Changing language to:', language);
    setLanguage(language);
    animateModalOut(() => setShowLanguageModal(false));
  }, [setLanguage]);

  const handleThemeChange = useCallback((mode: typeof themeMode) => {
    console.log('[ProfileScreen] Changing theme to:', mode);
    setThemeMode(mode);
    animateModalOut(() => setShowThemeModal(false));
  }, [setThemeMode]);

  const animateModalIn = () => {
    modalSlideAnim.setValue(300);
    modalFadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateModalOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const handleUniversityPress = async () => {
    await loadUniversities();
    setShowUniversityModal(true);
    animateModalIn();
  };

  const handleFacultyPress = async () => {
    if (!userData?.university?.id || userData.university.id === 0) {
      showToast.warning('Please select a university first', t('common.error'));
      return;
    }
    await loadFaculties(userData.university.id);
    setShowFacultyModal(true);
    animateModalIn();
  };

  const handleCoursePress = async () => {
    // Clear courses list before loading with new limit
    setCourses([]);
    
    // Apply course limit logic for university ID=2
    let courseLimit = 50; // Default limit
    if (userData?.university?.id === 2 && userData?.faculty?.id) {
      const facultyId = userData.faculty.id;
      console.log('[ProfileScreen] University ID:', userData.university.id, 'Faculty ID:', facultyId);
      // Faculty 1, 2 → limit 6
      // Faculty 3, 4, 5 → limit 5
      if (facultyId === 1 || facultyId === 2) {
        courseLimit = 6;
        console.log('[ProfileScreen] Faculty 1 or 2 detected, setting course limit to 6');
      } else if (facultyId === 3 || facultyId === 4 || facultyId === 5) {
        courseLimit = 5;
        console.log('[ProfileScreen] Faculty 3, 4 or 5 detected, setting course limit to 5');
      }
    }
    
    console.log('[ProfileScreen] Loading courses with limit:', courseLimit);
    await loadCourses(courseLimit);
    setShowCourseModal(true);
    animateModalIn();
  };

  const handleSemesterPress = async () => {
    await loadSemesters();
    setShowSemesterModal(true);
    animateModalIn();
  };

  const handleUniversitySelect = async (university: UniversityItem) => {
    if (!accessToken || !userData) return;

    try {
      setLoadingAcademic(true);
      
      // Clear faculties and courses when university changes
      setFaculties([]);
      setCourses([]);
      
      const response = await academicService.updateUserAcademicInfo(
        {
          university_id: university.university_id,
          faculty_id: userData.faculty?.id || 0,
          course_id: userData.course?.id || 0,
          semester_id: userData.semester?.id || 0,
          login: userData.login,
        },
        accessToken
      );
      
      await authLogin(response);
      await loadUserData();
      setShowUniversityModal(false);
      showToast.success('University updated successfully', t('common.success'));
    } catch (error) {
      console.error('Error updating university:', error);
      showToast.error('Failed to update university', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleFacultySelect = async (faculty: FacultyItem) => {
    if (!accessToken || !userData) return;

    try {
      setLoadingAcademic(true);
      
      // Clear courses list when faculty changes
      setCourses([]);
      
      const response = await academicService.updateUserAcademicInfo(
        {
          university_id: userData.university?.id || 0,
          faculty_id: faculty.id,
          course_id: userData.course?.id || 0,
          semester_id: userData.semester?.id || 0,
          login: userData.login,
        },
        accessToken
      );
      
      await authLogin(response);
      await loadUserData();
      setShowFacultyModal(false);
      showToast.success('Faculty updated successfully', t('common.success'));
    } catch (error) {
      console.error('Error updating faculty:', error);
      showToast.error('Failed to update faculty', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleCourseSelect = async (course: CourseItem) => {
    if (!accessToken || !userData) return;

    try {
      setLoadingAcademic(true);
      
      // Auto-select semester for courses > 3
      let semesterId = userData.semester?.id || 0;
      if (course.number > 3) {
        // Load semesters to find semester with ID=1
        const semestersResponse = await academicService.getSemesters(1, 50, accessToken);
        const targetSemester = semestersResponse.data.find(s => s.ID === 1);
        
        if (targetSemester) {
          semesterId = targetSemester.ID;
          showToast.info(
            'Цикл все материалы у них в первом семестре / All materials for this course are in the first semester',
            t('common.info') || 'Information'
          );
        }
      }
      
      const response = await academicService.updateUserAcademicInfo(
        {
          university_id: userData.university?.id || 0,
          faculty_id: userData.faculty?.id || 0,
          course_id: course.id,
          semester_id: semesterId,
          login: userData.login,
        },
        accessToken
      );
      
      await authLogin(response);
      await loadUserData();
      setShowCourseModal(false);
      showToast.success('Course updated successfully', t('common.success'));
    } catch (error) {
      console.error('Error updating course:', error);
      showToast.error('Failed to update course', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleSemesterSelect = async (semester: SemesterItem) => {
    if (!accessToken || !userData) return;

    try {
      setLoadingAcademic(true);
      const response = await academicService.updateUserAcademicInfo(
        {
          university_id: userData.university?.id || 0,
          faculty_id: userData.faculty?.id || 0,
          course_id: userData.course?.id || 0,
          semester_id: semester.ID,
          login: userData.login,
        },
        accessToken
      );
      
      await authLogin(response);
      await loadUserData();
      setShowSemesterModal(false);
      showToast.success('Semester updated successfully', t('common.success'));
    } catch (error) {
      console.error('Error updating semester:', error);
      showToast.error('Failed to update semester', t('common.error'));
    } finally {
      setLoadingAcademic(false);
    }
  };

  const handleLogout = () => {
    showToast.confirm(
      t('profile.logoutConfirm'),
      t('profile.logout'),
      () => {
        // User confirmed logout
        onLogout();
      },
      () => {
        // User cancelled - do nothing
      }
    );
  };

  const renderSkeletonLoader = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-300, 300],
    });

    return (
      <View>
        {/* Profile Header Skeleton */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, styles.skeletonAvatar]}>
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.skeletonText, { width: '60%', height: 20, marginBottom: 8 }]}>
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
            </View>
            <View style={[styles.skeletonText, { width: '40%', height: 16 }]}>
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Section Skeleton */}
        {[1, 2].map((section) => (
          <View key={section} style={styles.section}>
            <View style={[styles.skeletonText, { width: '40%', height: 22, marginBottom: 16 }]}>
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />
            </View>
            <View style={styles.settingsList}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.settingItem}>
                  <View style={[styles.skeletonText, { width: '50%', height: 16 }]}>
                    <Animated.View
                      style={[
                        styles.shimmerOverlay,
                        {
                          transform: [{ translateX: shimmerTranslate }],
                        },
                      ]}
                    />
                  </View>
                  <View style={[styles.skeletonText, { width: '30%', height: 16 }]}>
                    <Animated.View
                      style={[
                        styles.shimmerOverlay,
                        {
                          transform: [{ translateX: shimmerTranslate }],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getTranslatedText = (translations: any[] | null, langCode: string, field: 'name' | 'description' = 'name'): string => {
    if (!translations || translations.length === 0) return '';
    
    // Map language codes
    const langMap: { [key: string]: string } = {
      'en': 'en',
      'ru': 'ru',
      'tj': 'tj',
      'kk': 'kz',
      'uz': 'uz',
      'ky': 'kg',
    };
    
    const mappedLang = langMap[langCode] || langCode;
    const translation = translations.find(t => t.lang_code === mappedLang);
    
    if (translation) {
      return translation[field] || '';
    }
    
    // Fallback to first translation
    return translations[0]?.[field] || '';
  };

  const renderUserInfo = () => {
    if (loading) {
      return renderSkeletonLoader();
    }

    if (!userData) {
      return null;
    }

    const hasUniversity = userData.university?.id && userData.university.id !== 0;
    const hasFaculty = userData.faculty?.id && userData.faculty.id !== 0;
    const hasCourse = userData.course?.id && userData.course.id !== 0;
    const hasSemester = userData.semester?.id && userData.semester.id !== 0;
    
    // Count unique subject_id (one subject can have multiple translations)
    const uniqueSubjectIds = new Set(
      userData.faculty?.subjects?.map(s => s.subject_id) || []
    );
    const subjectsCount = uniqueSubjectIds.size;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Profile Header - Minimalist */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.login.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData.login}</Text>
            <Text style={styles.userRole}>{userData.role}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSettingItem = (
    title: string,
    value: string,
    onPress: () => void,
    iconName?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        {iconName && <Ionicons name={iconName} size={20} color={colors.textSecondary} style={styles.settingIcon} />}
        <Text style={styles.settingTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  const getTranslatedUniversityName = (university: UniversityItem): string => {
    return university.name;
  };

  const getTranslatedFacultyName = (faculty: FacultyItem): string => {
    return faculty.translations[0]?.name || 'Unknown';
  };

  const getTranslatedCourseName = (course: CourseItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = course.translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || course.translations[0]?.name || `Course ${course.number}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderUserInfo()}

        {/* Academic Information Selectors */}
        {userData && (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>{t('profile.academicInfo')}</Text>
            <View style={styles.settingsList}>
              {renderSettingItem(
                t('profile.university'),
                userData.university?.id && userData.university.id !== 0
                  ? getTranslatedText(userData.university.translations, currentLanguage)
                  : 'Not selected',
                handleUniversityPress,
                'school-outline'
              )}

              {renderSettingItem(
                t('profile.faculty'),
                userData.faculty?.id && userData.faculty.id !== 0
                  ? getTranslatedText(userData.faculty.translations, currentLanguage)
                  : 'Not selected',
                handleFacultyPress,
                'library-outline'
              )}

              {renderSettingItem(
                t('profile.course'),
                userData.course?.id && userData.course.id !== 0
                  ? `${t('profile.course')} ${userData.course.number}`
                  : 'Not selected',
                handleCoursePress,
                'ribbon-outline'
              )}

              {/* Only show semester selector if course <= 3 or not selected */}
              {(!userData.course?.number || userData.course.number <= 3) && renderSettingItem(
                t('profile.semester'),
                userData.semester?.id && userData.semester.id !== 0
                  ? `${t('profile.semester')} ${userData.semester.number}`
                  : 'Not selected',
                handleSemesterPress,
                'calendar-outline'
              )}
            </View>
          </Animated.View>
        )}

        {/* Settings Sections */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
          <View style={styles.settingsList}>
            {renderSettingItem(
              t('profile.language'),
              languages.find(l => l.code === currentLanguage)?.name || 'English',
              () => {
                setShowLanguageModal(true);
                animateModalIn();
              },
              'globe-outline'
            )}

            {renderSettingItem(
              t('profile.theme'),
              themes.find(t => t.mode === themeMode)?.name || t('theme.system'),
              () => {
                setShowThemeModal(true);
                animateModalIn();
              },
              theme === 'dark' ? 'moon' : 'sunny'
            )}
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
          <View style={styles.settingsList}>
            {renderSettingItem(
              t('profile.helpSupport'),
              '',
              () => showToast.info(t('profile.featureComingSoon'), t('profile.comingSoon')),
              'help-circle-outline'
            )}

            {renderSettingItem(
              t('profile.about'),
              t('profile.version'),
              () => showToast.info('Rayan App v1.0.0\nBuilt with React Native', t('profile.aboutApp')),
              'information-circle-outline'
            )}
          </View>
        </Animated.View>

        {/* Subscription Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('profile.subscription')}</Text>
          <View style={styles.settingsList}>
            {subscription && subscription.is_active ? (
              // Active subscription
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    <Text style={styles.subscriptionStatus}>{t('subscription.active')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      setIsCheckingSubscription(true);
                      await recheckSubscription();
                      setIsCheckingSubscription(false);
                      showToast.success(t('subscription.statusUpdated'), t('common.success'));
                    }}
                    disabled={isCheckingSubscription}
                    style={styles.refreshIconButton}
                  >
                    {isCheckingSubscription ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="refresh" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.subscriptionDetails}>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>{t('subscription.daysRemaining')}:</Text>
                    <View style={styles.timeRemainingContainer}>
                      {(() => {
                        if (subscription.end_date) {
                          const { days, hours, minutes } = calculateTimeRemaining(subscription.end_date);
                          return (
                            <>
                              <Text style={styles.subscriptionValue}>{days} {t('subscription.days')}</Text>
                              <Text style={styles.timeRemainingSmall}>{hours} {t('subscription.hours')} {minutes} {t('subscription.minutes')}</Text>
                            </>
                          );
                        } else {
                          const days = subscription.days_remaining || 0;
                          return <Text style={styles.subscriptionValue}>{days} {t('subscription.days')}</Text>;
                        }
                      })()}
                    </View>
                  </View>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>{t('subscription.price')}:</Text>
                    <Text style={styles.subscriptionValue}>{subscription.price} TJS</Text>
                  </View>
                </View>
                {(subscription.days_remaining || 0) < 3 && (
                  <TouchableOpacity
                    style={styles.subscriptionButtonFull}
                    onPress={() => {
                      setShowSubscriptionModal(true);
                      animateModalIn();
                    }}
                  >
                    <Ionicons name="card-outline" size={20} color="#ffffff" />
                    <Text style={styles.subscriptionButtonText}>{t('subscription.buySubscription')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : subscription && subscription.status === 'pending' ? (
              // Pending subscription
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="time-outline" size={24} color={colors.warning || '#FFA500'} />
                  <Text style={[styles.subscriptionStatus, { color: colors.warning || '#FFA500' }]}>
                    {t('subscription.pending')}
                  </Text>
                </View>
                <Text style={styles.subscriptionMessage}>
                  {t('subscription.pendingMessage')}
                </Text>
                <TouchableOpacity
                  style={styles.subscriptionButton}
                  onPress={async () => {
                    setIsCheckingSubscription(true);
                    await recheckSubscription();
                    setIsCheckingSubscription(false);
                    showToast.success(t('subscription.statusUpdated'), t('common.success'));
                  }}
                  disabled={isCheckingSubscription}
                >
                  {isCheckingSubscription ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color="#ffffff" />
                      <Text style={styles.subscriptionButtonText}>{t('subscription.refresh')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : freeTrialInfo && freeTrialInfo.hasFreeTrial && !freeTrialInfo.isExpired ? (
              // Free trial active
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="gift-outline" size={24} color={colors.primary} />
                  <Text style={styles.subscriptionStatus}>{t('subscription.freeTrialTitle')}</Text>
                </View>
                <View style={styles.subscriptionDetails}>
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>{t('subscription.daysRemaining')}:</Text>
                    <View style={styles.timeRemainingContainer}>
                      {(() => {
                        if (freeTrialInfo.expiryDate) {
                          const { days, hours, minutes } = calculateTimeRemaining(freeTrialInfo.expiryDate.toISOString());
                          return (
                            <>
                              <Text style={styles.subscriptionValue}>{days} {t('subscription.days')}</Text>
                              <Text style={styles.timeRemainingSmall}>{hours} {t('subscription.hours')} {minutes} {t('subscription.minutes')}</Text>
                            </>
                          );
                        } else {
                          const days = freeTrialInfo.daysRemaining;
                          return <Text style={styles.subscriptionValue}>{days} {t('subscription.days')}</Text>;
                        }
                      })()}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.subscriptionButtonFull}
                  onPress={() => {
                    setShowSubscriptionModal(true);
                    animateModalIn();
                  }}
                >
                  <Ionicons name="card-outline" size={20} color="#ffffff" />
                  <Text style={styles.subscriptionButtonText}>{t('subscription.buySubscription')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // No subscription
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="alert-circle-outline" size={24} color={colors.error || '#F44336'} />
                  <Text style={[styles.subscriptionStatus, { color: colors.error || '#F44336' }]}>
                    {t('profile.noSubscription')}
                  </Text>
                </View>
                <Text style={styles.subscriptionMessage}>
                  {t('profile.noSubscriptionMessage')}
                </Text>
                <TouchableOpacity
                  style={styles.subscriptionButtonFull}
                  onPress={() => {
                    setShowSubscriptionModal(true);
                    animateModalIn();
                  }}
                >
                  <Ionicons name="card-outline" size={20} color="#ffffff" />
                  <Text style={styles.subscriptionButtonText}>{t('subscription.buySubscription')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Account Section */}
        <Animated.View 
          style={[
            styles.section, 
            styles.accountSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <View style={styles.settingsList}>
            {renderSettingItem(
              t('profile.editProfile'),
              '',
              () => showToast.info(t('profile.featureComingSoon'), t('profile.comingSoon')),
              'person-outline'
            )}

            {renderSettingItem(
              t('profile.privacySettings'),
              '',
              () => showToast.info(t('profile.featureComingSoon'), t('profile.comingSoon')),
              'lock-closed-outline'
            )}

            {renderSettingItem(
              t('profile.notifications'),
              '',
              () => showToast.info(t('profile.featureComingSoon'), t('profile.comingSoon')),
              'notifications-outline'
            )}

            {navigation && renderSettingItem(
              t('favorites.viewFavorites'),
              '',
              () => navigation.navigate('Favorites', { from: 'profile' as const }),
              'star-outline'
            )}
            
            {renderSettingItem(
              t('profile.logout'),
              '',
              handleLogout,
              'log-out-outline'
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Language Selection Bottom Sheet */}
      {showLanguageModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowLanguageModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowLanguageModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.bottomSheetItem,
                    currentLanguage === lang.code && styles.bottomSheetItemSelected
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.bottomSheetItemFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.bottomSheetItemText,
                    currentLanguage === lang.code && styles.bottomSheetItemTextSelected
                  ]}>
                    {lang.name}
                  </Text>
                  {currentLanguage === lang.code && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Theme Selection Bottom Sheet */}
      {showThemeModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowThemeModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectTheme')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowThemeModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {themes.map((themeOption) => (
                <TouchableOpacity
                  key={themeOption.mode}
                  style={[
                    styles.bottomSheetItem,
                    themeMode === themeOption.mode && styles.bottomSheetItemSelected
                  ]}
                  onPress={() => handleThemeChange(themeOption.mode)}
                >
                  <Ionicons 
                    name={themeOption.icon as any} 
                    size={24} 
                    color={colors.text} 
                    style={styles.bottomSheetItemIcon}
                  />
                  <Text style={[
                    styles.bottomSheetItemText,
                    themeMode === themeOption.mode && styles.bottomSheetItemTextSelected
                  ]}>
                    {themeOption.name}
                  </Text>
                  {themeMode === themeOption.mode && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* University Selection Bottom Sheet */}
      {showUniversityModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowUniversityModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectUniversity')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowUniversityModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {loadingAcademic ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                universities.map((university) => (
                  <TouchableOpacity
                    key={university.university_id}
                    style={[
                      styles.bottomSheetItem,
                      userData?.university?.id === university.university_id && styles.bottomSheetItemSelected
                    ]}
                    onPress={() => handleUniversitySelect(university)}
                  >
                    <Ionicons 
                      name="school" 
                      size={24} 
                      color={colors.text} 
                      style={styles.bottomSheetItemIcon}
                    />
                    <Text style={[
                      styles.bottomSheetItemText,
                      userData?.university?.id === university.university_id && styles.bottomSheetItemTextSelected
                    ]}>
                      {getTranslatedUniversityName(university)}
                    </Text>
                    {userData?.university?.id === university.university_id && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Faculty Selection Bottom Sheet */}
      {showFacultyModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowFacultyModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectFaculty')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowFacultyModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {loadingAcademic ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                faculties.map((faculty) => (
                  <TouchableOpacity
                    key={faculty.id}
                    style={[
                      styles.bottomSheetItem,
                      userData?.faculty?.id === faculty.id && styles.bottomSheetItemSelected
                    ]}
                    onPress={() => handleFacultySelect(faculty)}
                  >
                    <Ionicons 
                      name="library" 
                      size={24} 
                      color={colors.text} 
                      style={styles.bottomSheetItemIcon}
                    />
                    <Text style={[
                      styles.bottomSheetItemText,
                      userData?.faculty?.id === faculty.id && styles.bottomSheetItemTextSelected
                    ]}>
                      {getTranslatedFacultyName(faculty)}
                    </Text>
                    {userData?.faculty?.id === faculty.id && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Course Selection Bottom Sheet */}
      {showCourseModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowCourseModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectCourse')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowCourseModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {loadingAcademic ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                courses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.bottomSheetItem,
                      userData?.course?.id === course.id && styles.bottomSheetItemSelected
                    ]}
                    onPress={() => handleCourseSelect(course)}
                  >
                    <View style={styles.courseNumberBadge}>
                      <Text style={styles.courseNumberBadgeText}>{course.number}</Text>
                    </View>
                    <Text style={[
                      styles.bottomSheetItemText,
                      userData?.course?.id === course.id && styles.bottomSheetItemTextSelected
                    ]}>
                      {getTranslatedCourseName(course)}
                    </Text>
                    {userData?.course?.id === course.id && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Semester Selection Bottom Sheet */}
      {showSemesterModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowSemesterModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.bottomSheetContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{t('profile.selectSemester')}</Text>
              <TouchableOpacity onPress={() => animateModalOut(() => setShowSemesterModal(false))}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetScroll}>
              {loadingAcademic ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                semesters.map((semester) => (
                  <TouchableOpacity
                    key={semester.ID}
                    style={[
                      styles.bottomSheetItem,
                      userData?.semester?.id === semester.ID && styles.bottomSheetItemSelected
                    ]}
                    onPress={() => handleSemesterSelect(semester)}
                  >
                    <View style={styles.courseNumberBadge}>
                      <Text style={styles.courseNumberBadgeText}>{semester.Number}</Text>
                    </View>
                    <Text style={[
                      styles.bottomSheetItemText,
                      userData?.semester?.id === semester.ID && styles.bottomSheetItemTextSelected
                    ]}>
                      {t('profile.semester')} {semester.Number}
                    </Text>
                    {userData?.semester?.id === semester.ID && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Subscription Bottom Sheet */}
      {showSubscriptionModal && (
        <View style={styles.bottomSheetOverlay}>
          <Animated.View 
            style={[
              styles.overlayBackground,
              { opacity: modalFadeAnim }
            ]}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => animateModalOut(() => setShowSubscriptionModal(false))}
            />
          </Animated.View>
          <Animated.View 
            style={[
              styles.fullScreenModal,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <SubscriptionScreen
              accessToken={accessToken || ''}
              subscription={subscription}
              freeTrialInfo={freeTrialInfo}
              onSubscriptionComplete={async (tokens) => {
                await authLogin(tokens);
                animateModalOut(() => setShowSubscriptionModal(false));
              }}
              onRefreshStatus={recheckSubscription}
              onBack={() => animateModalOut(() => setShowSubscriptionModal(false))}
            />
          </Animated.View>
        </View>
      )}
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
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    userRole: {
      fontSize: 14,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    infoItem: {
      marginBottom: 16,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    settingsList: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingValue: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
      maxWidth: 180,
    },
    accountSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      marginTop: 8,
    },
    // Bottom Sheet Styles
    bottomSheetOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    overlayBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheetContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bottomSheetTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    bottomSheetScroll: {
      maxHeight: 400,
    },
    bottomSheetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    bottomSheetItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    bottomSheetItemFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    bottomSheetItemIcon: {
      marginRight: 12,
    },
    bottomSheetItemText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    bottomSheetItemTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    courseNumberBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    courseNumberBadgeText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    // Skeleton Loader Styles
    skeletonAvatar: {
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    skeletonText: {
      backgroundColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    shimmerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      width: 300,
    },
    // Subscription Card Styles
    subscriptionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 10,
    },
    subscriptionStatus: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subscriptionDetails: {
      marginBottom: 16,
    },
    subscriptionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    subscriptionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    subscriptionValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    subscriptionMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    subscriptionButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    subscriptionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    timeRemainingContainer: {
      alignItems: 'flex-end',
    },
    timeRemainingSmall: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    subscriptionButtonsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    fullScreenModal: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
    },
    refreshIconButton: {
      padding: 4,
    },
    subscriptionButtonFull: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginTop: 12,
      gap: 8,
    },
  });
