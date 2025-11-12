import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { showToast } from '../utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

interface LoginScreenProps {
  onLogin: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => void;
  onNavigateToRegister: () => void;
  onBack: () => void;
  onVerificationNeeded: (txnId: string, phone: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
  onBack,
  onVerificationNeeded,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      showToast.error('Please fill in all fields', t('common.error'));
      return;
    }

    if (!isValidPhone(phone)) {
      showToast.error('Please enter a valid phone number', t('common.error'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.signIn({
        phone: phone.trim(),
        password: password.trim(),
      });

      // Check if response contains access_token (login successful)
      if ('access_token' in response) {
        onLogin(response);
      } else {
        // Verification needed
        onVerificationNeeded(response.txn_id, phone.trim());
      }
    } catch (error: any) {
      showToast.error(
        error.message || 'Login failed. Please try again.',
        t('common.error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidPhone = (phone: string) => {
    // Simple phone validation - adjust based on your requirements
    const phoneRegex = /^\d{9,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('auth.backToLanguage')}</Text>
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>R</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('auth.login')}</Text>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phone')}
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('auth.loginButton')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{t('auth.dontHaveAccount')}</Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.registerLink}>{t('auth.register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      marginBottom: 24,
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
    headerTitle: {
      fontSize: 14,
      color: colors.textSecondary,
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
      marginBottom: 32,
    },
    form: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginRight: 4,
    },
    registerLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
