import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../theme/colors';
import {
  MarkdownViewer,
  TextViewer,
  ImageViewer,
  WebDocumentViewer,
  QuillViewer,
} from './viewers';
import { TestContainer } from './TestContainer';
import { parseTestFile } from '../utils/testParser';
import { TestData } from '../types/test';
import { QuillDelta } from '../utils/quillDeltaToHtml';

interface DocumentReaderProps {
  fileUrl: string;
  fileType: string;
  materialName?: string;
  files?: string[];
  selectedFileIndex?: number;
  onFileChange?: (index: number) => void;
  onBack?: () => void;
  onError?: () => void;
  audioFile?: string;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  fileUrl,
  fileType,
  materialName,
  files,
  selectedFileIndex,
  onFileChange,
  onBack,
  onError,
  audioFile,
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [content, setContent] = useState('');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [quillData, setQuillData] = useState<QuillDelta | null>(null);

  useEffect(() => {
    if (fileType === 'txt' || fileType === 'md') {
      loadTextContent();
    } else if (fileType === 'json') {
      loadJsonContent();
    } else {
      setLoading(false);
    }
  }, [fileUrl, fileType]);

  const loadTextContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(fileUrl);
      const text = await response.text();
      setContent(text);
      
      // Parse test if it's a .txt file
      if (fileType === 'txt') {
        try {
          const parsed = parseTestFile(text);
          setTestData(parsed);
        } catch (parseError) {
          console.error('Error parsing test file:', parseError);
          // If parsing fails, just show as regular text
          setTestData(null);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading file:', err);
      setError(true);
      setLoading(false);
      onError?.();
    }
  };

  const loadJsonContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(fileUrl);
      const json = await response.json();
      
      // Check if it's Quill Delta format
      if (json.ops && Array.isArray(json.ops)) {
        setQuillData(json);
      } else {
        // If not Quill format, show as plain text
        setContent(JSON.stringify(json, null, 2));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading JSON file:', err);
      setError(true);
      setLoading(false);
      onError?.();
    }
  };

  const isImageFile = (): boolean => {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase());
  };

  const isWebDocument = (): boolean => {
    return ['pdf', 'pptx', 'ppt', 'doc', 'docx'].includes(fileType.toLowerCase());
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error state  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorText}>Check your internet connection</Text>
      </View>
    );
  }

  // Markdown files - always render, even without audio file
  if (fileType === 'md') {
    return (
      <MarkdownViewer 
        content={content} 
        materialName={materialName}
        files={files}
        selectedFileIndex={selectedFileIndex}
        onFileChange={onFileChange}
        onBack={onBack}
        audioFile={audioFile && audioFile.trim() !== '' ? audioFile : undefined}
      />
    );
  }

  // Text files - show as test if parsed successfully, otherwise as plain text
  if (fileType === 'txt') {
    if (testData && testData.questions.length > 0) {
      return <TestContainer testData={testData} onBack={onBack || (() => {})} />;
    }
    return <TextViewer content={content} />;
  }

  // Image files
  if (isImageFile()) {
    return <ImageViewer imageUrl={fileUrl} />;
  }

  // PDF and Office files via WebView
  if (isWebDocument()) {
    return (
      <WebDocumentViewer
        fileUrl={fileUrl}
        fileType={fileType as 'pdf' | 'pptx' | 'ppt' | 'doc' | 'docx'}
      />
    );
  }

  // JSON files - Quill Delta format
  if (fileType === 'json') {
    if (quillData) {
      return <QuillViewer delta={quillData} onBack={onBack} title={materialName} />;
    }
    // If not Quill format, show as plain text
    return <TextViewer content={content} />;
  }

  // Unknown file type
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.errorTitle}>Unsupported file type</Text>
      <Text style={styles.errorText}>
        {fileType.toUpperCase()} files are not supported
      </Text>
    </View>
  );
};

const createStyles = (colors: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginTop: 8,
    },
  });
