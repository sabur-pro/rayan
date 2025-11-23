import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Material Type Card Skeleton
export const MaterialTypeCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Skeleton width={64} height={64} borderRadius={32} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={20} borderRadius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={16} borderRadius={8} />
      </View>
      <Skeleton width={32} height={32} borderRadius={16} />
    </View>
  );
};

// Material Card Skeleton
export const MaterialCardSkeleton: React.FC<{ hasImage?: boolean }> = ({ hasImage = false }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  return (
    <View style={styles.materialCard}>
      {hasImage && (
        <Skeleton width="100%" height={180} borderRadius={0} style={{ marginBottom: 0 }} />
      )}
      <View style={styles.materialCardContent}>
        <View style={styles.materialCardHeader}>
          {!hasImage && <Skeleton width={56} height={56} borderRadius={28} style={{ marginRight: 12 }} />}
          <View style={styles.materialCardHeaderText}>
            <Skeleton width="80%" height={20} borderRadius={10} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={16} borderRadius={8} />
          </View>
        </View>
        <View style={styles.materialCardFooter}>
          <View style={styles.filesPreview}>
            <Skeleton width={60} height={28} borderRadius={10} style={{ marginRight: 8 }} />
            <Skeleton width={60} height={28} borderRadius={10} style={{ marginRight: 8 }} />
            <Skeleton width={40} height={28} borderRadius={10} />
          </View>
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
};

// Favorite Card Skeleton
export const FavoriteCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  return (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteCardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View style={styles.favoriteCardInfo}>
          <Skeleton width="70%" height={18} borderRadius={9} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={14} borderRadius={7} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
      <Skeleton width="85%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
      <View style={styles.favoriteCardFooter}>
        <Skeleton width={80} height={14} borderRadius={7} />
        <Skeleton width={100} height={14} borderRadius={7} />
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    cardContent: {
      flex: 1,
      marginLeft: 16,
      marginRight: 12,
    },
    materialCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    materialCardContent: {
      padding: 16,
    },
    materialCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    materialCardHeaderText: {
      flex: 1,
    },
    materialCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filesPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    favoriteCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    favoriteCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    favoriteCardInfo: {
      flex: 1,
    },
    favoriteCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
