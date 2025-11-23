import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  BackHandler,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toast';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { TestQuestion, TestResult } from '../types/test';

interface TestScreenProps {
  questions: TestQuestion[];
  timeLimit: number;
  testTitle: string;
  onComplete: (result: TestResult) => void;
  onBack: () => void;
}

export const TestScreen: React.FC<TestScreenProps> = ({
  questions: initialQuestions,
  timeLimit,
  testTitle,
  onComplete,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false); // Показывать ли обратную связь
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null); // Выбранный ответ для обратной связи
  const scrollViewRef = useRef<ScrollView>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => q.userAnswer !== undefined).length;

  // Очистка timeout при смене вопроса
  useEffect(() => {
    setShowFeedback(false);
    setSelectedAnswerIndex(null);
    feedbackAnim.setValue(0);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, [currentQuestionIndex]);

  // Очистка timeout при размонтировании
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, [questions]);

  // Animate question transitions
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestionIndex]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}${t('test.minutes')} ${secs}${t('test.seconds')}`;
  };

  const handleBackPress = () => {
    showToast.confirm(
      t('test.progressNotSaved'),
      t('test.exitConfirm'),
      () => {
        // User confirmed exit
        onBack();
      },
      () => {
        // User cancelled - continue test
      }
    );
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return; // Игнорируем клики во время показа обратной связи

    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answerIndex,
    };
    setQuestions(updatedQuestions);
    
    // Показываем обратную связь
    setSelectedAnswerIndex(answerIndex);
    setShowFeedback(true);
    
    // Анимация появления обратной связи
    Animated.spring(feedbackAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Очищаем предыдущий timeout если он есть
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    
    // Автоматический переход к следующему вопросу через 800ms
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswerIndex(null);
      feedbackAnim.setValue(0);
      feedbackTimeoutRef.current = null;
      
      if (currentQuestionIndex < questions.length - 1) {
        handleNext();
      }
    }, 800);
  };

  const animateTransition = (direction: 'forward' | 'backward') => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === 'forward' ? 50 : -50);
      fadeAnim.setValue(0);
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      animateTransition('forward');
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      animateTransition('backward');
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 150);
    }
  };

  const handleFinishTest = () => {
    const unanswered = questions.filter((q) => q.userAnswer === undefined).length;
    
    if (unanswered > 0) {
      showToast.confirm(
        t('test.unansweredQuestions', { count: unanswered }),
        t('test.finishConfirm'),
        () => {
          // User confirmed - finish test anyway
          completeTest();
        },
        () => {
          // User cancelled - stay on test to answer remaining questions
        }
      );
    } else {
      // No unanswered questions - complete immediately
      completeTest();
    }
  };

  const completeTest = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const correctAnswers = questions.filter((q) => {
      if (q.userAnswer === undefined) return false;
      return q.answers[q.userAnswer].isCorrect;
    }).length;

    const incorrectAnswers = questions.filter((q) => {
      if (q.userAnswer === undefined) return false;
      return !q.answers[q.userAnswer].isCorrect;
    }).length;

    const skippedAnswers = questions.filter((q) => q.userAnswer === undefined).length;

    onComplete({
      questions,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      timeSpent,
      totalQuestions: questions.length,
    });
  };

  const jumpToQuestion = (index: number) => {
    animateTransition(index > currentQuestionIndex ? 'forward' : 'backward');
    setTimeout(() => {
      setCurrentQuestionIndex(index);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 150);
  };

  const getQuestionStatusColor = (question: TestQuestion) => {
    if (question.userAnswer !== undefined) {
      return colors.primary;
    }
    return colors.border;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{testTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {t('test.question')} {currentQuestionIndex + 1} {t('test.of')} {questions.length}
          </Text>
        </View>
        <View style={[
          styles.timerBadge,
          timeRemaining < 60 && styles.timerBadgeWarning
        ]}>
          <Ionicons 
            name="time" 
            size={16} 
            color={timeRemaining < 60 ? '#FFF' : colors.primary} 
          />
          <Text style={[
            styles.timerText,
            timeRemaining < 60 && styles.timerTextWarning
          ]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${(answeredCount / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {answeredCount} {t('test.of')} {questions.length} {t('test.answered')}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card */}
        <Animated.View
          style={[
            styles.questionCard,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => {
              const isSelected = currentQuestion.userAnswer === index;
              const isShowingFeedback = showFeedback && selectedAnswerIndex === index;
              const isCorrect = answer.isCorrect;
              const isWrong = isShowingFeedback && !isCorrect;
              const isRight = isShowingFeedback && isCorrect;
              // Если уже есть выбранный ответ, блокируем все остальные
              const isDisabled = currentQuestion.userAnswer !== undefined;
              
              return (
                <Animated.View
                  key={`answer-${currentQuestionIndex}-${index}`}
                  style={{
                    transform: [{
                      scale: isShowingFeedback ? feedbackAnim : 1,
                    }],
                    opacity: isDisabled && !isSelected ? 0.5 : 1,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.answerCard,
                      isSelected && !showFeedback && styles.answerCardSelected,
                      isRight && styles.answerCardCorrect,
                      isWrong && styles.answerCardWrong,
                    ]}
                    onPress={() => handleAnswerSelect(index)}
                    activeOpacity={0.7}
                    disabled={isDisabled}
                  >
                    <View style={[
                      styles.radio,
                      isSelected && !showFeedback && styles.radioSelected,
                      isRight && styles.radioCorrect,
                      isWrong && styles.radioWrong,
                    ]}>
                      {isSelected && !showFeedback && <View style={styles.radioDot} />}
                      {isRight && <Ionicons name="checkmark" size={16} color="#fff" />}
                      {isWrong && <Ionicons name="close" size={16} color="#fff" />}
                    </View>
                    <Text style={[
                      styles.answerText,
                      isSelected && !showFeedback && styles.answerTextSelected,
                      isRight && styles.answerTextCorrect,
                      isWrong && styles.answerTextWrong,
                    ]}>
                      {answer.text}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Question Navigation Grid */}
        <View style={styles.navigationSection}>
          <Text style={styles.navigationTitle}>{t('test.navigation')}</Text>
          <FlatList
            data={questions}
            keyExtractor={(item, index) => index.toString()}
            numColumns={7}
            scrollEnabled={false}
            contentContainerStyle={styles.navigationGrid}
            renderItem={({ item: question, index }) => (
              <TouchableOpacity
                style={[
                  styles.navButton,
                  index === currentQuestionIndex && styles.navButtonActive,
                  question.userAnswer !== undefined && styles.navButtonAnswered,
                ]}
                onPress={() => jumpToQuestion(index)}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    (index === currentQuestionIndex || question.userAnswer !== undefined) &&
                      styles.navButtonTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </TouchableOpacity>
            )}
            maxToRenderPerBatch={35}
            initialNumToRender={35}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton2, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentQuestionIndex === 0 ? colors.textTertiary : colors.text}
          />
          <Text
            style={[
              styles.navButtonText2,
              currentQuestionIndex === 0 && styles.navButtonTextDisabled,
            ]}
          >
            {t('test.previous')}
          </Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishTest}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.finishButtonText}>{t('test.finish')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{t('test.next')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
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
      paddingHorizontal: 20,
      paddingVertical: 10,
      paddingTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
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
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    timerBadgeWarning: {
      backgroundColor: '#EF4444',
    },
    timerText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    timerTextWarning: {
      color: '#FFF',
    },
    progressContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: colors.border,
    },
    questionHeader: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 16,
    },
    questionNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    questionNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    questionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 24,
    },
    answersContainer: {
      gap: 12,
    },
    answerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 12,
    },
    answerCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    answerText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    answerTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    // Стили для обратной связи
    answerCardCorrect: {
      borderColor: '#10B981',
      backgroundColor: '#10B981' + '15',
    },
    answerCardWrong: {
      borderColor: '#EF4444',
      backgroundColor: '#EF4444' + '15',
    },
    radioCorrect: {
      borderColor: '#10B981',
      backgroundColor: '#10B981',
    },
    radioWrong: {
      borderColor: '#EF4444',
      backgroundColor: '#EF4444',
    },
    answerTextCorrect: {
      color: '#10B981',
      fontWeight: '700',
    },
    answerTextWrong: {
      color: '#EF4444',
      fontWeight: '700',
    },
    navigationSection: {
      marginTop: 8,
      marginBottom: 24,
    },
    navigationTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    navigationGrid: {
      gap: 10,
    },
    navButton: {
      width: 44,
      height: 44,
      margin: 3,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    navButtonAnswered: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    navButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    navButtonTextActive: {
      color: '#FFF',
    },
    bottomNav: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 30,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    navButton2: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 6,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText2: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    navButtonTextDisabled: {
      color: colors.textTertiary,
    },
    nextButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 14,
      gap: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    nextButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFF',
    },
    finishButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10B981',
      padding: 16,
      borderRadius: 14,
      gap: 6,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    finishButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFF',
    },
  });
