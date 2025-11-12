import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showDetails, setShowDetails] = useState(false);

  const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  const { width } = Dimensions.get('window');
  const circleSize = Math.min(width * 0.55, 220);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 2000,
        delay: 400,
        useNativeDriver: false,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setShowDetails(true), 2500);
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

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Score Card */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }],
            },
          ]}
        >
          {/* Circular Progress */}
          <View style={styles.progressCircleContainer}>
            <View style={[styles.progressCircleOuter, { width: circleSize, height: circleSize }]}>
              {/* Background Circle */}
              <View
                style={[
                  styles.progressCircleBg,
                  {
                    width: circleSize - 20,
                    height: circleSize - 20,
                    borderRadius: (circleSize - 20) / 2,
                  },
                ]}
              />

              {/* Animated Progress */}
              <Animated.View
                style={[
                  styles.progressArc,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    borderWidth: 10,
                    borderColor: 'transparent',
                    borderTopColor: gradeInfo.color,
                    borderRightColor: percentage > 25 ? gradeInfo.color : 'transparent',
                    borderBottomColor: percentage > 50 ? gradeInfo.color : 'transparent',
                    borderLeftColor: percentage > 75 ? gradeInfo.color : 'transparent',
                    transform: [{ rotate: rotation }],
                  },
                ]}
              />

              {/* Center Content */}
              <View style={styles.circleCenter}>
                <Animated.Text style={[styles.centerEmoji, { transform: [{ rotate: rotation }] }]}>
                  {gradeInfo.emoji}
                </Animated.Text>
                <Text style={[styles.centerPercentage, { color: gradeInfo.color }]}>
                  {percentage}%
                </Text>
                <Text style={[styles.centerGrade, { color: gradeInfo.color }]}>
                  {gradeInfo.grade}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.scoreStats}>
            <View style={styles.scoreStatItem}>
              <Text style={styles.scoreStatValue}>{result.correctAnswers}</Text>
              <Text style={styles.scoreStatLabel}>{t('test.correct')}</Text>
            </View>
            <View style={styles.scoreStatDivider} />
            <View style={styles.scoreStatItem}>
              <Text style={styles.scoreStatValue}>{result.totalQuestions}</Text>
              <Text style={styles.scoreStatLabel}>{t('test.totalQuestions')}</Text>
            </View>
            <View style={styles.scoreStatDivider} />
            <View style={styles.scoreStatItem}>
              <Text style={styles.scoreStatValue}>{formatTime(result.timeSpent)}</Text>
              <Text style={styles.scoreStatLabel}>{t('test.timeSpent')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Modern Stats Cards */}
        <Animated.View
          style={[
            styles.modernStatsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.modernStatsRow}>
            <View style={[styles.modernStatCard, styles.modernStatCorrect]}>
              <View style={styles.modernStatIconWrapper}>
                <View style={styles.modernStatIconBg}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                </View>
              </View>
              <View style={styles.modernStatContent}>
                <Text style={styles.modernStatValue}>{result.correctAnswers}</Text>
                <Text style={styles.modernStatLabel}>{t('test.correct')}</Text>
              </View>
              <View
                style={[
                  styles.modernStatBar,
                  {
                    width: `${(result.correctAnswers / result.totalQuestions) * 100}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>

            <View style={[styles.modernStatCard, styles.modernStatIncorrect]}>
              <View style={styles.modernStatIconWrapper}>
                <View style={styles.modernStatIconBg}>
                  <Ionicons name="close-circle" size={32} color="#EF4444" />
                </View>
              </View>
              <View style={styles.modernStatContent}>
                <Text style={styles.modernStatValue}>{result.incorrectAnswers}</Text>
                <Text style={styles.modernStatLabel}>{t('test.incorrect')}</Text>
              </View>
              <View
                style={[
                  styles.modernStatBar,
                  {
                    width: `${(result.incorrectAnswers / result.totalQuestions) * 100}%`,
                    backgroundColor: '#EF4444',
                  },
                ]}
              />
            </View>
          </View>

          {result.skippedAnswers > 0 && (
            <View style={[styles.modernStatCard, styles.modernStatSkipped, { marginTop: 12 }]}>
              <View style={styles.modernStatIconWrapper}>
                <View style={styles.modernStatIconBg}>
                  <Ionicons name="remove-circle" size={32} color="#F59E0B" />
                </View>
              </View>
              <View style={styles.modernStatContent}>
                <Text style={styles.modernStatValue}>{result.skippedAnswers}</Text>
                <Text style={styles.modernStatLabel}>{t('test.skipped')}</Text>
              </View>
              <View
                style={[
                  styles.modernStatBar,
                  {
                    width: `${(result.skippedAnswers / result.totalQuestions) * 100}%`,
                    backgroundColor: '#F59E0B',
                  },
                ]}
              />
            </View>
          )}
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

          {showDetails &&
            result.questions.map((question, index) => {
              const isAnswered = question.userAnswer !== undefined;
              const isCorrect =
                isAnswered &&
                question.userAnswer !== undefined &&
                question.answers[question.userAnswer].isCorrect;
              const correctAnswerIndex = question.answers.findIndex((a) => a.isCorrect);

              return (
                <View key={index} style={styles.questionResult}>
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
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={[styles.questionResultStatus, { color: '#10B981' }]}>
                              {t('test.correct')}
                            </Text>
                          </>
                        ) : isAnswered ? (
                          <>
                            <Ionicons name="close-circle" size={16} color="#EF4444" />
                            <Text style={[styles.questionResultStatus, { color: '#EF4444' }]}>
                              {t('test.incorrect')}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="remove-circle" size={16} color="#F59E0B" />
                            <Text style={[styles.questionResultStatus, { color: '#F59E0B' }]}>
                              {t('test.skipped')}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.questionResultAnswers}>
                    {question.answers.map((answer, ansIndex) => {
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
                          {isCorrectAnswer && <Ionicons name="checkmark" size={18} color="#10B981" />}
                          {isUserAnswer && !isCorrectAnswer && (
                            <Ionicons name="close" size={18} color="#EF4444" />
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
            })}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.retryButtonText}>{t('test.retryTest')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t('test.close')}</Text>
        </TouchableOpacity>
      </View>
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
      paddingVertical: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
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
      flex: 1,
      padding: 20,
    },
    heroCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 32,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    progressCircleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    progressCircleOuter: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressCircleBg: {
      position: 'absolute',
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
    },
    progressArc: {
      position: 'absolute',
    },
    circleCenter: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    centerPercentage: {
      fontSize: 52,
      fontWeight: '900',
      marginBottom: 8,
    },
    centerGrade: {
      fontSize: 20,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    scoreStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      paddingTop: 24,
      borderTopWidth: 2,
      borderTopColor: colors.border,
    },
    scoreStatItem: {
      alignItems: 'center',
    },
    scoreStatValue: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    scoreStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    scoreStatDivider: {
      width: 2,
      height: 40,
      backgroundColor: colors.border,
    },
    modernStatsContainer: {
      marginBottom: 24,
    },
    modernStatsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    modernStatCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 2,
      borderColor: colors.border,
      overflow: 'hidden',
      position: 'relative',
    },
    modernStatCorrect: {
      backgroundColor: '#10B981' + '08',
      borderColor: '#10B981' + '30',
    },
    modernStatIncorrect: {
      backgroundColor: '#EF4444' + '08',
      borderColor: '#EF4444' + '30',
    },
    modernStatSkipped: {
      backgroundColor: '#F59E0B' + '08',
      borderColor: '#F59E0B' + '30',
    },
    modernStatIconWrapper: {
      marginBottom: 16,
    },
    modernStatIconBg: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modernStatContent: {
      marginBottom: 12,
    },
    modernStatValue: {
      fontSize: 36,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 4,
    },
    modernStatLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    modernStatBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 4,
      borderRadius: 2,
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    questionResult: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.border,
    },
    questionResultHeader: {
      flexDirection: 'row',
      marginBottom: 14,
      gap: 12,
    },
    questionResultNumber: {
      width: 38,
      height: 38,
      borderRadius: 19,
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
      fontSize: 15,
      fontWeight: '700',
      color: '#FFF',
    },
    questionResultHeaderContent: {
      flex: 1,
    },
    questionResultText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
      lineHeight: 21,
    },
    questionResultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    questionResultStatus: {
      fontSize: 13,
      fontWeight: '700',
    },
    questionResultAnswers: {
      gap: 10,
    },
    answerResult: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 12,
      gap: 10,
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
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      lineHeight: 19,
    },
    answerResultTextCorrect: {
      color: '#10B981',
      fontWeight: '700',
    },
    answerResultTextIncorrect: {
      color: '#EF4444',
      fontWeight: '700',
    },
    bottomActions: {
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
      padding: 18,
      borderRadius: 16,
      gap: 8,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    closeButtonBottom: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 18,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
  });
