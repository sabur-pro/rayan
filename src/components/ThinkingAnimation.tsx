import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const ThinkingAnimation: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация точек
    const dotAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Анимация свечения
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    // Анимация вращения иконки
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      dotAnimation(dot1Anim, 0),
      dotAnimation(dot2Anim, 200),
      dotAnimation(dot3Anim, 400),
      glowAnimation,
      rotateAnimation,
    ]).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  const glowStyle = {
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
  };

  const rotateStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, rotateStyle]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </Animated.View>
        <Text style={styles.text}>{t('chat.aiThinking')}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dotStyle(dot1Anim)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2Anim)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3Anim)]} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 4,
      marginHorizontal: 8,
      maxWidth: '75%',
      alignSelf: 'flex-start',
      position: 'relative',
    },
    glow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.primary,
      borderRadius: 16,
      opacity: 0.1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });
