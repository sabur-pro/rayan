import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../theme/colors';
import { MaterialViewerScreen } from './MaterialViewerScreen';
import { academicService } from '../services/academicService';
import { FavouriteItem, MaterialDetail, MaterialDetailTranslation } from '../types/academic';
import { showToast } from '../utils/toast';
import { Skeleton } from '../components/Skeleton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '../navigation/AppNavigator';

export const FavoritesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ProfileStackParamList, 'Favorites'>>();
  const fromScreen = route.params?.from || 'profile'; // по умолчанию profile

  const defaultTabBarStyle = {
    display: 'flex' as const,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  };

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavouriteItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<MaterialDetailTranslation | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const getLangCodeForAPI = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      en: 'en',
      ru: 'ru',
      tj: 'tj',
      kk: 'kz',
      uz: 'uz',
      ky: 'kg',
    };
    return langMap[lang] || 'en';
  };

  const cleanFileUrl = (url: string): string => {
    // Remove query parameters like ?favourite_id=5
    return url.split('?')[0];
  };

  const loadFavourites = async (isRefreshing: boolean = false) => {
    if (!accessToken) return;

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const apiLangCode = getLangCodeForAPI(currentLanguage);
      const data = await academicService.getFavourites(apiLangCode, accessToken);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favourites:', error);
      showToast.error(
        t('favourites.loadError') || 'Failed to load favourites',
        t('common.error') || 'Error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavourites();
  }, [currentLanguage]);

  const handleBack = useCallback(() => {
    if (fromScreen === 'home') {
      // Возвращаемся на главный экран
      navigation.navigate('Home' as never);
    } else {
      // Возвращаемся в профиль
      navigation.goBack();
    }
  }, [fromScreen, navigation]);

  // Обработка hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedMaterial) {
        handleCloseMaterial();
        return true;
      }
      handleBack();
      return true;
    });

    return () => backHandler.remove();
  }, [selectedMaterial]);

  // Восстанавливаем tab bar при размонтировании компонента
  useEffect(() => {
    return () => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: defaultTabBarStyle,
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && favorites.length > 0) {
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
  }, [loading, favorites]);

  const handleRemoveFavorite = async (favouriteId: number) => {
    if (!accessToken) return;

    showToast.confirm(
      t('favourites.removeConfirm') || 'Are you sure you want to remove this item from your favorites?',
      t('favourites.removeTitle') || 'Remove Favorite',
      async () => {
        try {
          await academicService.removeFavourite(favouriteId, accessToken);
          setFavorites(prev => prev.filter(item => item.id !== favouriteId));
          showToast.success(
            t('favourites.removed') || 'Item removed from favorites',
            t('common.success') || 'Success'
          );
        } catch (error) {
          console.error('Error removing favourite:', error);
          showToast.error(
            t('favourites.removeError') || 'Failed to remove favourite',
            t('common.error') || 'Error'
          );
        }
      },
      () => {
        // User cancelled - do nothing
      }
    );
  };

  const onRefresh = useCallback(() => {
    loadFavourites(true);
  }, [currentLanguage]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${t('common.daysAgo') || 'days ago'}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${t('common.hoursAgo') || 'hours ago'}`;
    } else {
      return t('common.justNow') || 'Just now';
    }
  };

  const isMaterialDeleted = (item: FavouriteItem): boolean => {
    return !item.material || !item.material.translation || !item.material.material_type?.translation;
  };

  const getFileIcon = (paths?: string[]): string => {
    if (!paths || paths.length === 0) return 'document-outline';
    
    const firstPath = paths[0];
    const extension = firstPath.split('.').pop()?.toLowerCase();
    
    if (!extension) return 'document-outline';
    
    if (extension === 'txt') return 'clipboard-outline';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return 'musical-notes';
    if (['mp4', 'avi', 'mov'].includes(extension)) return 'videocam';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['json', 'md', 'pdf', 'doc'].includes(extension)) return 'document-text';
    
    return 'document-outline';
  };

  const convertToMaterialDetail = (favMaterial: FavouriteItem['material']): MaterialDetail => {
    return {
      id: favMaterial.id,
      course: { 
        id: favMaterial.course_id, 
        number: 0,
        degree: { id: 0 }
      },
      semester: { id: favMaterial.semester_id, number: 0 },
      material_type: {
        id: favMaterial.material_type_id,
        lang_code: favMaterial.material_type.translation.lang_code,
        name: favMaterial.material_type.translation.name,
        description: favMaterial.material_type.translation.description,
        status: favMaterial.material_type.translation.status,
      },
      created_at: favMaterial.created_at,
      updated_at: favMaterial.updated_at,
      translations: [{
        lang_code: favMaterial.translation.lang_code,
        name: favMaterial.translation.name,
        description: favMaterial.translation.description,
        paths: favMaterial.translation.paths,
        status: favMaterial.translation.status,
      }],
      subjects: [],
      is_favourite: true,
      favourite_id: undefined,
    };
  };

  const handleOpenMaterial = (item: FavouriteItem) => {
    // Check if material still exists
    if (isMaterialDeleted(item)) {
      showToast.confirm(
        t('favourites.materialDeleted') || 'This material may have been deleted. Would you like to remove it from favorites?',
        t('favourites.materialNotFound') || 'Material Not Found',
        async () => {
          // User confirmed - remove from favorites
          try {
            await academicService.removeFavourite(item.id, accessToken!);
            setFavorites(prev => prev.filter(fav => fav.id !== item.id));
            showToast.success(
              t('favourites.removed') || 'Item removed from favorites',
              t('common.success') || 'Success'
            );
          } catch (error) {
            console.error('Error removing deleted material from favourites:', error);
            showToast.error(
              t('favourites.removeError') || 'Failed to remove favourite',
              t('common.error') || 'Error'
            );
          }
        },
        () => {
          // User cancelled - do nothing
        }
      );
      return;
    }

    const materialDetail = convertToMaterialDetail(item.material);
    setSelectedMaterial(materialDetail);
    setSelectedTranslation(item.material.translation);
  };

  const handleCloseMaterial = () => {
    setSelectedMaterial(null);
    setSelectedTranslation(null);
    // Показываем tab bar обратно
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: defaultTabBarStyle,
      });
    }
  };

  const handleOpenMaterialWithTabHide = (item: FavouriteItem) => {
    // Скрываем tab bar при открытии материала
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
    handleOpenMaterial(item);
  };

  const renderFavoriteItem = (item: FavouriteItem, index: number) => {
    const isDeleted = isMaterialDeleted(item);

    return (
      <View key={item.id} style={{ marginBottom: 16 }}>
        <TouchableOpacity 
          style={[styles.favoriteCard, isDeleted && styles.deletedCard]}
          activeOpacity={0.7}
          onPress={() => handleOpenMaterialWithTabHide(item)}
        >
      <View style={styles.favoriteHeader}>
        <View style={[styles.favoriteIcon, isDeleted && styles.deletedIcon]}>
          <Ionicons 
            name={isDeleted ? 'alert-circle-outline' : getFileIcon(item.material?.translation?.paths) as any} 
            size={20} 
            color={isDeleted ? colors.error : colors.primary} 
          />
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle}>
            {isDeleted 
              ? (t('favourites.deletedMaterial') || 'Deleted Material') 
              : item.material.translation.name}
          </Text>
          <Text style={[styles.favoriteCategory, isDeleted && styles.deletedText]}>
            {isDeleted 
              ? (t('favourites.notAvailable') || 'Not available')
              : item.material.material_type.translation.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(item.id);
          }}
        >
          <Ionicons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
      {!isDeleted && (
        <>
          <Text style={styles.favoriteDescription}>
            {item.material.translation.description}
          </Text>
          {item.material.translation.paths && item.material.translation.paths.length > 0 && (
            <View style={styles.filesContainer}>
              <Ionicons name="attach" size={14} color={colors.textSecondary} />
              <Text style={styles.filesCount}>
                {item.material.translation.paths.length} {t('common.files') || 'files'}
              </Text>
            </View>
          )}
        </>
      )}
      {isDeleted && (
        <View style={styles.deletedNotice}>
          <Ionicons name="information-circle" size={16} color={colors.error} />
          <Text style={styles.deletedNoticeText}>
            {t('favourites.materialMayBeDeleted') || 'This material may have been deleted. Tap to remove from favorites.'}
          </Text>
        </View>
      )}
        <Text style={styles.favoriteTime}>{formatTimestamp(item.created_at)}</Text>
      </TouchableOpacity>
      </View>
    );
  };

  // Если выбран материал, показываем viewer
  if (selectedMaterial && selectedTranslation) {
    return (
      <MaterialViewerScreen
        material={selectedMaterial}
        translation={selectedTranslation}
        onBack={handleCloseMaterial}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('favourites.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        {!loading && (
          <Text style={styles.subtitle}>
            {favorites.length} {favorites.length === 1 ? t('common.item') : t('common.items')}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonsContainer}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <Skeleton width="100%" height={120} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : (
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
            />
          }
        >
          {favorites.length > 0 ? (
            favorites.map((item, index) => renderFavoriteItem(item, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {t('favourites.empty') || 'No favorites yet'}
              </Text>
              <Text style={styles.emptyDescription}>
                {t('favourites.emptyMessage') || 'Items you mark as favorites will appear here'}
              </Text>
            </View>
          )}
        </ScrollView>
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
      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholder: {
      width: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    skeletonsContainer: {
      padding: 20,
    },
    favoriteCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    favoriteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    favoriteIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    favoriteInfo: {
      flex: 1,
    },
    favoriteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    favoriteCategory: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    removeButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    favoriteTime: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    emptyDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    filesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    filesCount: {
      fontSize: 12,
      color: colors.textSecondary,
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
    skeletonCard: {
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    deletedCard: {
      opacity: 0.7,
      borderColor: colors.error + '40',
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    deletedIcon: {
      backgroundColor: colors.error + '20',
    },
    deletedText: {
      color: colors.error,
    },
    deletedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.error + '10',
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
      gap: 8,
    },
    deletedNoticeText: {
      flex: 1,
      fontSize: 12,
      color: colors.error,
      lineHeight: 16,
    },
  });
