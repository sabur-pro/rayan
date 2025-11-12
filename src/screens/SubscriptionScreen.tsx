import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { TextInput } from 'react-native';
import { SubscriptionPlan } from '../types/subscription';
import { apiService } from '../services/api';
import { showToast } from '../utils/toast';

interface SubscriptionScreenProps {
  accessToken: string;
  onSubscriptionComplete: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => void;
  onBack?: () => void;
}

// Default subscription plans
const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: '1_month',
    duration: 30,
    price: 50,
    title: '1 Month',
    description: 'Perfect for trying out',
    features: ['fullAccess', 'aiAssistant', 'offlineMode'],
  },
  {
    id: '3_months',
    duration: 90,
    price: 120,
    title: '3 Months',
    description: 'Most popular choice',
    features: ['fullAccess', 'aiAssistant', 'offlineMode', 'prioritySupport'],
  },
  {
    id: '6_months',
    duration: 180,
    price: 200,
    title: '6 Months',
    description: 'Best value for money',
    features: ['fullAccess', 'aiAssistant', 'offlineMode', 'prioritySupport', 'noAds'],
  },
  {
    id: '1_year',
    duration: 365,
    price: 350,
    title: '12 Months',
    description: 'Ultimate plan',
    features: ['fullAccess', 'aiAssistant', 'offlineMode', 'prioritySupport', 'noAds'],
  },
];

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  accessToken,
  onSubscriptionComplete,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(t('subscription.error'), 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('subscription.error'), 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      showToast.error('Please select a subscription plan', t('subscription.error'));
      return;
    }

    if (!selectedImage) {
      showToast.error('Please upload payment proof', t('subscription.error'));
      return;
    }

    if (!description.trim()) {
      showToast.error('Please enter payment details', t('subscription.error'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration);
      
      // Prepare image for upload
      const imageUri = selectedImage.uri;
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const imageBlob = {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type,
      } as any;

      // Create subscription
      await apiService.createSubscription(
        {
          end_date: endDate.toISOString(),
          price: selectedPlan.price,
          description: description.trim(),
          proof_photo: imageBlob,
        },
        accessToken
      );

      showToast.success(t('subscription.subscriptionCreated'), t('common.success'));

      // Start polling for subscription status
      setIsCheckingStatus(true);
      const result = await apiService.pollSubscriptionStatus(accessToken, 30, 2000);

      if (result.status === 'active' && result.subscription) {
        // Get subscription with tokens
        const subscriptionWithTokens = await apiService.getCurrentSubscription(true, accessToken);
        
        if (subscriptionWithTokens.access_token && subscriptionWithTokens.refresh_token && subscriptionWithTokens.expires_in) {
          showToast.success(t('subscription.activeMessage'), t('subscription.active'));
          onSubscriptionComplete({
            access_token: subscriptionWithTokens.access_token,
            refresh_token: subscriptionWithTokens.refresh_token,
            expires_in: subscriptionWithTokens.expires_in,
          });
        } else {
          // Subscription is active but tokens not available yet
          Alert.alert(
            t('subscription.pending'),
            t('subscription.pendingMessage'),
            [{ text: t('common.ok'), onPress: () => {} }]
          );
        }
      } else if (result.status === 'pending') {
        Alert.alert(
          t('subscription.pending'),
          t('subscription.pendingMessage'),
          [{ text: t('common.ok'), onPress: () => {} }]
        );
      } else {
        Alert.alert(
          t('subscription.timeout'),
          t('subscription.timeoutMessage'),
          [{ text: t('common.ok'), onPress: () => {} }]
        );
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      showToast.error(
        error.message || 'Failed to create subscription',
        t('subscription.error')
      );
    } finally {
      setIsSubmitting(false);
      setIsCheckingStatus(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('subscription.checkingStatus')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('subscription.title')}</Text>
            <Text style={styles.subtitle}>{t('subscription.subtitle')}</Text>
          </View>
        </View>

        {/* Subscription Plans */}
        {!selectedPlan ? (
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>{t('subscription.selectPlan')}</Text>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan?.id === plan.id && styles.planCardSelected,
                ]}
                onPress={() => handleSelectPlan(plan)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>{plan.price} TJS</Text>
                    <Text style={styles.planDuration}>
                      / {plan.duration} {t('subscription.days')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      <Text style={styles.featureText}>{t(`subscription.${feature}`)}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={styles.selectButtonText}>{t('subscription.chooseThisPlan')}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Payment Form */
          <View style={styles.formContainer}>
            <View style={styles.selectedPlanSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('subscription.selectPlan')}:</Text>
                <Text style={styles.summaryValue}>{selectedPlan.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('market.price')}:</Text>
                <Text style={styles.summaryValue}>{selectedPlan.price} TJS</Text>
              </View>
              <TouchableOpacity
                style={styles.changePlanButton}
                onPress={() => setSelectedPlan(null)}
              >
                <Text style={styles.changePlanText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formTitle}>{t('subscription.uploadProof')}</Text>

            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                  <Text style={styles.imageSelectedText}>{t('subscription.imageSelected')}</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.imagePickerText}>{t('subscription.selectImage')}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('subscription.description')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('subscription.descriptionPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('subscription.submit')}</Text>
              )}
            </TouchableOpacity>
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
    scrollContent: {
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    plansContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    planCardSelected: {
      borderColor: colors.primary,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    planPriceContainer: {
      alignItems: 'flex-end',
    },
    planPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    planDuration: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    featuresContainer: {
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    selectButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    selectButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    formContainer: {
      padding: 16,
    },
    selectedPlanSummary: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    changePlanButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    changePlanText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    imagePickerButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    imagePreviewContainer: {
      alignItems: 'center',
    },
    imagePreview: {
      width: 200,
      height: 150,
      borderRadius: 8,
      marginBottom: 12,
    },
    imageSelectedText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    imagePickerText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    textArea: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
