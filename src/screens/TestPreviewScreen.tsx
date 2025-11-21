import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { TestData, TestQuestion } from '../types/test';

interface TestPreviewScreenProps {
  testData: TestData;
  onBack: () => void;
}

// Simple case-insensitive search
const simpleMatch = (text: string, search: string): boolean => {
  if (!search) return true;
  return text.toLowerCase().includes(search.toLowerCase());
};

// Highlight matching text - simple case-insensitive
const highlightText = (text: string, search: string): React.ReactNode[] => {
  if (!search) {
    return [<Text key="0">{text}</Text>];
  }

  const textLower = text.toLowerCase();
  const searchLower = search.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Find all matches
  let index = textLower.indexOf(searchLower, lastIndex);
  
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(<Text key={`before-${lastIndex}`}>{text.substring(lastIndex, index)}</Text>);
    }
    
    // Add highlighted match
    parts.push(
      <Text key={`match-${index}`} style={{ backgroundColor: '#FFD700', fontWeight: '700' }}>
        {text.substring(index, index + searchLower.length)}
      </Text>
    );
    
    lastIndex = index + searchLower.length;
    index = textLower.indexOf(searchLower, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<Text key="after">{text.substring(lastIndex)}</Text>);
  }

  return parts;
};

export const TestPreviewScreen: React.FC<TestPreviewScreenProps> = ({
  testData,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const questionRefs = useRef<{ [key: number]: View | null }>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show content immediately without delay
    setIsLoading(false);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Spinning animation for loader
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Filter questions based on simple case-insensitive search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return testData.questions;

    return testData.questions.filter((question) => {
      // Search in question text
      if (simpleMatch(question.question, searchQuery)) return true;
      
      // Search in answers
      return question.answers.some(answer => simpleMatch(answer.text, searchQuery));
    });
  }, [testData.questions, searchQuery]);

  // Reset current result index when search changes
  useEffect(() => {
    setCurrentResultIndex(0);
  }, [searchQuery, filteredQuestions.length]);

  // Navigate to next result
  const handleNextResult = () => {
    if (filteredQuestions.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % filteredQuestions.length;
    setCurrentResultIndex(nextIndex);
    scrollToQuestion(nextIndex);
  };

  // Navigate to previous result
  const handlePrevResult = () => {
    if (filteredQuestions.length === 0) return;
    const prevIndex = (currentResultIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
    setCurrentResultIndex(prevIndex);
    scrollToQuestion(prevIndex);
  };

  // Scroll to specific question
  const scrollToQuestion = (index: number) => {
    const ref = questionRefs.current[index];
    if (ref && scrollViewRef.current) {
      ref.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        },
        () => {}
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay with Blur */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.blurBackground} />
          <View style={styles.loaderContainer}>
            <Animated.View
              style={[
                styles.loaderCircle,
                {
                  transform: [{ rotate: spin }, { scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.loaderRing, { borderTopColor: colors.primary }]} />
            </Animated.View>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loaderSpinner}
            />
            <Text style={[styles.loaderText, { color: colors.text }]}>
              {t('test.loadingPreview')}
            </Text>
            <View style={styles.loaderDots}>
              <Animated.View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Animated.View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Animated.View style={[styles.dot, { backgroundColor: colors.primary }]} />
            </View>
          </View>
        </View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('test.testPreview')}</Text>
          <Text style={styles.headerSubtitle}>{testData.title}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('test.searchQuestions')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Navigation */}
        {searchQuery.trim() && filteredQuestions.length > 0 && (
          <View style={styles.searchNavigation}>
            <View style={styles.searchResultInfo}>
              <Text style={styles.searchResultText}>
                {currentResultIndex + 1} / {filteredQuestions.length}
              </Text>
            </View>
            <View style={styles.searchNavButtons}>
              <TouchableOpacity
                style={styles.navArrowButton}
                onPress={handlePrevResult}
                disabled={filteredQuestions.length === 0}
              >
                <Ionicons name="chevron-up" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navArrowButton}
                onPress={handleNextResult}
                disabled={filteredQuestions.length === 0}
              >
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {searchQuery.trim() 
              ? t('test.foundQuestions', { count: filteredQuestions.length, total: testData.questions.length })
              : `${t('test.totalQuestions')}: ${testData.questions.length}`
            }
          </Text>
        </View>
      </View>

      {/* Questions List */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>{t('test.noQuestionsFound')}</Text>
            <Text style={styles.emptyStateHint}>{t('test.tryDifferentSearch')}</Text>
          </View>
        ) : (
          filteredQuestions.map((question, index) => {
            const correctAnswerIndex = question.answers.findIndex(a => a.isCorrect);
            
            return (
              <View 
                key={question.id} 
                style={styles.questionCard}
                ref={(ref) => { questionRefs.current[index] = ref; }}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.questionText}>
                    {highlightText(question.question, searchQuery)}
                  </Text>
                </View>

                <View style={styles.answersContainer}>
                  {question.answers.map((answer, ansIndex) => {
                    const isCorrect = ansIndex === correctAnswerIndex;
                    
                    return (
                      <View
                        key={ansIndex}
                        style={[
                          styles.answerCard,
                          isCorrect && styles.answerCardCorrect,
                        ]}
                      >
                        <View style={[
                          styles.answerIcon,
                          isCorrect && styles.answerIconCorrect,
                        ]}>
                          {isCorrect ? (
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                          ) : (
                            <Text style={styles.answerLetter}>
                              {String.fromCharCode(65 + ansIndex)}
                            </Text>
                          )}
                        </View>
                        <Text style={[
                          styles.answerText,
                          isCorrect && styles.answerTextCorrect,
                        ]}>
                          {highlightText(answer.text, searchQuery)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },
    resultsInfo: {
      marginTop: 8,
      alignItems: 'center',
    },
    resultsText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    searchNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary + '30',
    },
    searchResultInfo: {
      flex: 1,
    },
    searchResultText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    searchNavButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    navArrowButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateHint: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colors.border,
    },
    questionHeader: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
    },
    questionNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    questionNumberText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
    },
    questionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
    },
    answersContainer: {
      gap: 10,
    },
    answerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 12,
    },
    answerCardCorrect: {
      backgroundColor: '#10B981' + '15',
      borderColor: '#10B981',
    },
    answerIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    answerIconCorrect: {
      backgroundColor: '#10B981',
    },
    answerLetter: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    answerText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      lineHeight: 20,
    },
    answerTextCorrect: {
      color: '#10B981',
      fontWeight: '700',
    },
    // Loader styles
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
    },
    blurBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background + 'E6',
    },
    loaderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 32,
      padding: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 16,
      borderWidth: 2,
      borderColor: colors.border,
    },
    loaderCircle: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    loaderRing: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      borderColor: colors.border,
      borderStyle: 'solid',
    },
    loaderSpinner: {
      position: 'absolute',
      top: 32,
    },
    loaderText: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 12,
    },
    loaderDots: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      opacity: 0.8,
    },
  });
