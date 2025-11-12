import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { MaterialTypeItem } from '../types/academic';
import { showToast } from '../utils/toast';

interface MaterialTypesScreenProps {
  courseId: number;
  semesterId: number;
  subjectId: number;
  subjectName: string;
  onBack: () => void;
  onMaterialTypePress: (materialTypeId: number, materialTypeName: string) => void;
}

export const MaterialTypesScreen: React.FC<MaterialTypesScreenProps> = ({
  courseId,
  semesterId,
  subjectId,
  subjectName,
  onBack,
  onMaterialTypePress,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [materialTypes, setMaterialTypes] = useState<MaterialTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterialTypes();
  }, [subjectId, currentLanguage]);

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

  const loadMaterialTypes = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const response = await academicService.getMaterialTypes(
        subjectId,
        apiLangCode,
        1,
        10,
        accessToken
      );
      setMaterialTypes(response.data);
    } catch (error) {
      console.error('Error loading material types:', error);
      showToast.error('Failed to load material types', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialTypePress = (materialType: MaterialTypeItem) => {
    onMaterialTypePress(materialType.material_type_id, materialType.name);
  };

  const getIconForMaterialType = (name: string): string => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('лекция') || lowercaseName.includes('lecture')) {
      return 'book-outline';
    } else if (lowercaseName.includes('конспект') || lowercaseName.includes('notes')) {
      return 'document-text-outline';
    } else if (lowercaseName.includes('видео') || lowercaseName.includes('video')) {
      return 'videocam-outline';
    } else if (lowercaseName.includes('тест') || lowercaseName.includes('test')) {
      return 'clipboard-outline';
    } else if (lowercaseName.includes('практ') || lowercaseName.includes('practice')) {
      return 'code-slash-outline';
    } else {
      return 'folder-outline';
    }
  };

  const getColorForIndex = (index: number): string => {
    const colorShades = [
      colors.primary,
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
    ];
    return colorShades[index % colorShades.length];
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
            {subjectName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('common.materialTypes') || 'Типы материалов'}
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
        ) : materialTypes.length === 0 ? (
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
              Материалы для этого предмета пока не доступны
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {materialTypes.map((materialType, index) => (
              <TouchableOpacity
                key={materialType.material_type_id}
                style={styles.materialCard}
                onPress={() => handleMaterialTypePress(materialType)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: getColorForIndex(index) + '15' },
                  ]}
                >
                  <Ionicons
                    name={getIconForMaterialType(materialType.name) as any}
                    size={32}
                    color={getColorForIndex(index)}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {materialType.name}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {materialType.description}
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>
            ))}
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
    cardIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardContent: {
      flex: 1,
      marginRight: 12,
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
    cardArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
