import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const useToastConfig = () => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.baseToast, { backgroundColor: colors.surface, borderLeftColor: colors.success }]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, { color: colors.text }]}
        text2Style={[styles.text2, { color: colors.textSecondary }]}
        text2NumberOfLines={3}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          </View>
        )}
      />
    ),
    
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={[styles.baseToast, { backgroundColor: colors.surface, borderLeftColor: colors.error }]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, { color: colors.text }]}
        text2Style={[styles.text2, { color: colors.textSecondary }]}
        text2NumberOfLines={3}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={28} color={colors.error} />
          </View>
        )}
      />
    ),
    
    info: (props: any) => (
      <InfoToast
        {...props}
        style={[styles.baseToast, { backgroundColor: colors.surface, borderLeftColor: colors.info }]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, { color: colors.text }]}
        text2Style={[styles.text2, { color: colors.textSecondary }]}
        text2NumberOfLines={3}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={28} color={colors.info} />
          </View>
        )}
      />
    ),
    
    warning: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.baseToast, { backgroundColor: colors.surface, borderLeftColor: colors.warning }]}
        contentContainerStyle={styles.contentContainer}
        text1Style={[styles.text1, { color: colors.text }]}
        text2Style={[styles.text2, { color: colors.textSecondary }]}
        text2NumberOfLines={3}
        renderLeadingIcon={() => (
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={28} color={colors.warning} />
          </View>
        )}
      />
    ),
  };
};

const styles = StyleSheet.create({
  baseToast: {
    borderLeftWidth: 5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contentContainer: {
    paddingHorizontal: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  text2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
