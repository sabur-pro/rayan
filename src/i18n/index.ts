import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations
import en from './locales/en.json';
import ru from './locales/ru.json';
import tj from './locales/tj.json';
import kk from './locales/kk.json';
import uz from './locales/uz.json';
import ky from './locales/ky.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  tj: { translation: tj },
  kk: { translation: kk },
  uz: { translation: uz },
  ky: { translation: ky },
};

// Detect language synchronously
const getDetectedLanguage = () => {
  try {
    const locales = Localization.getLocales();
    const bestLanguage = locales[0]?.languageCode || 'en';
    
    // Map language codes to our supported languages
    const supportedLanguages = ['en', 'ru', 'tj', 'kk', 'uz', 'ky'];
    const detectedLanguage = supportedLanguages.includes(bestLanguage) 
      ? bestLanguage 
      : 'en';
    
    return detectedLanguage;
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};

// Initialize i18n
const i18nInstance = i18n.use(initReactI18next);

// Initialize i18n - this returns a Promise
// We call it immediately but don't block module loading
i18nInstance.init({
  resources,
  lng: getDetectedLanguage(),
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false, // Important: disable suspense to avoid rendering issues
  },
  initImmediate: false, // Initialize immediately, not async
});

export default i18nInstance;
