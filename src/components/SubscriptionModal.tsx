import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '../types/subscription';
import { formatRemainingTime, calculateTimeRemaining } from '../utils/jwt';

interface SubscriptionModalProps {
  visible: boolean;
  subscription: Subscription | null;
  freeTrialInfo: {
    hasFreeTrial: boolean;
    isExpired: boolean;
    daysRemaining: number;
    expiryDate: Date | null;
  } | null;
  onBuySubscription: () => void;
  onRefreshStatus: () => Promise<void>;
  canClose?: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  subscription,
  freeTrialInfo,
  onBuySubscription,
  onRefreshStatus,
  canClose = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine modal state
  const getModalState = () => {
    // If subscription is rejected
    if (subscription && subscription.status === 'rejected') {
      return 'rejected';
    }
    
    // If subscription is pending
    if (subscription && subscription.status === 'pending') {
      return 'pending';
    }
    
    // If has active free trial
    if (freeTrialInfo?.hasFreeTrial && !freeTrialInfo.isExpired) {
      return 'freeTrial';
    }
    
    // If free trial expired or no subscription
    return 'expired';
  };

  const modalState = getModalState();

  const renderContent = () => {
    switch (modalState) {
      case 'pending':
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={64} color={colors.warning || '#FFA500'} />
            </View>
            <Text style={styles.title}>{t('subscription.pendingTitle')}</Text>
            <Text style={styles.message}>{t('subscription.pendingMessage')}</Text>
            
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('subscription.price')}:</Text>
                <Text style={styles.infoValue}>{subscription?.price} TJS</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('subscription.status')}:</Text>
                <Text style={[styles.infoValue, styles.pendingStatus]}>
                  {t('subscription.inReview')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.refreshButton, isRefreshing && styles.buttonDisabled]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>{t('subscription.refresh')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'freeTrial':
        let d: number, h: number, m: number;
        if (freeTrialInfo!.expiryDate) {
          const result = calculateTimeRemaining(freeTrialInfo!.expiryDate.toISOString());
          d = result.days;
          h = result.hours;
          m = result.minutes;
        } else {
          d = freeTrialInfo!.daysRemaining;
          h = 0;
          m = 0;
        }
        
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="gift-outline" size={64} color={colors.success || '#4CAF50'} />
            </View>
            <Text style={styles.title}>{t('subscription.freeTrialTitle')}</Text>
            <Text style={styles.message}>
              {t('subscription.freeTrialMessage', {
                days: formatRemainingTime(freeTrialInfo!.daysRemaining),
              })}
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('subscription.daysRemaining')}:</Text>
                <View style={styles.timeRemainingContainer}>
                  <Text style={[styles.infoValue, styles.successStatus]}>
                    {d} {t('subscription.days')}
                  </Text>
                  <Text style={styles.timeRemainingSmall}>{h} {t('subscription.hours')} {m} {t('subscription.minutes')}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buyButton]}
              onPress={onBuySubscription}
            >
              <Ionicons name="card-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>{t('subscription.buySubscription')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'rejected':
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle-outline" size={64} color={colors.error || '#F44336'} />
            </View>
            <Text style={styles.title}>{t('subscription.rejectedTitle')}</Text>
            <Text style={styles.message}>{t('subscription.rejectedMessage')}</Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('subscription.price')}:</Text>
                <Text style={styles.infoValue}>{subscription?.price} TJS</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('subscription.status')}:</Text>
                <Text style={[styles.infoValue, styles.rejectedStatus]}>
                  {t('subscription.rejectedTitle')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buyButton]}
              onPress={onBuySubscription}
            >
              <Ionicons name="refresh-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>{t('subscription.resubscribe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.refreshButton, isRefreshing && styles.buttonDisabled]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>{t('subscription.refresh')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'expired':
      default:
        return (
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={colors.error || '#F44336'} />
            </View>
            <Text style={styles.title}>{t('subscription.expiredTitle')}</Text>
            <Text style={styles.message}>{t('subscription.expiredMessage')}</Text>

            <TouchableOpacity
              style={[styles.button, styles.buyButton]}
              onPress={onBuySubscription}
            >
              <Ionicons name="card-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>{t('subscription.buySubscription')}</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.fullScreenOverlay}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      width: '100%',
      maxWidth: 400,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    content: {
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    infoBox: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    pendingStatus: {
      color: colors.warning || '#FFA500',
    },
    rejectedStatus: {
      color: colors.error || '#F44336',
    },
    successStatus: {
      color: colors.success || '#4CAF50',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      width: '100%',
      gap: 8,
    },
    refreshButton: {
      backgroundColor: colors.primary,
    },
    continueButton: {
      backgroundColor: colors.success || '#4CAF50',
    },
    buyButton: {
      backgroundColor: colors.primary,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    timeRemainingContainer: {
      alignItems: 'flex-end',
    },
    timeRemainingSmall: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    fullScreenOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    },
  });
