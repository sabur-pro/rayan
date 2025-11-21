import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, getThemeColors } from '../../theme/colors';

interface ImageViewerProps {
  imageUrl: string;
}

const { width, height } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const handleImageLoad = () => {
    setLoading(false);
    Image.getSize(
      imageUrl,
      (w, h) => setImageSize({ width: w, height: h }),
      (err) => console.log('Error getting image size:', err)
    );
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="image-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Failed to load image</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}

      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {!loading && imageSize.width > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {imageSize.width} × {imageSize.height}
          </Text>
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: width,
      height: height,
    },
    loadingContainer: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 40,
    },
    errorText: {
      marginTop: 16,
      fontSize: 18,
      color: colors.error,
      textAlign: 'center',
    },
    infoContainer: {
      position: 'absolute',
      bottom: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    infoText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });
