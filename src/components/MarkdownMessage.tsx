import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  typingSpeed?: number; // milliseconds per character
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isStreaming = false,
  typingSpeed = 20,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(content.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    }
  }, [content, currentIndex, isStreaming, typingSpeed]);

  // Reset when content changes
  useEffect(() => {
    if (isStreaming) {
      setCurrentIndex(0);
      setDisplayedContent('');
    } else {
      setDisplayedContent(content);
    }
  }, [content]);

  const styles = createMarkdownStyles(colors);

  return (
    <View>
      <Markdown style={styles}>
        {displayedContent || content}
      </Markdown>
      {isStreaming && currentIndex < content.length && (
        <Text style={[localStyles.cursorText, { color: colors.primary }]}>|</Text>
      )}
    </View>
  );
};

const createMarkdownStyles = (colors: ReturnType<typeof getThemeColors>) => ({
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    flexWrap: 'wrap' as const,
    flexShrink: 1,
  },
  heading1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 12,
    marginBottom: 4,
  },
  heading4: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 10,
    marginBottom: 4,
  },
  heading5: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  heading6: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 6,
    marginBottom: 4,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  em: {
    fontStyle: 'italic' as const,
    color: colors.text,
  },
  code_inline: {
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: `${colors.primary}10`,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  fence: {
    backgroundColor: `${colors.primary}10`,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  blockquote: {
    backgroundColor: `${colors.textSecondary}10`,
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  list_item: {
    marginVertical: 4,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  bullet_list_icon: {
    color: colors.primary,
    fontSize: 15,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: colors.primary,
    fontSize: 15,
    marginRight: 8,
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 16,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline' as const,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
    borderRadius: 4,
    backgroundColor: `${colors.primary}08`,
  },
  thead: {
    backgroundColor: `${colors.primary}15`,
  },
  tbody: {},
  th: {
    padding: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: 'bold' as const,
    color: colors.text,
    fontSize: 12,
    backgroundColor: `${colors.primary}10`,
    flexWrap: 'wrap' as const,
    flex: 1,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  td: {
    padding: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 12,
    flexWrap: 'wrap' as const,
    flex: 1,
  },
  paragraph: {
    marginVertical: 4,
    color: colors.text,
    flexShrink: 1,
    flexWrap: 'wrap' as const,
  },
  text: {
    color: colors.text,
    flexWrap: 'wrap' as const,
    flexShrink: 1,
  },
});

const localStyles = StyleSheet.create({
  cursor: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  cursorText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
