import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
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
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
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
  }, []);

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
    if (flatListRef.current && filteredQuestions.length > 0) {
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch (error) {
        // Handle scroll error silently
      }
    }
  };

  // Render question item
  const renderQuestionItem = useCallback(({ item: question, index }: { item: TestQuestion; index: number }) => {
    const correctAnswerIndex = question.answers.findIndex(a => a.isCorrect);
    
    return (
      <View style={styles.questionCard}>
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
  }, [searchQuery, styles]);

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyStateText}>{t('test.noQuestionsFound')}</Text>
      <Text style={styles.emptyStateHint}>{t('test.tryDifferentSearch')}</Text>
    </View>
  );

  // Key extractor
  const keyExtractor = useCallback((item: TestQuestion) => item.id.toString(), []);

  // Get item layout for better scroll performance
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 200, // Approximate height
    offset: 200 * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
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
      <FlatList
        ref={flatListRef}
        data={filteredQuestions}
        renderItem={renderQuestionItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={21}
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }
          }, 100);
        }}
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
  });
