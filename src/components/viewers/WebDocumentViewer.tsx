import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, getThemeColors } from '../../theme/colors';

interface WebDocumentViewerProps {
  fileUrl: string;
  fileType: 'pdf' | 'pptx' | 'ppt' | 'doc' | 'docx';
}

export const WebDocumentViewer: React.FC<WebDocumentViewerProps> = ({
  fileUrl,
  fileType,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const getViewerUrl = (): string => {
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (fileType === 'pdf') {
      return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    }
    
    // For Office files (pptx, doc, docx)
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Failed to load document</Text>
        <Text style={styles.errorText}>
          Please check your internet connection and try again
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: getViewerUrl() }}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true);
          setLoadProgress(0);
        }}
        onLoadProgress={({ nativeEvent }) => {
          setLoadProgress(nativeEvent.progress);
        }}
        onLoadEnd={() => {
          setLoading(false);
          setLoadProgress(1);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebDocumentViewer] WebView error:', nativeEvent);
          handleError();
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebDocumentViewer] HTTP error:', nativeEvent);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        mixedContentMode="always"
        androidLayerType="hardware"
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Loading {fileType.toUpperCase()}...
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${loadProgress * 100}%` },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    progressBar: {
      width: 200,
      height: 4,
      backgroundColor: colors.surface,
      borderRadius: 2,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
