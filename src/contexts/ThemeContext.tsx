import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('[ThemeContext Module] Loading...');

export type ThemeMode = 'light' | 'dark' | 'reading' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'reading';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Verify Context was created properly
if (!ThemeContext) {
  console.error('[ThemeContext] CRITICAL: createContext returned undefined!');
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.error('useTheme: ThemeContext is undefined. Make sure ThemeProvider is properly mounted.');
    console.error('useTheme: Stack trace:', new Error().stack);
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  console.log('[ThemeProvider] Initializing...', {
    ThemeContextExists: !!ThemeContext,
    ThemeContextProvider: !!ThemeContext?.Provider,
  });
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  const theme = themeMode === 'system' 
    ? (systemTheme || 'light') 
    : (themeMode as 'light' | 'dark' | 'reading');

  useEffect(() => {
    loadThemeMode();
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'reading', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ theme, themeMode, setThemeMode }),
    [theme, themeMode, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

console.log('[ThemeContext Module] Loaded successfully', {
  ThemeProvider: !!ThemeProvider,
  useTheme: !!useTheme,
});
