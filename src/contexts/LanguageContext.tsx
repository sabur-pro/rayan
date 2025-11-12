import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

console.log('[LanguageContext Module] Loading...');

export type SupportedLanguage = 'en' | 'ru' | 'tj' | 'kk' | 'uz' | 'ky';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  isLanguageSelected: boolean;
  resetLanguageSelection: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Verify Context was created properly
if (!LanguageContext) {
  console.error('[LanguageContext] CRITICAL: createContext returned undefined!');
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    console.error('useLanguage: LanguageContext is undefined. Make sure LanguageProvider is properly mounted.');
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  console.log('[LanguageProvider] Initializing...');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      // Wait for i18n to be ready
      if (i18n.isInitialized) {
        const detectedLang = (i18n.language as SupportedLanguage) || 'en';
        setCurrentLanguage(detectedLang);
      } else {
        // Fallback to 'en' if i18n is not initialized
        setCurrentLanguage('en');
      }

      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const languageSelected = await AsyncStorage.getItem('isLanguageSelected');
      
      if (savedLanguage && ['en', 'ru', 'tj', 'kk', 'uz', 'ky'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as SupportedLanguage);
        if (i18n.isInitialized) {
          await i18n.changeLanguage(savedLanguage);
        }
      }
      
      setIsLanguageSelected(languageSelected === 'true');
      setIsReady(true);
    } catch (error) {
      console.error('Error loading language settings:', error);
      setIsReady(true);
    }
  };

  const setLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      console.log('[LanguageContext] Setting language to:', language);
      
      // Update state first
      setCurrentLanguage(language);
      setIsLanguageSelected(true);
      
      // Save to storage
      await AsyncStorage.setItem('selectedLanguage', language);
      await AsyncStorage.setItem('isLanguageSelected', 'true');
      
      // Change i18n language (this might trigger a re-render)
      if (i18n.isInitialized) {
        console.log('[LanguageContext] Changing i18n language...');
        await i18n.changeLanguage(language);
        console.log('[LanguageContext] i18n language changed successfully');
      }
    } catch (error) {
      console.error('Error saving language settings:', error);
    }
  }, []);

  const resetLanguageSelection = useCallback(async () => {
    try {
      setIsLanguageSelected(false);
      await AsyncStorage.setItem('isLanguageSelected', 'false');
    } catch (error) {
      console.error('Error resetting language selection:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      isLanguageSelected,
      resetLanguageSelection,
    }),
    [currentLanguage, setLanguage, isLanguageSelected, resetLanguageSelection]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

console.log('[LanguageContext Module] Loaded successfully', {
  LanguageProvider: !!LanguageProvider,
  useLanguage: !!useLanguage,
});
