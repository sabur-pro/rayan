import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../theme/colors';
import { AudioPlayer } from '../AudioPlayer';

interface MarkdownViewerProps {
  content: string;
  materialName?: string;
  files?: string[];
  selectedFileIndex?: number;
  onFileChange?: (index: number) => void;
  onBack?: () => void;
  audioFile?: string;
}

const { width } = Dimensions.get('window');

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ 
  content,
  materialName,
  files = [],
  selectedFileIndex = 0,
  onFileChange,
  onBack,
  audioFile,
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const lastScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  // Smooth hide/show header animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: showHeader ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: showHeader ? 0 : -120,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showHeader, headerOpacity, headerTranslateY]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
      if (showHeader) setShowHeader(false);
    } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 50) {
      if (!showHeader) setShowHeader(true);
    }
    
    lastScrollY.current = currentScrollY;
  }, [showHeader]);

  // Find all matches
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const found = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      found.push({
        index: match.index,
        text: match[0],
        length: match[0].length,
      });
    }
    return found;
  }, [content, searchQuery]);

  // Auto-scroll to current match
  useEffect(() => {
    if (matches.length > 0 && scrollViewRef.current) {
      const currentMatch = matches[currentMatchIndex];
      // Calculate approximate scroll position based on character position
      // Assuming average line height of 26px and ~80 chars per line
      const linesBeforeMatch = Math.floor(currentMatch.index / 80);
      const approximateY = linesBeforeMatch * 26;
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, approximateY - 200),
          animated: true,
        });
      }, 150);
    }
  }, [currentMatchIndex, matches]);

  const handleNextMatch = useCallback(() => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  }, [matches.length]);

  const handlePrevMatch = useCallback(() => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  }, [matches.length]);

  const getFileType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  const getFileIcon = (path: string): string => {
    const fileType = getFileType(path);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return 'image';
    } else if (fileType === 'md') {
      return 'logo-markdown';
    } else if (fileType === 'pdf') {
      return 'document-text';
    }
    return 'document';
  };

  // Memoized HTML styles
  const htmlTagsStyles = useMemo<Readonly<Record<string, MixedStyleDeclaration>>>(() => ({
    body: { color: colors.text, fontSize: 16 },
    h1: { color: colors.text, fontSize: 32, fontWeight: '700' as '700', marginVertical: 16, textAlign: 'center' as 'center' },
    h2: { color: colors.text, fontSize: 28, fontWeight: '700' as '700', marginVertical: 14, textAlign: 'center' as 'center' },
    h3: { color: colors.text, fontSize: 24, fontWeight: '700' as '700', marginVertical: 12 },
    h4: { color: colors.text, fontSize: 20, fontWeight: '600' as '600', marginVertical: 10 },
    p: { color: colors.text, fontSize: 16, lineHeight: 26, marginBottom: 16 },
    a: { color: colors.primary, textDecorationLine: 'underline' as 'underline', fontWeight: '600' as '600' },
    img: { borderRadius: 12, marginVertical: 16, maxWidth: '100%' },
    code: { backgroundColor: colors.surface, color: colors.primary, fontFamily: 'monospace', fontSize: 14, padding: 4, borderRadius: 4 },
    pre: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginVertical: 12 },
    mark: { backgroundColor: colors.primary + '30', color: colors.text, padding: 2, borderRadius: 3 },
    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginVertical: 16, overflow: 'hidden' as 'hidden' },
    thead: { backgroundColor: colors.surface },
    tbody: { backgroundColor: colors.background },
    tr: { borderBottomWidth: 1, borderBottomColor: colors.border },
    th: { padding: 12, fontWeight: '700' as '700', color: colors.text, textAlign: 'left' as 'left', borderRightWidth: 1, borderRightColor: colors.border },
    td: { padding: 12, color: colors.text, textAlign: 'left' as 'left', borderRightWidth: 1, borderRightColor: colors.border },
  }), [colors]);

  const htmlRenderersProps = useMemo(() => ({
    img: {
      enableExperimentalPercentWidth: true,
    },
    a: {
      onPress: (_: any, url: string) => {
        Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
        return false;
      },
    },
  }), []);

  const markdownStylesConfig = useMemo(() => markdownStyles(colors), [colors]);

  // Parse content with search highlighting
  const renderContent = useMemo(() => {
    let processedContent = content;

    // Apply highlighting for matches
    if (searchQuery.trim() !== '' && matches.length > 0) {
      let offset = 0;
      matches.forEach((match, idx) => {
        const isCurrentMatch = idx === currentMatchIndex;
        const before = processedContent.slice(0, match.index + offset);
        const matchText = match.text;
        const after = processedContent.slice(match.index + offset + matchText.length);
        
        const highlightColor = isCurrentMatch ? colors.primary + '60' : colors.primary + '30';
        const highlightTag = `<mark style="background-color: ${highlightColor}; padding: 3px 5px; border-radius: 4px;">${matchText}</mark>`;
        
        processedContent = before + highlightTag + after;
        offset += highlightTag.length - matchText.length;
      });
    }

    // Split content into HTML and Markdown blocks
    const parts: React.ReactElement[] = [];
    const lines = processedContent.split('\n');
    let currentBlock = '';
    let isHtmlBlock = false;
    let blockKey = 0;

    const flushBlock = (isHtml: boolean) => {
      if (!currentBlock.trim()) return;

      if (isHtml) {
        parts.push(
          <RenderHtml
            key={`block-${blockKey++}`}
            contentWidth={width - 40}
            source={{ html: currentBlock }}
            tagsStyles={htmlTagsStyles}
            enableExperimentalMarginCollapsing
            defaultTextProps={{ style: { color: colors.text } }}
            renderersProps={htmlRenderersProps}
          />
        );
      } else {
        parts.push(
          <Markdown 
            key={`block-${blockKey++}`} 
            style={markdownStylesConfig}
            onLinkPress={(url) => {
              Linking.openURL(url);
              return false;
            }}
          >
            {currentBlock}
          </Markdown>
        );
      }
      currentBlock = '';
    };

    lines.forEach((line) => {
      const hasHtml = /<[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>|<mark/.test(line);
      
      if (hasHtml !== isHtmlBlock) {
        flushBlock(isHtmlBlock);
        isHtmlBlock = hasHtml;
      }
      
      currentBlock += line + '\n';
    });

    flushBlock(isHtmlBlock);

    return parts;
  }, [content, searchQuery, matches, currentMatchIndex, colors, htmlTagsStyles, htmlRenderersProps, markdownStylesConfig]);

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }
      ]}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            {materialName && (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {materialName}
              </Text>
            )}
            {files.length > 1 && onFileChange && (
              <TouchableOpacity 
                style={styles.fileSelector}
                onPress={() => setShowFileSelector(true)}
              >
                <Ionicons name={getFileIcon(files[selectedFileIndex]) as any} size={14} color={colors.primary} />
                <Text style={styles.fileSelectorText}>
                  {getFileType(files[selectedFileIndex]).toUpperCase()} {selectedFileIndex + 1} / {files.length}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentMatchIndex(0);
            }}
          />
          {searchQuery.length > 0 && (
            <>
              <View style={styles.matchCounter}>
                <Text style={styles.matchCounterText}>
                  {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0'}
                </Text>
              </View>
              <TouchableOpacity onPress={handlePrevMatch} style={styles.navButton} disabled={matches.length === 0}>
                <Ionicons name="chevron-up" size={20} color={matches.length > 0 ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMatch} style={styles.navButton} disabled={matches.length === 0}>
                <Ionicons name="chevron-down" size={20} color={matches.length > 0 ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>

      {/* File Selector Bottom Sheet */}
      {showFileSelector && (
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={() => setShowFileSelector(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Выберите файл</Text>
              <TouchableOpacity onPress={() => setShowFileSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetContent}>
              {files.map((path, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.fileItem,
                    selectedFileIndex === index && styles.fileItemActive,
                  ]}
                  onPress={() => {
                    onFileChange?.(index);
                    setShowFileSelector(false);
                  }}
                >
                  <View style={styles.fileItemIcon}>
                    <Ionicons
                      name={getFileIcon(path) as any}
                      size={24}
                      color={selectedFileIndex === index ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.fileItemContent}>
                    <Text style={[
                      styles.fileItemTitle,
                      selectedFileIndex === index && styles.fileItemTitleActive
                    ]}>
                      {getFileType(path).toUpperCase()} файл {index + 1}
                    </Text>
                    <Text style={styles.fileItemPath} numberOfLines={1}>
                      {path.split('/').pop()}
                    </Text>
                  </View>
                  {selectedFileIndex === index && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Markdown Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          audioFile ? { paddingBottom: 70 } : undefined // Extra space at bottom for audio player if present
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        {renderContent}
      </ScrollView>

      {/* Compact Audio Player at bottom - only shown if audio file exists */}
      {audioFile && audioFile.trim() !== '' && (
        <View style={styles.audioPlayerContainer}>
          <AudioPlayer
            audioUrl={audioFile}
            fileName={audioFile.split('/').pop() || 'Audio'}
            compact={true}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
      marginBottom: 4,
    },
    fileSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      alignSelf: 'flex-start',
    },
    fileSelectorText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    matchCounter: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 6,
    },
    matchCounterText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    navButton: {
      padding: 4,
      marginLeft: 4,
    },
    clearButton: {
      marginLeft: 4,
      padding: 4,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingTop: 150,
      paddingBottom: 40,
    },
    bottomSheetOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
    },
    overlayBackground: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bottomSheetTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    bottomSheetContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileItemActive: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    fileItemIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    fileItemContent: {
      flex: 1,
    },
    fileItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    fileItemTitleActive: {
      color: colors.primary,
    },
    fileItemPath: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    audioPlayerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
  });

const markdownStyles = (colors: typeof lightTheme) => ({
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
  },
  heading1: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  heading2: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  heading3: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 10,
  },
  paragraph: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
  strong: {
    fontWeight: '700' as const,
    color: colors.primary,
  },
  code_inline: {
    backgroundColor: colors.surface,
    color: colors.primary,
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline' as const,
    fontWeight: '600' as const,
  },
  blocklink: {
    color: colors.primary,
    textDecorationLine: 'underline' as const,
    fontWeight: '600' as const,
  },
  image: {
    borderRadius: 12,
    marginVertical: 16,
    maxWidth: width - 40,
    resizeMode: 'contain' as const,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginVertical: 16,
  },
  thead: {
    backgroundColor: colors.surface,
  },
  tbody: {
    backgroundColor: colors.background,
  },
  th: {
    padding: 12,
    fontWeight: '700' as const,
    color: colors.text,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  td: {
    padding: 12,
    color: colors.text,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
});
