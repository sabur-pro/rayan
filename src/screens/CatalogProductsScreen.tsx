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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { marketService } from '../services/marketService';
import { MarketProduct, ProductsResponse } from '../types/market';
import { showToast } from '../utils/toast';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

const { width } = Dimensions.get('window');
const GRID_H_PADDING = 16;
const GRID_GAP = 10;
const CARD_WIDTH = Math.floor((width - GRID_H_PADDING * 2 - GRID_GAP) / 2);

export const CatalogProductsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();

  const { catalogId, catalogName } = route.params as {
    catalogId: number;
    catalogName: string;
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsData, setProductsData] = useState<ProductsResponse | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<MarketProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  
  const { cart, addToCart, updateQuantity, getCartQuantity, getTotalPrice, getTotalItems } = useCart();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const tagRefs = useRef<{ [key: number]: number }>({});
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProducts();
  }, [catalogId]);

  useEffect(() => {
    if (productsData) {
      applyFilters();
    }
  }, [searchQuery, productsData]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      const data = await marketService.getProductsByCatalog(catalogId);
      const normalized: ProductsResponse = {
        products: Array.isArray((data as any)?.products) ? data.products : [],
        unique_tags: Array.isArray((data as any)?.unique_tags) ? data.unique_tags : [],
      };
      setProductsData(normalized);

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
      console.error('Error loading products:', error);
      showToast.error('Failed to load products', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [catalogId]);

  const applyFilters = () => {
    if (!productsData) return;

    let products = [...productsData.products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.name.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(products);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      // Search will be applied via useEffect
    }, 300);
  };

  const handleTagPress = (tagId: number) => {
    setSelectedTagId(tagId);
    const yOffset = tagRefs.current[tagId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset - 20, animated: true });
    }
  };

  const handleOpenCart = () => {
    (navigation as any).navigate('Cart');
  };

  const renderProductCard = (product: MarketProduct) => {
    const quantity = getCartQuantity(product.ID);

    return (
      <Animated.View
        key={product.ID}
        style={[
          styles.productCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.cardImageContainer}>
          <ImageBackground
            source={{ uri: marketService.getImageUrl(product.images?.[0] || '') }}
            style={styles.productImage}
            imageStyle={styles.productImageStyle}
            resizeMode="cover"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.cardBottom}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{product.price}</Text>
              <Text style={styles.currency}>TJS</Text>
            </View>

            {quantity === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToCart(product)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.ID, -1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(product.ID, 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTagSection = (tagId: number, tagName: string, products: MarketProduct[]) => {
    return (
      <View
        key={tagId}
        onLayout={(event) => {
          tagRefs.current[tagId] = event.nativeEvent.layout.y;
        }}
        style={styles.tagSection}
      >
        <Text style={styles.tagSectionTitle}>{tagName}</Text>
        <View style={styles.productsGrid}>
          {products.map((product) => renderProductCard(product))}
        </View>
      </View>
    );
  };

  const groupProductsByTag = () => {
    if (!productsData) return [];

    const grouped: { [key: number]: { tagName: string; products: MarketProduct[] } } = {};

    filteredProducts.forEach((product) => {
      product.tags.forEach((tag) => {
        if (!grouped[tag.id]) {
          grouped[tag.id] = { tagName: tag.name, products: [] };
        }
        if (!grouped[tag.id].products.find((p) => p.ID === product.ID)) {
          grouped[tag.id].products.push(product);
        }
      });
    });

    return Object.entries(grouped).map(([tagId, data]) => ({
      tagId: Number(tagId),
      tagName: data.tagName,
      products: data.products,
    }));
  };

  const hasTags = Boolean(
    productsData && Array.isArray(productsData.unique_tags) && productsData.unique_tags.length > 0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search and Filter */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('market.search')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

      </View>

      {/* Tags */}
      {hasTags && (
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
            {productsData?.unique_tags?.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagChip,
                  selectedTagId === tag.id && styles.tagChipActive,
                ]}
                onPress={() => handleTagPress(tag.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTagId === tag.id && styles.tagChipTextActive,
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
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
            {groupProductsByTag().map(({ tagId, tagName, products }) =>
              renderTagSection(tagId, tagName, products)
            )}

            {filteredProducts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>{t('common.noData')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Cart Button */}
          {cart.length > 0 && (
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleOpenCart}
              activeOpacity={0.8}
            >
              <View style={styles.cartPrice}>
                <Text style={styles.cartPriceValue}>{getTotalPrice()}</Text>
                <Text style={styles.cartPriceCurrency}>TJS</Text>
              </View>
              <Text style={styles.checkoutButtonText}>{t('market.checkout')}</Text>
              <View style={styles.cartInfo}>
                <Text style={styles.cartCount}>{getTotalItems()}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    backButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    tagsContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    tagsScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    tagChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border + '40',
    },
    tagChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tagChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    tagChipTextActive: {
      color: '#fff',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    tagSection: {
      marginTop: 20,
    },
    tagSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    productsGrid: {
      paddingHorizontal: GRID_H_PADDING,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
    },
    productCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    cardImageContainer: {
      width: '100%',
      height: 120,
      backgroundColor: colors.surface,
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    productImageStyle: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    cardContent: {
      padding: 10,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 18,
      minHeight: 36,
    },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flex: 1,
    },
    price: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    currency: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 2,
    },
    addButton: {
      width: 32,
      height: 32,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityControl: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 2,
      gap: 6,
    },
    quantityButton: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 6,
    },
    quantityText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
      minWidth: 20,
      textAlign: 'center',
    },
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
    checkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    cartPrice: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    cartPriceValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#fff',
    },
    cartPriceCurrency: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
      marginLeft: 2,
    },
    checkoutButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
    },
    cartInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cartCount: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
