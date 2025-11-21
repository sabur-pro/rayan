import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { marketService } from '../services/marketService';
import { showToast } from '../utils/toast';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const CartScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);
  const navigation = useNavigation();
  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();

  const handleCheckout = () => {
    showToast.success(t('market.orderPlaced'), t('market.cart'));
    clearCart();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('market.cart')}</Text>
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCart}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('market.emptyCart')}</Text>
          <Text style={styles.emptySubtitle}>{t('market.emptyCartDescription')}</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{t('market.continueShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {cart.map((item) => (
              <View key={item.product.ID} style={styles.cartItem}>
                <View style={styles.itemImage}>
                  <ImageBackground
                    source={{ uri: marketService.getImageUrl(item.product.images[0]) }}
                    style={styles.image}
                    imageStyle={styles.imageStyle}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.itemBottom}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.itemPrice}>{item.product.price}</Text>
                      <Text style={styles.currency}>TJS</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.itemControls}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.product.ID)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>

                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product.ID, -1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product.ID, 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <View style={styles.checkoutPrice}>
              <Text style={styles.checkoutPriceValue}>{getTotalPrice()}</Text>
              <Text style={styles.checkoutPriceCurrency}>TJS</Text>
            </View>
            <Text style={styles.checkoutText}>{t('market.checkout')}</Text>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>
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
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 12,
    },
    clearButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    continueButton: {
      paddingHorizontal: 32,
      paddingVertical: 14,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    cartItem: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border + '20',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageStyle: {
      borderRadius: 12,
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'space-between',
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    itemBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    itemPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    currency: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 2,
    },
    itemControls: {
      marginLeft: 8,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    removeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.background,
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
    checkoutPrice: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    checkoutPriceValue: {
      fontSize: 20,
      fontWeight: '800',
      color: '#fff',
    },
    checkoutPriceCurrency: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
      marginLeft: 3,
    },
    checkoutText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
    },
  });
