import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  BackHandler,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { academicService } from '../services/academicService';
import { MaterialDetail, MaterialDetailTranslation } from '../types/academic';
import { showToast } from '../utils/toast';
import { MaterialCardSkeleton } from '../components/Skeleton';

interface MaterialsScreenProps {
  courseId: number;
  semesterId: number;
  subjectId: number;
  materialTypeId: number;
  materialTypeName: string;
  subjectName: string;
  onBack: () => void;
  onMaterialPress: (material: MaterialDetail, translation: MaterialDetailTranslation) => void;
}

export const MaterialsScreen: React.FC<MaterialsScreenProps> = ({
  courseId,
  semesterId,
  subjectId,
  materialTypeId,
  materialTypeName,
  subjectName,
  onBack,
  onMaterialPress,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [materials, setMaterials] = useState<MaterialDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const headerSlideAnim = React.useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    loadMaterials();
    // Animate header on mount
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [subjectId, materialTypeId, currentLanguage]);

  useEffect(() => {
    if (!loading && materials.length > 0) {
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
  }, [loading, materials]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

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

  const loadMaterials = async (isRefreshing: boolean = false) => {
    if (!accessToken) return;

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
        // Reset content animations (but not header)
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      }
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getMaterials(
        courseId,
        semesterId,
        subjectId,
        materialTypeId,
        apiLangCode,
        1,
        10,
        accessToken
      );
      setMaterials(response.data);
    } catch (error) {
      console.error('Error loading materials:', error);
      showToast.error('Failed to load materials', t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadMaterials(true);
  };

  const getTranslation = (material: MaterialDetail): MaterialDetailTranslation | null => {
    const apiLangCode = getLangCodeForAPI(currentLanguage);
    const translation = material.translations.find(t => t.lang_code === apiLangCode);
    return translation || material.translations[0] || null;
  };

  const getFileType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  // Определяем категорию файла
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

  const getFileIcon = (path: string): string => {
    const category = getFileCategory(path);
    return category.icon;
  };

  const isImageFile = (path: string): boolean => {
    const fileType = getFileType(path);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
  };

  const renderMaterialCard = (material: MaterialDetail) => {
    const translation = getTranslation(material);
    if (!translation) return null;

    const paths = translation.paths || [];
    const hasImages = paths.some(path => isImageFile(path));
    const firstImage = paths.find(path => isImageFile(path));

    return (
      <TouchableOpacity
        key={material.id}
        style={styles.materialCard}
        onPress={() => onMaterialPress(material, translation)}
        activeOpacity={0.7}
      >
        {firstImage && (
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: firstImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <View style={styles.fileCountBadge}>
                <Ionicons name="attach" size={14} color="#FFF" />
                <Text style={styles.fileCountText}>{paths.length}</Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            {!firstImage && paths.length > 0 && (
              <View style={styles.cardIconContainer}>
                <Ionicons
                  name={getFileIcon(paths[0]) as any}
                  size={28}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {translation.name}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {translation.description}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.filesPreview}>
              {paths.slice(0, 3).map((path, index) => {
                const category = getFileCategory(path);
                return (
                  <View key={index} style={[styles.fileTag, { backgroundColor: category.color + '15' }]}>
                    <Ionicons
                      name={category.icon as any}
                      size={14}
                      color={category.color}
                    />
                    <Text style={[styles.fileTagText, { color: category.color }]}>
                      {category.type}
                    </Text>
                  </View>
                );
              })}
              {paths.length > 3 && (
                <View style={styles.moreFilesContainer}>
                  <Text style={styles.moreFiles}>+{paths.length - 3}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {materialTypeName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subjectName}
          </Text>
        </View>
      </Animated.View>

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
        {loading && !refreshing ? (
          <View style={styles.skeletonsContainer}>
            {[1, 2, 3].map((key) => (
              <MaterialCardSkeleton key={key} hasImage={key % 2 === 0} />
            ))}
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="document-outline"
                size={64}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyStateTitle}>
              {t('common.noData') || 'Нет данных'}
            </Text>
            <Text style={styles.emptyStateText}>
              Материалы для этого типа пока не доступны
            </Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.cardsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {materials.map(material => renderMaterialCard(material))}
          </Animated.View>
        )}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
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
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    skeletonsContainer: {
      gap: 0,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
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
    cardsContainer: {
      gap: 16,
    },
    materialCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
      marginBottom: 20,
    },
    cardImageContainer: {
      width: '100%',
      height: 180,
      position: 'relative',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.1)',
      padding: 12,
    },
    fileCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 4,
    },
    fileCountText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    cardContent: {
      padding: 20,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    cardIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filesPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      flexWrap: 'wrap',
      gap: 10,
    },
    fileTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      gap: 6,
    },
    fileTagText: {
      fontSize: 12,
      fontWeight: '700',
    },
    moreFilesContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    moreFiles: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    cardArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
  });
