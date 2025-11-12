import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { marketService } from '../services/marketService';
import { MarketResponse, GroupedCatalogs, MarketCatalog } from '../types/market';
import { showToast } from '../utils/toast';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

const { width } = Dimensions.get('window');
// Grid layout constants
const GRID_H_PADDING = 16; // categoryGrid paddingHorizontal
const GRID_GAP = 12;       // space between two cards
const CARD_WIDTH = Math.floor((width - GRID_H_PADDING * 2 - GRID_GAP) / 2);

export const MarketScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);
  const navigation = useNavigation();
  const { cart, getTotalItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketData, setMarketData] = useState<MarketResponse | null>(null);
  const [groupedCatalogs, setGroupedCatalogs] = useState<GroupedCatalogs>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const skeletonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMarketData();
  }, []);

  useEffect(() => {
    // Skeleton pulse animation
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      const data = await marketService.getCatalogs();
      
      // Normalize data - replace null with empty arrays
      const normalizedData: MarketResponse = {
        catalogs: Array.isArray(data?.catalogs) ? data.catalogs : [],
        unique_tags: Array.isArray(data?.unique_tags) ? data.unique_tags : [],
      };
      
      setMarketData(normalizedData);

      // Group catalogs by tags
      const grouped: GroupedCatalogs = {};
      
      // Only process if we have catalogs
      if (normalizedData.catalogs.length > 0) {
        normalizedData.catalogs.forEach((catalog) => {
          catalog.tags.forEach((tag) => {
            if (!grouped[tag.name]) {
              grouped[tag.name] = {
                tag,
                catalogs: [],
              };
            }
            grouped[tag.name].catalogs.push(catalog);
          });
        });
      }
      
      setGroupedCatalogs(grouped);

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
    } catch (error) {
      console.error('Error loading market data:', error);
      // Don't show error toast if catalogs are just empty
      // Set empty data to show "in development" message
      setMarketData({ catalogs: [], unique_tags: [] });
      setGroupedCatalogs({});
      
      // Still animate in the content
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  }, []);

  const handleCatalogPress = (catalog: MarketCatalog) => {
    (navigation as any).navigate('CatalogProducts', {
      catalogId: catalog.ID,
      catalogName: catalog.name,
    });
  };

  const renderSkeleton = () => {
    const skeletonOpacity = skeletonAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonHeader}>
          <Animated.View
            style={[
              styles.skeletonBox,
              { width: 120, height: 24, opacity: skeletonOpacity },
            ]}
          />
        </View>
        <View style={styles.skeletonTags}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.skeletonBox,
                styles.skeletonTag,
                { opacity: skeletonOpacity },
              ]}
            />
          ))}
        </View>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.skeletonBox,
                styles.skeletonCard,
                { opacity: skeletonOpacity },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderCatalogCard = (catalog: MarketCatalog) => {
    return (
      <TouchableOpacity
        style={styles.catalogCard}
        onPress={() => handleCatalogPress(catalog)}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          <ImageBackground
            source={{ uri: marketService.getImageUrl(catalog.image) }}
            style={styles.catalogImage}
            imageStyle={styles.catalogImageStyle}
            resizeMode="contain"
          >
            <View style={styles.catalogOverlay} />
          </ImageBackground>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.catalogName} numberOfLines={2}>
            {catalog.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (tagName: string, catalogs: MarketCatalog[]) => {
    return (
      <Animated.View
        key={tagName}
        style={[
          styles.categorySection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.categoryTitle}>{tagName}</Text>
        <View style={styles.categoryGrid}>
          {catalogs.map((catalog) => (
            <React.Fragment key={catalog.ID}>
              {renderCatalogCard(catalog)}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        renderSkeleton()
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
          {/* Header */}
          <View style={styles.headerWrap}>
            <View style={styles.headerBadge}>
              <Ionicons name="storefront" size={18} color="#fff" />
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.mainTitle}>{t('market.title')}</Text>
            </View>
          </View>

          {/* Category Sections */}
          {marketData && Object.keys(groupedCatalogs).length > 0 ? (
            Object.entries(groupedCatalogs).map(([tagName, { catalogs }]) =>
              renderCategorySection(tagName, catalogs)
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="storefront-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyStateText}>
                {t('market.inDevelopment')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => (navigation as any).navigate('Cart')}
          activeOpacity={0.9}
        >
          <Ionicons name="cart" size={26} color="#fff" />
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>{getTotalItems()}</Text>
          </View>
        </TouchableOpacity>
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
      paddingTop: 20,
      paddingBottom: 24,
    },
    // Header styles
    headerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    headerBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerTextBlock: {
      flex: 1,
    },
    mainTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    mainSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    // Skeleton styles
    skeletonContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    skeletonHeader: {
      marginBottom: 16,
    },
    skeletonBox: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      opacity: 0.6,
    },
    skeletonTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    skeletonTag: {
      width: 80,
      height: 36,
      borderRadius: 18,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    skeletonCard: {
      width: CARD_WIDTH,
      height: 180,
      borderRadius: 16,
    },
    // Category sections
    categorySection: {
      marginBottom: 32,
    },
    categoryTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    categoryGrid: {
      paddingHorizontal: GRID_H_PADDING,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    // Catalog cards - marketplace style
    catalogCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      borderWidth: 1,
      borderColor: colors.border + '40',
      marginBottom: GRID_GAP,
    },
    cardImageContainer: {
      width: '100%',
      height: 140,
      backgroundColor: colors.surface,
    },
    catalogImage: {
      width: '100%',
      height: '100%',
    },
    catalogImageStyle: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    catalogOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primary + '10',
    },
    cardInfo: {
      padding: 16,
    },
    catalogName: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
    },
    // Empty state
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    // Floating cart button
    floatingCartButton: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    floatingCartBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: colors.background,
    },
    floatingCartBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#fff',
    },
  });
