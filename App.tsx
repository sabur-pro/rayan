// Polyfills - MUST be imported FIRST before anything else
import './src/utils/polyfills';

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { ThemedToast } from './src/components/ThemedToast';

// i18n - import FIRST to ensure it's initialized before anything else
import i18n from './src/i18n';

// Contexts - import directly from individual files
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';

// Error Boundary
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Global styles
import './global.css';

// Verify that all providers are properly imported
if (!ThemeProvider || !LanguageProvider || !AuthProvider || !CartProvider) {
  console.error('Context providers are not properly imported!', {
    ThemeProvider: !!ThemeProvider,
    LanguageProvider: !!LanguageProvider,
    AuthProvider: !!AuthProvider,
    CartProvider: !!CartProvider,
  });
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Wait for i18n to be fully initialized
    if (i18n.isInitialized) {
      setI18nReady(true);
    } else {
      // If not initialized yet, wait for it
      i18n.on('initialized', () => {
        setI18nReady(true);
      });
    }
  }, []);

  if (!i18nReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.container}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                  <ThemedToast />
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
