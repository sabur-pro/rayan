import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toast';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { TestData } from '../types/test';

interface TestSetupScreenProps {
  testData: TestData;
  onStart: (setup: {
    mode: 'all' | 'range';
    rangeStart?: number;
    rangeEnd?: number;
    questionCount: number | 'all';
    timeLimit: number;
    shuffleAnswers: boolean;
  }) => void;
  onPreview?: () => void;
  onBack: () => void;
}

export const TestSetupScreen: React.FC<TestSetupScreenProps> = ({
  testData,
  onStart,
  onPreview,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [mode, setMode] = useState<'all' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState(testData.questions.length.toString());
  const [questionCount, setQuestionCount] = useState<10 | 15 | 20 | 'custom' | 'all'>('all');
  const [customQuestionCount, setCustomQuestionCount] = useState('');
  const [timeLimit, setTimeLimit] = useState<10 | 15 | 20 | 30 | 45 | 60 | 'custom'>(30);
  const [customTimeLimit, setCustomTimeLimit] = useState('');
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const totalQuestions = testData.questions.length;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStart = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (mode === 'range' && (isNaN(start) || isNaN(end) || start < 1 || end > totalQuestions || start > end)) {
      showToast.error(t('test.invalidRange'), t('common.error'));
      return;
    }

    let finalQuestionCount: number | 'all';
    if (questionCount === 'custom') {
      const customCount = parseInt(customQuestionCount);
      if (isNaN(customCount) || customCount < 1) {
        showToast.error(t('test.enterCustomCount'), t('common.error'));
        return;
      }
      finalQuestionCount = customCount;
    } else {
      finalQuestionCount = questionCount;
    }

    let finalTimeLimit: number;
    if (timeLimit === 'custom') {
      const customTime = parseInt(customTimeLimit);
      if (isNaN(customTime) || customTime < 1) {
        showToast.error(t('test.enterCustomTime'), t('common.error'));
        return;
      }
      finalTimeLimit = customTime;
    } else {
      finalTimeLimit = timeLimit;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onStart({
      mode,
      rangeStart: mode === 'range' ? start : undefined,
      rangeEnd: mode === 'range' ? end : undefined,
      questionCount: finalQuestionCount,
      timeLimit: finalTimeLimit,
      shuffleAnswers,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('test.setup')}</Text>
          <Text style={styles.headerSubtitle}>{testData.title}</Text>
        </View>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Total Questions Info */}
        <View style={styles.infoCard}>
          <Ionicons name="help-circle" size={32} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('test.totalQuestions')}</Text>
            <Text style={styles.infoValue}>{totalQuestions}</Text>
          </View>
        </View>

        {/* Preview Button */}
        {onPreview && (
          <TouchableOpacity style={styles.previewButton} onPress={onPreview}>
            <View style={styles.previewButtonContent}>
              <Ionicons name="eye" size={24} color={colors.primary} />
              <View style={styles.previewButtonText}>
                <Text style={styles.previewButtonTitle}>{t('test.previewTest')}</Text>
                <Text style={styles.previewButtonSubtitle}>{t('test.viewAllAnswers')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('test.testMode')}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCard, mode === 'all' && styles.optionCardActive]}
              onPress={() => setMode('all')}
            >
              <Ionicons
                name="albums"
                size={24}
                color={mode === 'all' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.optionText, mode === 'all' && styles.optionTextActive]}>
                {t('test.allQuestions')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, mode === 'range' && styles.optionCardActive]}
              onPress={() => setMode('range')}
            >
              <Ionicons
                name="filter"
                size={24}
                color={mode === 'range' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.optionText, mode === 'range' && styles.optionTextActive]}>
                {t('test.range')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Range Selection */}
        {mode === 'range' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('test.selectRange')}</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>{t('test.from')}</Text>
                <TextInput
                  style={styles.rangeTextInput}
                  value={rangeStart}
                  onChangeText={setRangeStart}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />

              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>{t('test.to')}</Text>
                <TextInput
                  style={styles.rangeTextInput}
                  value={rangeEnd}
                  onChangeText={setRangeEnd}
                  keyboardType="numeric"
                  placeholder={totalQuestions.toString()}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        )}

        {/* Question Count Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('test.questionCount')}</Text>
          <View style={styles.countGrid}>
            {(['all', 10, 15, 20] as const).map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countCard,
                  questionCount === count && styles.countCardActive,
                ]}
                onPress={() => setQuestionCount(count)}
              >
                <Text
                  style={[
                    styles.countText,
                    questionCount === count && styles.countTextActive,
                  ]}
                >
                  {count === 'all' ? t('test.all') : count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionHint}>
            {questionCount === 'all'
              ? t('test.willUseAll')
              : questionCount === 'custom'
              ? t('test.enterCustomCount')
              : t('test.willSelectRandom', { count: questionCount as number })}
          </Text>
        </View>

        {/* Time Limit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('test.timeLimit')}</Text>
          <View style={styles.timeGrid}>
            {[10, 15, 20, 30, 45, 60].map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeCard,
                  timeLimit === time && styles.timeCardActive,
                ]}
                onPress={() => setTimeLimit(time as 10 | 15 | 20 | 30 | 45 | 60 | 'custom')}
              >
                <Ionicons
                  name="time"
                  size={20}
                  color={timeLimit === time ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.timeText,
                    timeLimit === time && styles.timeTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Shuffle Option */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleCard}
            onPress={() => setShuffleAnswers(!shuffleAnswers)}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="shuffle" size={24} color={colors.primary} />
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>{t('test.shuffleAnswers')}</Text>
                <Text style={styles.toggleDescription}>
                  {shuffleAnswers
                    ? t('test.answersShuffled')
                    : t('test.answersNotShuffled')}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggle,
                shuffleAnswers && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  shuffleAnswers && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>{t('test.start')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    infoContent: {
      marginLeft: 16,
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    sectionHint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    optionCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    optionCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    optionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 8,
    },
    optionTextActive: {
      color: colors.primary,
    },
    rangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    rangeInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rangeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    rangeTextInput: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      padding: 0,
    },
    countGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    countCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    countCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    countText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    countTextActive: {
      color: colors.primary,
    },
    timeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    timeCard: {
      width: '30%',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    timeCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    timeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    timeTextActive: {
      color: colors.primary,
    },
    toggleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    toggleContent: {
      marginLeft: 12,
      flex: 1,
    },
    toggleTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    toggleDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    toggle: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: colors.primary,
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFF',
    },
    toggleThumbActive: {
      alignSelf: 'flex-end',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
      marginBottom: 20,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    startButton: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    previewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 18,
      borderRadius: 16,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.primary + '40',
    },
    previewButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 14,
    },
    previewButtonText: {
      flex: 1,
    },
    previewButtonTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    previewButtonSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });
