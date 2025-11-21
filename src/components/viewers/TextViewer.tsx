import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, getThemeColors } from '../../theme/colors';

interface TextViewerProps {
  content: string;
}

const { width } = Dimensions.get('window');

export const TextViewer: React.FC<TextViewerProps> = ({ content }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    if (searchQuery.trim()) {
      const regex = new RegExp(searchQuery, 'gi');
      const found = content.match(regex);
      setMatches(found ? found.length : 0);
    } else {
      setMatches(0);
    }
  }, [searchQuery, content]);

  const renderHighlightedText = () => {
    if (!searchQuery.trim()) {
      return <Text style={styles.textContent}>{content}</Text>;
    }

    const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
    
    return (
      <Text style={styles.textContent}>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
          return (
            <Text key={index} style={isMatch ? styles.highlight : undefined}>
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in text..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <>
              <Text style={styles.matchCount}>{matches} matches</Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Search Toggle Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => setShowSearch(!showSearch)}
      >
        <Ionicons name="search" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Text Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {renderHighlightedText()}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      padding: 0,
    },
    matchCount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    searchButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingTop: 70,
    },
    textContent: {
      fontSize: 16,
      lineHeight: 26,
      color: colors.text,
      fontFamily: 'monospace',
    },
    highlight: {
      backgroundColor: colors.primary + '40',
      color: colors.primary,
      fontWeight: '700',
    },
  });
