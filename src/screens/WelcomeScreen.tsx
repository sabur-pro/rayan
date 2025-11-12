import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, SupportedLanguage } from '../contexts/LanguageContext';
import { getThemeColors } from '../theme/colors';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const languages = [
  { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
  { code: 'ru' as SupportedLanguage, name: 'Русский', flag: '🇷🇺' },
  { code: 'tj' as SupportedLanguage, name: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'kk' as SupportedLanguage, name: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz' as SupportedLanguage, name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'ky' as SupportedLanguage, name: 'Кыргызча', flag: '🇰🇬' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentLanguage, setLanguage } = useLanguage();
  
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const handleLanguageSelect = useCallback((language: SupportedLanguage) => {
    console.log('[WelcomeScreen] Language selected:', language);
    setLanguage(language);
  }, [setLanguage]);

  const handleNext = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon placeholder */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
        </View>

        {/* Welcome text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        {/* Language selection */}
        <View style={styles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                currentLanguage === lang.code && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageText,
                  currentLanguage === lang.code && styles.languageTextActive,
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next button
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{t('welcome.next')}</Text>
        </TouchableOpacity> */}
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 48,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    logoText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    textContainer: {
      marginBottom: 48,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    languageContainer: {
      width: '100%',
      marginBottom: 48,
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    languageButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 16,
    },
    languageText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    languageTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    nextButton: {
      width: '100%',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
