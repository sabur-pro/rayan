import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  BackHandler,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { academicService } from '../services/academicService';
import {
  SubjectItem,
  MaterialTypeItem,
  MaterialDetail,
  MaterialDetailTranslation,
} from '../types/academic';
import { ExtendedUserProfile } from '../types/user';
import { showToast } from '../utils/toast';
import { SubjectCardSkeleton, MaterialTypeCardSkeleton, MaterialCardSkeleton } from '../components/Skeleton';
import { ChatHistoryDrawer } from '../components/ChatHistoryDrawer';

type SelectionStep = 'welcome' | 'subjects' | 'materialTypes' | 'materials';

interface ChatMaterialSelectorScreenProps {
  userData: ExtendedUserProfile | null;
  onMaterialSelected: (
    material: MaterialDetail,
    translation: MaterialDetailTranslation,
    state?: { selectedSubject: SubjectItem; selectedMaterialType: MaterialTypeItem; currentStep: SelectionStep }
  ) => void;
  onBack: () => void;
  onChatSelected?: (chatId: string, title: string) => void;
  onGeneralChatSelected?: () => void;
  initialState?: {
    selectedSubject: SubjectItem;
    selectedMaterialType: MaterialTypeItem;
    currentStep: SelectionStep;
  } | null;
}

