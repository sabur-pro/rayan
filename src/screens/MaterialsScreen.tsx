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

  useEffect(() => {
    loadMaterials();
  }, [subjectId, materialTypeId, currentLanguage]);

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

  const loadMaterials = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
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
    }
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

  const getFileIcon = (path: string): string => {
    const fileType = getFileType(path);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return 'image-outline';
    } else if (fileType === 'pdf') {
      return 'document-text-outline';
    } else if (['ppt', 'pptx'].includes(fileType)) {
      return 'easel-outline';
    } else if (['doc', 'docx', 'txt'].includes(fileType)) {
      return 'document-outline';
    } else if (['mp4', 'avi', 'mov'].includes(fileType)) {
      return 'videocam-outline';
    } else if (['mp3', 'wav'].includes(fileType)) {
      return 'musical-notes-outline';
    }
    return 'attach-outline';
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
              {paths.slice(0, 3).map((path, index) => (
                <View key={index} style={styles.fileTag}>
                  <Ionicons
                    name={getFileIcon(path) as any}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.fileTagText}>
                    {getFileType(path).toUpperCase()}
                  </Text>
                </View>
              ))}
              {paths.length > 3 && (
                <Text style={styles.moreFiles}>+{paths.length - 3}</Text>
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
      <View style={styles.header}>
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          <View style={styles.cardsContainer}>
            {materials.map(material => renderMaterialCard(material))}
          </View>
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
      paddingVertical: 16,
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
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
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
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
      gap: 8,
    },
    fileTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      gap: 4,
    },
    fileTagText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    moreFiles: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    cardArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
  });
