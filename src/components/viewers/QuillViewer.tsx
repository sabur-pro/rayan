import React, { useMemo, useState, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput,
  TouchableOpacity,
  Text,
  Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, getThemeColors } from '../../theme/colors';
import { quillDeltaToHtml, QuillDelta } from '../../utils/quillDeltaToHtml';

interface QuillViewerProps {
  delta: QuillDelta;
  onBack?: () => void;
  title?: string;
}

/**
 * QuillViewer component
 * Displays Quill Delta format content (.json files from server)
 */
export const QuillViewer: React.FC<QuillViewerProps> = ({ delta, onBack, title }) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHeader, setShowHeader] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Hide/show header animation
  const hideHeader = useCallback(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslateY]);

  const showHeaderAnimated = useCallback(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, headerTranslateY]);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      webViewRef.current?.injectJavaScript(`
        window.goToPage(${newPage});
        true;
      `);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      webViewRef.current?.injectJavaScript(`
        window.goToPage(${newPage});
        true;
      `);
    }
  }, [currentPage]);

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentMatchIndex(0);
    
    if (query.trim()) {
      // Inject search script
      webViewRef.current?.injectJavaScript(`
        window.performSearch("${query.replace(/"/g, '\\"')}");
        true;
      `);
    } else {
      // Clear highlights
      webViewRef.current?.injectJavaScript(`
        window.clearSearch();
        true;
      `);
    }
  }, []);

  const handleNextMatch = useCallback(() => {
    if (matchCount > 0) {
      const newIndex = (currentMatchIndex + 1) % matchCount;
      setCurrentMatchIndex(newIndex);
      webViewRef.current?.injectJavaScript(`
        window.scrollToMatch(${newIndex});
        true;
      `);
    }
  }, [matchCount, currentMatchIndex]);

  const handlePrevMatch = useCallback(() => {
    if (matchCount > 0) {
      const newIndex = (currentMatchIndex - 1 + matchCount) % matchCount;
      setCurrentMatchIndex(newIndex);
      webViewRef.current?.injectJavaScript(`
        window.scrollToMatch(${newIndex});
        true;
      `);
    }
  }, [matchCount, currentMatchIndex]);

  const htmlContent = useMemo(() => {
    const isDarkTheme = theme === 'dark';
    const bodyHtml = quillDeltaToHtml(delta, isDarkTheme);
    const backgroundColor = colors.background;
    const textColor = colors.text;
    const fontSize = 16;
    const padding = 16;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.6;
              color: ${textColor};
              background-color: ${colors.background};
              padding: ${padding}px;
              padding-top: 90px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            h1, h2, h3, h4, h5, h6 {
              margin: 20px 0 10px 0;
              font-weight: 600;
              line-height: 1.3;
              color: ${textColor};
            }
            
            h1 { font-size: ${fontSize * 2}px; }
            h2 { font-size: ${fontSize * 1.75}px; }
            h3 { font-size: ${fontSize * 1.5}px; }
            h4 { font-size: ${fontSize * 1.25}px; }
            h5 { font-size: ${fontSize * 1.1}px; }
            h6 { font-size: ${fontSize}px; }
            
            p {
              margin: 8px 0;
            }
            
            strong {
              font-weight: 700;
            }
            
            em {
              font-style: italic;
            }
            
            u {
              text-decoration: underline;
            }
            
            del {
              text-decoration: line-through;
            }
            
            a {
              color: ${colors.primary};
              text-decoration: none;
            }
            
            a:active {
              opacity: 0.7;
            }
            
            ul, ol {
              margin: 10px 0;
              padding-left: 28px;
            }
            
            li {
              margin: 6px 0;
              line-height: 1.6;
            }
            
            ul li {
              list-style-type: disc;
            }
            
            ol li {
              list-style-type: decimal;
            }
            
            blockquote {
              border-left: 4px solid ${colors.primary};
              margin: 15px 0;
              padding: 12px 20px;
              background-color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
              font-style: italic;
              border-radius: 4px;
            }
            
            pre {
              background-color: ${theme === 'dark' ? '#1e1e1e' : '#2d2d2d'};
              color: #f8f8f2;
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 15px 0;
              font-family: 'Courier New', Courier, 'Consolas', monospace;
              line-height: 1.5;
            }
            
            code {
              font-family: 'Courier New', Courier, 'Consolas', monospace;
              font-size: ${fontSize * 0.88}px;
              line-height: 1.5;
            }
            
            pre code {
              display: block;
              white-space: pre;
            }
            
            img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 15px 0;
              display: block;
              opacity: 0;
              transition: opacity 0.3s ease-in-out;
            }
            
            img.loaded {
              opacity: 1;
            }
            
            .img-skeleton {
              width: 100%;
              height: 200px;
              background: linear-gradient(90deg, ${theme === 'dark' ? '#2a2a2a' : '#f0f0f0'} 25%, ${theme === 'dark' ? '#333' : '#e0e0e0'} 50%, ${theme === 'dark' ? '#2a2a2a' : '#f0f0f0'} 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
              border-radius: 8px;
              margin: 15px 0;
            }
            
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            
            mark {
              background-color: ${colors.primary}40;
              color: inherit;
              padding: 2px 0;
              border-radius: 2px;
            }
            
            mark.current {
              background-color: ${colors.primary};
              color: white;
            }
            
            iframe {
              max-width: 100%;
              border-radius: 8px;
              margin: 15px 0;
            }
            
            [style*="text-align: center"] {
              text-align: center;
            }
            
            [style*="text-align: right"] {
              text-align: right;
            }
            
            [style*="text-align: justify"] {
              text-align: justify;
            }
          </style>
          <script>
            let matches = [];
            let currentMatchIndex = 0;
            let originalBodyHTML = '';
            
            // Image loading with skeleton
            document.addEventListener('DOMContentLoaded', function() {
              // Save original HTML
              originalBodyHTML = document.body.innerHTML;
              
              const images = document.querySelectorAll('img');
              images.forEach(img => {
                // Create skeleton
                const skeleton = document.createElement('div');
                skeleton.className = 'img-skeleton';
                img.parentNode.insertBefore(skeleton, img);
                
                // Handle image load
                img.onload = function() {
                  img.classList.add('loaded');
                  skeleton.remove();
                };
                
                img.onerror = function() {
                  skeleton.remove();
                  img.style.display = 'none';
                };
              });
            });
            
            // Search functions
            window.performSearch = function(query) {
              // Clear previous search
              if (matches.length > 0) {
                document.body.innerHTML = originalBodyHTML;
                matches = [];
              }
              
              if (!query || !query.trim()) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'searchResult',
                  count: 0
                }));
                return;
              }
              
              const body = document.body;
              const bodyText = body.innerText || body.textContent;
              
              // Escape special characters for regex
              let escapeRegex = query;
              const specials = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\\\'];
              specials.forEach(char => {
                const escaped = '\\\\' + char;
                escapeRegex = escapeRegex.split(char).join(escaped);
              });
              const regex = new RegExp(escapeRegex, 'gi');
              
              // Get all matches in the text
              const textMatches = [...bodyText.matchAll(regex)];
              
              if (textMatches.length === 0) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'searchResult',
                  count: 0
                }));
                return;
              }
              
              // Highlight using innerHTML replacement
              let highlightedHTML = body.innerHTML;
              
              // Replace all matches with mark tags
              // Sort by position descending to avoid index shifting
              const sortedMatches = textMatches.sort((a, b) => b.index - a.index);
              
              // Find and replace in HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = highlightedHTML;
              
              // Walk through all text nodes
              const walker = document.createTreeWalker(
                tempDiv,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              const nodesToProcess = [];
              let node;
              while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.trim() && 
                    !node.parentElement.closest('script') &&
                    !node.parentElement.closest('style')) {
                  nodesToProcess.push(node);
                }
              }
              
              let matchCount = 0;
              nodesToProcess.forEach(textNode => {
                const text = textNode.nodeValue;
                const nodeMatches = [...text.matchAll(regex)];
                
                if (nodeMatches.length > 0) {
                  const fragment = document.createDocumentFragment();
                  let lastIndex = 0;
                  
                  nodeMatches.forEach(match => {
                    // Add text before match
                    if (match.index > lastIndex) {
                      fragment.appendChild(
                        document.createTextNode(text.substring(lastIndex, match.index))
                      );
                    }
                    
                    // Add highlighted match
                    const mark = document.createElement('mark');
                    mark.textContent = match[0];
                    mark.dataset.matchIndex = matchCount;
                    if (matchCount === 0) {
                      mark.classList.add('current');
                    }
                    fragment.appendChild(mark);
                    matchCount++;
                    
                    lastIndex = match.index + match[0].length;
                  });
                  
                  // Add remaining text
                  if (lastIndex < text.length) {
                    fragment.appendChild(
                      document.createTextNode(text.substring(lastIndex))
                    );
                  }
                  
                  textNode.parentNode.replaceChild(fragment, textNode);
                }
              });
              
              // Update body with highlighted content
              body.innerHTML = tempDiv.innerHTML;
              
              // Collect all mark elements
              matches = Array.from(document.querySelectorAll('mark'));
              
              if (matches.length > 0) {
                currentMatchIndex = 0;
                matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              
              // Send count to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'searchResult',
                count: matches.length
              }));
            };
            
            window.clearSearch = function() {
              if (originalBodyHTML) {
                document.body.innerHTML = originalBodyHTML;
              }
              matches = [];
              currentMatchIndex = 0;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'searchResult',
                count: 0
              }));
            };
            
            window.scrollToMatch = function(index) {
              if (matches.length === 0) return;
              
              matches.forEach(m => m.classList.remove('current'));
              
              const match = matches[index];
              if (match) {
                match.classList.add('current');
                match.scrollIntoView({ behavior: 'smooth', block: 'center' });
                currentMatchIndex = index;
              }
            };
            
            // Pagination
            let currentPageNum = 1;
            let totalPagesNum = 1;
            const pageHeight = window.innerHeight;
            
            function calculatePages() {
              const contentHeight = document.body.scrollHeight;
              totalPagesNum = Math.ceil(contentHeight / pageHeight);
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pageInfo',
                totalPages: totalPagesNum,
                currentPage: currentPageNum
              }));
            }
            
            window.goToPage = function(pageNum) {
              if (pageNum < 1 || pageNum > totalPagesNum) return;
              
              currentPageNum = pageNum;
              const scrollY = (pageNum - 1) * pageHeight;
              
              window.scrollTo({
                top: scrollY,
                behavior: 'smooth'
              });
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pageInfo',
                totalPages: totalPagesNum,
                currentPage: currentPageNum
              }));
            };
            
            // Scroll tracking
            let scrollTimeout;
            window.addEventListener('scroll', function() {
              clearTimeout(scrollTimeout);
              
              scrollTimeout = setTimeout(function() {
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                
                // Send scroll position
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'scroll',
                  scrollY: scrollY
                }));
                
                // Update current page based on scroll
                const newPage = Math.floor(scrollY / pageHeight) + 1;
                if (newPage !== currentPageNum && newPage <= totalPagesNum) {
                  currentPageNum = newPage;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'pageInfo',
                    totalPages: totalPagesNum,
                    currentPage: currentPageNum
                  }));
                }
              }, 100);
            });
            
            // Initialize pagination after load
            window.addEventListener('load', function() {
              setTimeout(calculatePages, 500);
            });
          </script>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `;
  }, [delta, colors, theme]);

  const styles = createStyles(colors);

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'searchResult') {
        setMatchCount(data.count);
      } else if (data.type === 'scroll') {
        const currentScrollY = data.scrollY;
        const scrollDelta = currentScrollY - lastScrollY.current;
        
        // Hide header when scrolling down, show when scrolling up
        if (scrollDelta > 10 && currentScrollY > 100) {
          hideHeader();
        } else if (scrollDelta < -10 || currentScrollY < 50) {
          showHeaderAnimated();
        }
        
        lastScrollY.current = currentScrollY;
      } else if (data.type === 'pageInfo') {
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView - fills entire area */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        onMessage={handleMessage}
      />
      
      {/* Header with search - positioned absolutely on top */}
      <Animated.View style={[
        styles.header, 
        { 
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <>
              <View style={styles.matchCounter}>
                <Text style={styles.matchCounterText}>
                  {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={handlePrevMatch} 
                style={styles.navButton} 
                disabled={matchCount === 0}
              >
                <Ionicons 
                  name="chevron-up" 
                  size={20} 
                  color={matchCount > 0 ? colors.primary : colors.textTertiary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleNextMatch} 
                style={styles.navButton} 
                disabled={matchCount === 0}
              >
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color={matchCount > 0 ? colors.primary : colors.textTertiary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleSearch('')} 
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
          </View>
        </View>
        
      </Animated.View>
      
      {/* Floating Pagination - Bottom Left Corner */}
      {totalPages > 1 && (
        <View style={styles.floatingPagination}>
          <TouchableOpacity 
            onPress={handlePrevPage} 
            style={[styles.floatingPageButton, currentPage === 1 && styles.floatingPageButtonDisabled]}
            disabled={currentPage === 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={16} 
              color={currentPage === 1 ? colors.textTertiary : colors.background} 
            />
          </TouchableOpacity>
          
          <View style={styles.floatingPageIndicator}>
            <Text style={styles.floatingPageText}>
              {currentPage}/{totalPages}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleNextPage} 
            style={[styles.floatingPageButton, currentPage === totalPages && styles.floatingPageButtonDisabled]}
            disabled={currentPage === totalPages}
          >
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={currentPage === totalPages ? colors.textTertiary : colors.background} 
            />
          </TouchableOpacity>
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
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 1000,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flex: 1,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    matchCounter: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
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
      padding: 4,
      marginLeft: 8,
    },
    floatingPagination: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    floatingPageButton: {
      padding: 4,
      borderRadius: 12,
    },
    floatingPageButtonDisabled: {
      opacity: 0.4,
    },
    floatingPageIndicator: {
      marginHorizontal: 6,
    },
    floatingPageText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.background,
      minWidth: 30,
      textAlign: 'center',
    },
    webView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });
