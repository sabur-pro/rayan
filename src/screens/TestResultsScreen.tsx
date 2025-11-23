import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { TestResult } from '../types/test';

interface TestResultsScreenProps {
  result: TestResult;
  testTitle?: string;
  onRetry: () => void;
  onClose: () => void;
}

export const TestResultsScreen: React.FC<TestResultsScreenProps> = ({
  result,
  testTitle,
  onRetry,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [showDetails, setShowDetails] = useState(false);

  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setShowDetails(true), 800);
  }, []);

  const getGradeInfo = () => {
    if (percentage >= 90) {
      return {
        grade: t('test.excellent'),
        icon: 'trophy' as const,
        color: '#10B981',
        emoji: '🏆',
      };
    } else if (percentage >= 75) {
      return {
        grade: t('test.good'),
        icon: 'thumbs-up' as const,
        color: '#3B82F6',
        emoji: '👍',
      };
    } else if (percentage >= 60) {
      return {
        grade: t('test.satisfactory'),
        icon: 'checkmark-circle' as const,
        color: '#F59E0B',
        emoji: '✓',
      };
    } else {
      return {
        grade: t('test.unsatisfactory'),
        icon: 'close-circle' as const,
        color: '#EF4444',
        emoji: '✗',
      };
    }
  };

  const gradeInfo = getGradeInfo();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}${t('test.minutes')} ${secs}${t('test.seconds')}`;
  };

  // Render detailed question result
  const renderQuestionResult = useCallback(({ item: question, index }: { item: any; index: number }) => {
    const isAnswered = question.userAnswer !== undefined;
    const isCorrect =
      isAnswered &&
      question.userAnswer !== undefined &&
      question.answers[question.userAnswer].isCorrect;
    const correctAnswerIndex = question.answers.findIndex((a: any) => a.isCorrect);

    return (
      <View style={styles.questionResult}>
        <View style={styles.questionResultHeader}>
          <View
            style={[
              styles.questionResultNumber,
              isCorrect
                ? styles.questionResultNumberCorrect
                : isAnswered
                ? styles.questionResultNumberIncorrect
                : styles.questionResultNumberSkipped,
            ]}
          >
            <Text style={styles.questionResultNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.questionResultHeaderContent}>
            <Text style={styles.questionResultText}>{question.question}</Text>
            <View style={styles.questionResultBadge}>
              {isCorrect ? (
                <>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.questionResultStatus, { color: '#10B981' }]}>
                    {t('test.correct')}
                  </Text>
                </>
              ) : isAnswered ? (
                <>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                  <Text style={[styles.questionResultStatus, { color: '#EF4444' }]}>
                    {t('test.incorrect')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="remove-circle" size={14} color="#F59E0B" />
                  <Text style={[styles.questionResultStatus, { color: '#F59E0B' }]}>
                    {t('test.skipped')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.questionResultAnswers}>
          {question.answers.map((answer: any, ansIndex: number) => {
            const isUserAnswer = question.userAnswer === ansIndex;
            const isCorrectAnswer = ansIndex === correctAnswerIndex;

            return (
              <View
                key={ansIndex}
                style={[
                  styles.answerResult,
                  isCorrectAnswer && styles.answerResultCorrect,
                  isUserAnswer && !isCorrectAnswer && styles.answerResultIncorrect,
                ]}
              >
                {isCorrectAnswer && <Ionicons name="checkmark" size={14} color="#10B981" />}
                {isUserAnswer && !isCorrectAnswer && (
                  <Ionicons name="close" size={14} color="#EF4444" />
                )}
                <Text
                  style={[
                    styles.answerResultText,
                    isCorrectAnswer && styles.answerResultTextCorrect,
                    isUserAnswer && !isCorrectAnswer && styles.answerResultTextIncorrect,
                  ]}
                >
                  {answer.text}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [t, styles]);

  // Render list header with statistics
  const renderListHeader = useCallback(() => (
    <>
      {/* Statistics Card */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.statsHeader}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
            <Text style={styles.statsTitle}>{t('test.statistics')}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${(result.correctAnswers / result.totalQuestions) * 100}%`,
                    backgroundColor: '#10B981' 
                  }
                ]} 
              />
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${(result.incorrectAnswers / result.totalQuestions) * 100}%`,
                    backgroundColor: '#EF4444',
                    left: `${(result.correctAnswers / result.totalQuestions) * 100}%`
                  }
                ]} 
              />
              {result.skippedAnswers > 0 && (
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${(result.skippedAnswers / result.totalQuestions) * 100}%`,
                      backgroundColor: '#F59E0B',
                      left: `${((result.correctAnswers + result.incorrectAnswers) / result.totalQuestions) * 100}%`
                    }
                  ]} 
                />
              )}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10B981' + '15' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{result.correctAnswers}</Text>
              <Text style={styles.statLabel}>{t('test.correct')}</Text>
              <Text style={styles.statPercentage}>
                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EF4444' + '15' }]}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{result.incorrectAnswers}</Text>
              <Text style={styles.statLabel}>{t('test.incorrect')}</Text>
              <Text style={styles.statPercentage}>
                {Math.round((result.incorrectAnswers / result.totalQuestions) * 100)}%
              </Text>
            </View>

            {result.skippedAnswers > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B' + '15' }]}>
                    <Ionicons name="remove-circle" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.statValue}>{result.skippedAnswers}</Text>
                  <Text style={styles.statLabel}>{t('test.skipped')}</Text>
                  <Text style={styles.statPercentage}>
                    {Math.round((result.skippedAnswers / result.totalQuestions) * 100)}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Performance Info */}
          <View style={styles.performanceInfo}>
            <View style={styles.performanceItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.performanceText}>{formatTime(result.timeSpent)}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="help-circle" size={16} color={colors.textSecondary} />
              <Text style={styles.performanceText}>
                {result.totalQuestions} {t('test.questions')}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons 
                name={percentage >= 75 ? "trending-up" : percentage >= 60 ? "remove" : "trending-down"} 
                size={16} 
                color={percentage >= 75 ? "#10B981" : percentage >= 60 ? "#F59E0B" : "#EF4444"} 
              />
              <Text style={[
                styles.performanceText,
                { color: percentage >= 75 ? "#10B981" : percentage >= 60 ? "#F59E0B" : "#EF4444" }
              ]}>
                {percentage}% {t('test.score')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Detailed Results */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('test.detailedResults')}</Text>
            <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
              <Ionicons
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
    </>
  ), [fadeAnim, slideUpAnim, result, showDetails, percentage, t, colors, formatTime, styles]);

  // Footer with action buttons
  const renderListFooter = useCallback(() => (
    <View style={styles.footerActions}>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={20} color={colors.primary} />
        <Text style={styles.retryButtonText}>{t('test.retryTest')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
        <Text style={styles.closeButtonText}>{t('test.close')}</Text>
      </TouchableOpacity>
    </View>
  ), [onRetry, onClose, t, colors, styles]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('test.results')}</Text>
          {testTitle && <Text style={styles.headerSubtitle}>{testTitle}</Text>}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={showDetails ? result.questions : []}
        renderItem={renderQuestionResult}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={21}
      />
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
      paddingTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      backgroundColor: colors.surface,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 20,
    },
    statsCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    progressBarContainer: {
      marginBottom: 20,
    },
    progressBarTrack: {
      height: 12,
      backgroundColor: colors.background,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressBarFill: {
      position: 'absolute',
      height: '100%',
      borderRadius: 6,
    },
    statsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    statPercentage: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '700',
    },
    statDivider: {
      width: 1,
      height: 60,
      backgroundColor: colors.border,
    },
    performanceInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: 12,
    },
    performanceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    performanceText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    questionResult: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    questionResultHeader: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 10,
    },
    questionResultNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    questionResultNumberCorrect: {
      backgroundColor: '#10B981',
    },
    questionResultNumberIncorrect: {
      backgroundColor: '#EF4444',
    },
    questionResultNumberSkipped: {
      backgroundColor: '#F59E0B',
    },
    questionResultNumberText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFF',
    },
    questionResultHeaderContent: {
      flex: 1,
    },
    questionResultText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 18,
    },
    questionResultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    questionResultStatus: {
      fontSize: 11,
      fontWeight: '700',
    },
    questionResultAnswers: {
      gap: 8,
    },
    answerResult: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 10,
      gap: 8,
    },
    answerResultCorrect: {
      backgroundColor: '#10B981' + '15',
      borderWidth: 2,
      borderColor: '#10B981',
    },
    answerResultIncorrect: {
      backgroundColor: '#EF4444' + '15',
      borderWidth: 2,
      borderColor: '#EF4444',
    },
    answerResultText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
      lineHeight: 16,
    },
    answerResultTextCorrect: {
      color: '#10B981',
      fontWeight: '700',
    },
    answerResultTextIncorrect: {
      color: '#EF4444',
      fontWeight: '700',
    },
    footerActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 30,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 8,
    },
    retryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '15',
      padding: 14,
      borderRadius: 14,
      gap: 8,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    closeButtonBottom: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
  });
