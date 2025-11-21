/**
 * Polyfills for missing React Native functions
 * Import this file at the top of App.tsx
 */

import { Image } from 'react-native';

// Polyfill for resolveAssetSource
// This is needed for react-native-webview compatibility
if (typeof Image.resolveAssetSource === 'undefined') {
  // @ts-ignore - Adding polyfill for missing function
  Image.resolveAssetSource = (source: any) => {
    if (typeof source === 'number') {
      // Handle local assets
      return { uri: '', width: 0, height: 0, scale: 1 };
    }
    // Handle remote or object sources
    return source;
  };
}

// Ensure global is defined (for some WebView versions)
if (typeof global === 'undefined') {
  // @ts-ignore
  global = window;
}

export {};
