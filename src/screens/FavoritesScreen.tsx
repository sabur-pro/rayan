import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  timestamp: Date;
}

export const FavoritesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    {
      id: '1',
      title: 'AI Chat Response',
      description: 'Helpful explanation about React Native navigation',
      category: 'AI Assistant',
      icon: 'chatbox',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '2',
      title: 'Code Snippet',
      description: 'Custom hook for theme management',
      category: 'Development',
      icon: 'code-slash',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: '3',
      title: 'Design Pattern',
      description: 'Clean architecture implementation guide',
      category: 'Architecture',
      icon: 'construct',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ]);

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
    showToast.success(
      'Item removed from favorites',
      'Removed'
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate fetching data - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const renderFavoriteItem = (item: FavoriteItem) => (
    <View key={item.id} style={styles.favoriteCard}>
      <View style={styles.favoriteHeader}>
        <View style={styles.favoriteIcon}>
          <Ionicons name={item.icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle}>{item.title}</Text>
          <Text style={styles.favoriteCategory}>{item.category}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.favoriteDescription}>{item.description}</Text>
      <Text style={styles.favoriteTime}>{formatTimestamp(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('navigation.favorites')}</Text>
        <Text style={styles.subtitle}>
          {favorites.length} item{favorites.length !== 1 ? 's' : ''}
        </Text>
      </View>

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
          favorites.map(renderFavoriteItem)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color={colors.textTertiary} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyDescription}>
              Items you mark as favorites will appear here
            </Text>
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
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    scrollView: {
      flex: 1,
    },
    content: {
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
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
