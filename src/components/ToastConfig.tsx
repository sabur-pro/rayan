import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import Toast from 'react-native-toast-message';
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
    
    confirm: (props: any) => {
      const onConfirm = props.props?.onConfirm;
      const onCancel = props.props?.onCancel;
      const confirmText = props.props?.confirmText;
      const cancelText = props.props?.cancelText;
      
      return (
        <View style={[styles.confirmToast, { backgroundColor: colors.surface }]}>
          <View style={styles.confirmContent}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="help-circle" size={40} color={colors.warning} />
            </View>
            <View style={styles.confirmTextContainer}>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>{props.text1}</Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>{props.text2}</Text>
            </View>
          </View>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                Toast.hide();
                if (onCancel) onCancel();
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {cancelText || 'Отмена'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.okButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Toast.hide();
                if (onConfirm) onConfirm();
              }}
            >
              <Text style={styles.okButtonText}>
                {confirmText || 'ОК'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
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
  confirmToast: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 30,
    minHeight: 160,
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  confirmIconContainer: {
    marginRight: 16,
    marginTop: 4,
  },
  confirmTextContainer: {
    flex: 1,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 26,
  },
  confirmMessage: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    opacity: 0.85,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  okButton: {
    // backgroundColor is set dynamically from colors.primary
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