export const ChatMaterialSelectorScreen: React.FC<ChatMaterialSelectorScreenProps> = ({
  userData,
  onMaterialSelected,
  onBack,
  onChatSelected,
  onGeneralChatSelected,
  initialState,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [currentStep, setCurrentStep] = useState<SelectionStep>(initialState?.currentStep || 'welcome');
  const [loading, setLoading] = useState(initialState?.currentStep ? true : false);
  const [refreshing, setRefreshing] = useState(false);

  // Step 1: Subjects
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(initialState?.selectedSubject || null);

  // Step 2: Material Types
  const [materialTypes, setMaterialTypes] = useState<MaterialTypeItem[]>([]);
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialTypeItem | null>(initialState?.selectedMaterialType || null);

  // Step 3: Materials
  const [materials, setMaterials] = useState<MaterialDetail[]>([]);
  
  // Chat History
  const [showHistory, setShowHistory] = useState(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (userData) {
      if (initialState) {
        // Восстанавливаем состояние
        if (initialState.currentStep === 'materials' && initialState.selectedSubject && initialState.selectedMaterialType) {
          // Загружаем предметы для возможности вернуться назад
          loadSubjects().then(() => {
            // Затем загружаем типы материалов
            loadMaterialTypes(initialState.selectedSubject.id).then(() => {
              // И наконец материалы
              loadMaterials(initialState.selectedSubject.id, initialState.selectedMaterialType.material_type_id);
            });
          });
        } else if (initialState.currentStep === 'materialTypes' && initialState.selectedSubject) {
          // Загружаем предметы, затем типы материалов
          loadSubjects().then(() => {
            loadMaterialTypes(initialState.selectedSubject.id);
          });
        } else if (initialState.currentStep === 'subjects') {
          loadSubjects();
        }
        // Для welcome не загружаем ничего
      }
      // Если нет initialState, остаёмся на welcome
    }
  }, [userData, currentLanguage]);

  // Анимация при монтировании для welcome экрана
  useEffect(() => {
    if (currentStep === 'welcome' && !initialState) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
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

  const loadSubjects = async () => {
    if (!accessToken || !userData) return;

    try {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getSubjects(
        apiLangCode,
        userData.faculty?.id || 0,
        userData.semester?.id || 0,
        userData.course?.id || 0,
        1,
        50,
        accessToken
      );
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      showToast.error(t('chat.errorLoadingSubjects') || 'Failed to load subjects', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialTypes = async (subjectId: number) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getMaterialTypes(
        subjectId,
        apiLangCode,
        1,
        50,
        accessToken
      );
      setMaterialTypes(response.data);
    } catch (error) {
      console.error('Error loading material types:', error);
      showToast.error(t('chat.errorLoadingMaterialTypes') || 'Failed to load material types', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (subjectId: number, materialTypeId: number) => {
    if (!accessToken || !userData) return;

    try {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getMaterials(
        userData.course?.id || 0,
        userData.semester?.id || 0,
        subjectId,
        materialTypeId,
        apiLangCode,
        1,
        50,
        accessToken
      );
      setMaterials(response.data);
    } catch (error) {
      console.error('Error loading materials:', error);
      showToast.error(t('chat.errorLoadingMaterials') || 'Failed to load materials', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedSubjectName = (subject: SubjectItem): string => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = subject.translations.find(t => t.lang_code === apiLangCode);
    return translation?.name || subject.translations[0]?.name || 'Unknown Subject';
  };

  const getTranslation = (material: MaterialDetail): MaterialDetailTranslation | null => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = material.translations.find(t => t.lang_code === apiLangCode);
    return translation || material.translations[0] || null;
  };

  const handleSubjectPress = async (subject: SubjectItem) => {
    setSelectedSubject(subject);
    setCurrentStep('materialTypes');
    await loadMaterialTypes(subject.id);
  };

  const handleMaterialTypePress = async (materialType: MaterialTypeItem) => {
    if (!selectedSubject) return;
    setSelectedMaterialType(materialType);
    setCurrentStep('materials');
    await loadMaterials(selectedSubject.id, materialType.material_type_id);
  };

  const handleMaterialPress = (material: MaterialDetail) => {
    const translation = getTranslation(material);
    if (translation && translation.paths && translation.paths.length > 0) {
      // Передаем текущее состояние выбора для возврата к списку материалов
      if (selectedSubject && selectedMaterialType) {
        onMaterialSelected(material, translation, {
          selectedSubject,
          selectedMaterialType,
          currentStep: 'materials'
        });
      } else {
        onMaterialSelected(material, translation);
      }
    } else {
      showToast.error(t('chat.noMaterialPath') || 'Material has no files', t('common.error'));
    }
  };

  const handleBackPress = () => {
    if (currentStep === 'materials') {
      setCurrentStep('materialTypes');
      setSelectedMaterialType(null);
      setMaterials([]);
    } else if (currentStep === 'materialTypes') {
      setCurrentStep('subjects');
      setSelectedSubject(null);
      setMaterialTypes([]);
    } else if (currentStep === 'subjects') {
      setCurrentStep('welcome');
      setSubjects([]);
    } else {
      onBack();
    }
  };

  const handleAskBySubject = async () => {
    setCurrentStep('subjects');
    await loadSubjects();
  };

  const handleAskGeneral = () => {
    if (onGeneralChatSelected) {
      onGeneralChatSelected();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentStep === 'subjects') {
        await loadSubjects();
      } else if (currentStep === 'materialTypes' && selectedSubject) {
        await loadMaterialTypes(selectedSubject.id);
      } else if (currentStep === 'materials' && selectedSubject && selectedMaterialType) {
        await loadMaterials(selectedSubject.id, selectedMaterialType.material_type_id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'welcome':
        return t('chat.welcomeTitle') || 'Привет! Я Rayan AI 👋';
      case 'subjects':
        return t('chat.selectSubject') || 'Выберите предмет';
      case 'materialTypes':
        return t('chat.selectMaterialType') || 'Выберите тип материала';
      case 'materials':
        return t('chat.selectMaterial') || 'Выберите материал';
      default:
        return '';
    }
  };

  const getStepSubtitle = (): string => {
    if (currentStep === 'welcome') {
      return t('chat.welcomeSubtitle') || 'Как я могу вам помочь?';
    }
    if (currentStep === 'materialTypes' && selectedSubject) {
      return getTranslatedSubjectName(selectedSubject);
    }
    if (currentStep === 'materials' && selectedMaterialType) {
      return selectedMaterialType.name;
    }
    return t('chat.selectMaterialForChat') || 'Для начала чата с AI';
  };

  const getStepNumber = (): string => {
    switch (currentStep) {
      case 'welcome':
        return '';
      case 'subjects':
        return '1/3';
      case 'materialTypes':
        return '2/3';
      case 'materials':
        return '3/3';
      default:
        return '';
    }
  };

  const renderWelcome = () => (
    <Animated.View
      style={[
        styles.welcomeContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.welcomeIconContainer}>
        <Ionicons name="chatbubble-ellipses" size={80} color={colors.primary} />
      </View>
      
      <TouchableOpacity
        style={styles.welcomeOption}
        onPress={handleAskBySubject}
        activeOpacity={0.7}
      >
        <View style={[styles.welcomeOptionIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="book" size={32} color={colors.primary} />
        </View>
        <View style={styles.welcomeOptionContent}>
          <Text style={styles.welcomeOptionTitle}>
            {t('chat.askBySubject') || 'Задать вопрос по предмету'}
          </Text>
          <Text style={styles.welcomeOptionDesc}>
            {t('chat.askBySubjectDesc') || 'Выберите материал для точного ответа'}
          </Text>
        </View>
        <View style={styles.welcomeOptionArrow}>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.welcomeOption}
        onPress={handleAskGeneral}
        activeOpacity={0.7}
      >
        <View style={[styles.welcomeOptionIcon, { backgroundColor: '#10B981' + '15' }]}>
          <Ionicons name="chatbubbles" size={32} color="#10B981" />
        </View>
        <View style={styles.welcomeOptionContent}>
          <Text style={styles.welcomeOptionTitle}>
            {t('chat.askGeneral') || 'Просто задать вопрос'}
          </Text>
          <Text style={styles.welcomeOptionDesc}>
            {t('chat.askGeneralDesc') || 'Общие вопросы без привязки к материалу'}
          </Text>
        </View>
        <View style={styles.welcomeOptionArrow}>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const getMaterialTypeIcon = (typeName: string): string => {
    const lowerName = typeName.toLowerCase();
    if (lowerName.includes('лекци') || lowerName.includes('lecture')) return 'school';
    if (lowerName.includes('практ') || lowerName.includes('practice')) return 'flask';
    if (lowerName.includes('лаб') || lowerName.includes('lab')) return 'hardware-chip';
    if (lowerName.includes('семинар') || lowerName.includes('seminar')) return 'people';
    if (lowerName.includes('тест') || lowerName.includes('test')) return 'clipboard';
    if (lowerName.includes('курсов') || lowerName.includes('course')) return 'layers';
    if (lowerName.includes('книг') || lowerName.includes('book')) return 'book';
    if (lowerName.includes('видео') || lowerName.includes('video')) return 'videocam';
    if (lowerName.includes('презентац') || lowerName.includes('presentation')) return 'easel';
    return 'folder';
  };

  const getMaterialTypeColor = (typeName: string): string => {
    const lowerName = typeName.toLowerCase();
    if (lowerName.includes('лекци') || lowerName.includes('lecture')) return '#3B82F6';
    if (lowerName.includes('практ') || lowerName.includes('practice')) return '#8B5CF6';
    if (lowerName.includes('лаб') || lowerName.includes('lab')) return '#EC4899';
    if (lowerName.includes('семинар') || lowerName.includes('seminar')) return '#F59E0B';
    if (lowerName.includes('тест') || lowerName.includes('test')) return '#EF4444';
    if (lowerName.includes('курсов') || lowerName.includes('course')) return '#10B981';
    if (lowerName.includes('книг') || lowerName.includes('book')) return '#6366F1';
    if (lowerName.includes('видео') || lowerName.includes('video')) return '#F97316';
    if (lowerName.includes('презентац') || lowerName.includes('presentation')) return '#06B6D4';
    return colors.primary;
  };

  // Функции определения типа материала по расширению файла (как в главном списке)
  const cleanFileUrl = (path: string): string => {
    return path.split('?')[0];
  };

  const getFileType = (path: string): string => {
    const cleanPath = cleanFileUrl(path);
    const extension = cleanPath.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  const getFileCategory = (path: string): { type: string; icon: string; color: string } => {
    const fileType = getFileType(path);
    
    // Тест
    if (fileType === 'txt') {
      return { type: t('materials.test') || 'Тест', icon: 'clipboard-outline', color: '#FF6B6B' };
    }
    
    // Аудио
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fileType)) {
      return { type: t('materials.audio') || 'Аудио', icon: 'musical-notes', color: '#9B59B6' };
    }
    
    // Видео
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'].includes(fileType)) {
      return { type: t('materials.video') || 'Видео', icon: 'videocam', color: '#E74C3C' };
    }
    
    // Изображения
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      return { type: t('materials.image') || 'Изображение', icon: 'image', color: '#3498DB' };
    }
    
    // Материал (документы)
    if (['json', 'md', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
      return { type: t('materials.material') || 'Материал', icon: 'document-text', color: '#27AE60' };
    }
    
    // По умолчанию - файл
    return { type: t('materials.file') || 'Файл', icon: 'document-outline', color: colors.textSecondary };
  };

  const renderSubjects = () => (
    <Animated.View
      style={[
        styles.gridContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {subjects.map((subject) => (
        <TouchableOpacity
          key={subject.id}
          style={styles.gridSubjectCard}
          onPress={() => handleSubjectPress(subject)}
          activeOpacity={0.7}
        >
          <View style={styles.gridSubjectIcon}>
            <Ionicons name="book" size={28} color={colors.primary} />
          </View>
          <Text style={styles.gridCardTitle} numberOfLines={2}>
            {getTranslatedSubjectName(subject)}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderMaterialTypes = () => (
    <Animated.View
      style={[
        styles.gridContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {materialTypes.map((materialType) => {
        const iconName = getMaterialTypeIcon(materialType.name);
        const iconColor = getMaterialTypeColor(materialType.name);

        return (
          <TouchableOpacity
            key={materialType.material_type_id}
            style={styles.gridMaterialTypeCard}
            onPress={() => handleMaterialTypePress(materialType)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.gridMaterialTypeIcon,
                { backgroundColor: iconColor + '15' },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={32}
                color={iconColor}
              />
            </View>
            <Text style={styles.gridCardTitle} numberOfLines={2}>
              {materialType.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );

  const renderMaterials = () => (
    <Animated.View
      style={[
        styles.cardsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {materials.map((material) => {
        const translation = getTranslation(material);
        if (!translation) return null;

        // Определяем тип материала на основе первого файла (как в главном списке)
        const firstPath = translation.paths && translation.paths.length > 0 ? translation.paths[0] : '';
        const fileCategory = firstPath ? getFileCategory(firstPath) : { type: t('materials.file') || 'Файл', icon: 'document-outline', color: colors.textSecondary };

        return (
          <TouchableOpacity
            key={material.id}
            style={styles.materialCard}
            onPress={() => handleMaterialPress(material)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.materialIconContainer,
                { backgroundColor: fileCategory.color + '15' },
              ]}
            >
              <Ionicons
                name={fileCategory.icon as any}
                size={28}
                color={fileCategory.color}
              />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.materialTypeBadge}>
                <Text style={[styles.materialTypeBadgeText, { color: fileCategory.color }]}>
                  {fileCategory.type}
                </Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {translation.name}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {translation.description}
              </Text>
              {translation.paths && translation.paths.length > 0 && (
                <View style={styles.filesCount}>
                  <Ionicons name="attach" size={14} color={colors.textSecondary} />
                  <Text style={styles.filesCountText}>
                    {translation.paths.length} {t('common.files') || 'файлов'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardArrow}>
              <Ionicons name="chatbubble-ellipses" size={24} color={fileCategory.color} />
            </View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );

  const renderContent = () => {
    if (currentStep === 'welcome') {
      return renderWelcome();
    }

    if (loading) {
      return (
        <View style={styles.skeletonsContainer}>
          {currentStep === 'subjects' && [
            <SubjectCardSkeleton key="skel-1" />,
            <SubjectCardSkeleton key="skel-2" />,
            <SubjectCardSkeleton key="skel-3" />,
            <SubjectCardSkeleton key="skel-4" />,
          ]}
          {currentStep === 'materialTypes' && [
            <MaterialTypeCardSkeleton key="skel-1" />,
            <MaterialTypeCardSkeleton key="skel-2" />,
            <MaterialTypeCardSkeleton key="skel-3" />,
          ]}
          {currentStep === 'materials' && [
            <MaterialCardSkeleton key="skel-1" hasImage={false} />,
            <MaterialCardSkeleton key="skel-2" hasImage={false} />,
            <MaterialCardSkeleton key="skel-3" hasImage={false} />,
          ]}
        </View>
      );
    }

    const isEmpty = 
      (currentStep === 'subjects' && subjects.length === 0) ||
      (currentStep === 'materialTypes' && materialTypes.length === 0) ||
      (currentStep === 'materials' && materials.length === 0);

    if (isEmpty) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="folder-open-outline"
              size={64}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.emptyStateTitle}>
            {t('common.noData') || 'Нет данных'}
          </Text>
          <Text style={styles.emptyStateText}>
            {t('chat.noItemsAvailable') || 'Элементы пока не доступны'}
          </Text>
        </View>
      );
    }

    switch (currentStep) {
      case 'subjects':
        return renderSubjects();
      case 'materialTypes':
        return renderMaterialTypes();
      case 'materials':
        return renderMaterials();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {currentStep === 'welcome' ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => setShowHistory(true)}>
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContentCentered}>
              <Text style={styles.headerTitleLarge}>Rayan AI</Text>
            </View>
            <View style={styles.stepIndicatorPlaceholder} />
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {getStepTitle()}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {getStepSubtitle()}
              </Text>
            </View>
            {getStepNumber() ? (
              <View style={styles.stepIndicator}>
                <Text style={styles.stepIndicatorText}>
                  {getStepNumber()}
                </Text>
              </View>
            ) : (
              <View style={styles.stepIndicatorPlaceholder} />
            )}
          </>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Chat History Drawer */}
      {showHistory && accessToken && (
        <ChatHistoryDrawer
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectChat={(chatId, title) => {
            setShowHistory(false);
            if (onChatSelected) {
              onChatSelected(chatId, title);
            }
          }}
          accessToken={accessToken}
          colors={{
            background: colors.background,
            text: colors.text,
            textSecondary: colors.textSecondary,
            textTertiary: colors.textTertiary,
            border: colors.border,
            primary: colors.primary,
          }}
          translations={{
            history: t('chat.history'),
            noHistory: t('chat.noHistory'),
            messages: t('chat.messages'),
            yesterday: t('common.yesterday') || 'Yesterday',
          }}
        />
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    stepIndicator: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    stepIndicatorText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    skeletonsContainer: {
      gap: 16,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    materialTypeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surface,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    materialTypeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    cardsGrid: {
      gap: 16,
    },
    cardsContainer: {
      gap: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    gridSubjectCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
      minHeight: 120,
    },
    gridSubjectIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    gridMaterialTypeCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      alignItems: 'center',
      minHeight: 120,
    },
    gridMaterialTypeIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    gridCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 18,
    },
    subjectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    subjectIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    materialTypeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    materialTypeIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    materialCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    materialIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardContent: {
      flex: 1,
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    filesCount: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    filesCountText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    cardArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepIndicatorPlaceholder: {
      width: 44,
      height: 44,
      marginLeft: 8,
    },
    headerContentCentered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleLarge: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    welcomeContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    welcomeIconContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.primary + '10',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    welcomeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 16,
      width: '100%',
    },
    welcomeOptionIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    welcomeOptionContent: {
      flex: 1,
    },
    welcomeOptionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    welcomeOptionDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    welcomeOptionArrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
