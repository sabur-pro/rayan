import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';

export const SubjectCardSkeleton: React.FC = () => {
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

  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Animated.View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.border,
            opacity,
          },
        ]}
      />
      <View style={styles.textContainer}>
        <Animated.View
          style={[
            styles.titleLine1,
            {
              backgroundColor: colors.border,
              opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.titleLine2,
            {
              backgroundColor: colors.border,
              opacity,
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: colors.border,
            opacity,
          },
        ]}
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      minHeight: 180,
      justifyContent: 'space-between',
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      marginBottom: 12,
    },
    textContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
      flex: 1,
      justifyContent: 'center',
    },
    titleLine1: {
      width: '80%',
      height: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    titleLine2: {
      width: '60%',
      height: 16,
      borderRadius: 8,
    },
    badge: {
      width: 60,
      height: 28,
      borderRadius: 12,
    },
  });
