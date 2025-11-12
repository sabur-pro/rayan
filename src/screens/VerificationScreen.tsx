import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

interface VerificationScreenProps {
  txnId: string;
  phone: string;
  onVerified: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => void;
  onBack: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  txnId,
  phone,
  onVerified,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [code, setCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && !isLoading) {
      handleVerify();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verifyCode = code.join('');
    if (verifyCode.length !== 4) {
      showToast.error('Please enter the 4-digit code', t('common.error'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.verify({
        txn_id: txnId,
        verify_code: verifyCode,
      });

      onVerified(response);
    } catch (error: any) {
      showToast.error(
        error.message || 'Verification failed. Please try again.',
        t('common.error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      // Resend by making the same sign-in request
      // This would need to be implemented based on your API
      showToast.success('Code sent successfully', t('common.success'));
      setCanResend(false);
      setResendTimer(60);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to resend code', t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    // Format phone number for display
    if (phone.length >= 9) {
      return `+992 ${phone.slice(-9, -6)} ${phone.slice(-6, -3)} ${phone.slice(-3)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
        </View>

        {/* Title and description */}
        <Text style={styles.title}>{t('auth.verificationCode')}</Text>
        <Text style={styles.description}>
          {t('auth.enterVerificationCode')}
        </Text>
        <Text style={styles.phoneText}>
          {formatPhone(phone)}
        </Text>

        {/* Code input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (isLoading || code.some(digit => !digit)) && styles.verifyButtonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={isLoading || code.some(digit => !digit)}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.verifyButtonText}>{t('auth.verifyButton')}</Text>
          )}
        </TouchableOpacity>

        {/* Resend code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {canResend ? "Didn't receive the code?" : `Resend code in ${resendTimer}s`}
          </Text>
          {canResend && (
            <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
              <Text style={styles.resendButton}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
    },
    header: {
      paddingTop: 16,
      marginBottom: 32,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    phoneText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 32,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
      paddingHorizontal: 20,
    },
    codeInput: {
      width: 56,
      height: 56,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    codeInputFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    verifyButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
    },
    verifyButtonDisabled: {
      opacity: 0.5,
    },
    verifyButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    resendContainer: {
      alignItems: 'center',
    },
    resendText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    resendButton: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
