import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Dimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { MaterialDetail, MaterialDetailTranslation } from '../types/academic';
import { showToast } from '../utils/toast';
import { DocumentReader } from '../components/DocumentReader';
import { AudioPlayer } from '../components/AudioPlayer';

interface MaterialViewerScreenProps {
  material: MaterialDetail;
  translation: MaterialDetailTranslation;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const MaterialViewerScreen: React.FC<MaterialViewerScreenProps> = ({
  material,
  translation,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const getFileType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  // Sort paths so MD files are first
  const paths = React.useMemo(() => {
    const allPaths = translation.paths || [];
    return [...allPaths].sort((a, b) => {
      const typeA = getFileType(a);
      const typeB = getFileType(b);
      
      // MD files first
      if (typeA === 'md' && typeB !== 'md') return -1;
      if (typeA !== 'md' && typeB === 'md') return 1;
      
      // Then other documents
      const docsA = ['txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'json'].includes(typeA);
      const docsB = ['txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'json'].includes(typeB);
      if (docsA && !docsB) return -1;
      if (!docsA && docsB) return 1;
      
      // Then images
      const imgA = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(typeA);
      const imgB = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(typeB);
      if (imgA && !imgB) return -1;
      if (!imgA && imgB) return 1;
      
      // Audio last
      return 0;
    });
  }, [translation.paths]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  const getFileIcon = (path: string): string => {
    const fileType = getFileType(path);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return 'image';
    } else if (fileType === 'md') {
      return 'logo-markdown';
    } else if (fileType === 'pdf') {
      return 'document-text';
    } else if (['ppt', 'pptx'].includes(fileType)) {
      return 'easel';
    } else if (['doc', 'docx', 'txt'].includes(fileType)) {
      return 'document';
    } else if (fileType === 'json') {
      return 'code-slash';
    } else if (['mp4', 'avi', 'mov'].includes(fileType)) {
      return 'videocam';
    } else if (['mp3', 'wav'].includes(fileType)) {
      return 'musical-notes';
    }
    return 'attach';
  };

  const isImageFile = (path: string): boolean => {
    const fileType = getFileType(path);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
  };

  const isDocumentFile = (path: string): boolean => {
    const fileType = getFileType(path);
    return ['md', 'txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'json'].includes(fileType);
  };

  const isAudioFile = (path: string): boolean => {
    const fileType = getFileType(path);
    return ['mp3', 'wav', 'ogg', 'm4a'].includes(fileType);
  };

  const handleOpenFile = async (path: string) => {
    try {
      const supported = await Linking.canOpenURL(path);
      if (supported) {
        await Linking.openURL(path);
      } else {
        showToast.error('Cannot open this file type', t('common.error'));
      }
    } catch (error) {
      console.error('Error opening file:', error);
      showToast.error('Failed to open file', t('common.error'));
    }
  };

  const handleDownloadFile = (path: string) => {
    showToast.info('Download started', 'Download');
    Linking.openURL(path);
  };

  const currentFile = paths[selectedFileIndex];
  const canShowReader = currentFile && !isImageFile(currentFile);
  
  // Find audio file in paths - optional, document can be viewed without it
  const audioFile = paths.find(path => isAudioFile(path)) || undefined;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with File Selector */}
      {!isDocumentFile(currentFile || '') && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {translation.name}
            </Text>
            {paths.length > 1 && (
              <TouchableOpacity 
                style={styles.fileSelector}
                onPress={() => setShowFileSelector(true)}
              >
                <Ionicons name={getFileIcon(currentFile) as any} size={16} color={colors.primary} />
                <Text style={styles.fileSelectorText}>
                  {getFileType(currentFile).toUpperCase()} {selectedFileIndex + 1} / {paths.length}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerActions}>
            {currentFile && getFileType(currentFile) !== 'md' && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => handleDownloadFile(currentFile)}
              >
                <Ionicons name="download-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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
              {paths.map((path, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.fileItem,
                    selectedFileIndex === index && styles.fileItemActive,
                  ]}
                  onPress={() => {
                    setSelectedFileIndex(index);
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

      {/* File Viewer */}
      {!currentFile ? (
        <View style={styles.emptyContainer}>
          <View style={styles.fileIconLarge}>
            <Ionicons
              name="folder-open-outline"
              size={80}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.emptyTitle}>No files available</Text>
          <Text style={styles.emptyText}>This material has no attached files</Text>
        </View>
      ) : isImageFile(currentFile) ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.imageViewer}>
            <Image
              source={{ uri: currentFile }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      ) : isDocumentFile(currentFile) ? (
        <View style={styles.documentReader}>
          <DocumentReader
            fileUrl={currentFile}
            fileType={getFileType(currentFile)}
            materialName={translation.name}
            files={paths}
            selectedFileIndex={selectedFileIndex}
            onFileChange={setSelectedFileIndex}
            onBack={onBack}
            onError={() => showToast.error('Failed to load document', t('common.error'))}
            audioFile={audioFile}
          />
        </View>
      ) : isAudioFile(currentFile) ? (
        <View style={styles.audioContainer}>
          <AudioPlayer
            audioUrl={currentFile}
            fileName={currentFile.split('/').pop()}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.fileIconLarge}>
            <Ionicons
              name={getFileIcon(currentFile) as any}
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>Preview not available</Text>
          <Text style={styles.emptyText}>
            This file type cannot be previewed in the app
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownloadFile(currentFile)}
          >
            <Ionicons name="download-outline" size={24} color="#FFF" />
            <Text style={styles.downloadButtonText}>Download File</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
      paddingVertical: 16,
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
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    fileSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
      marginTop: 4,
    },
    fileSelectorText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabsContainer: {
      maxHeight: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    tabActive: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    imageViewer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      minHeight: 400,
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewImage: {
      width: width - 40,
      height: 400,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    fileIconLarge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    documentReader: {
      flex: 1,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 16,
      borderRadius: 16,
      gap: 12,
      marginTop: 20,
    },
    downloadButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileItemActive: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    fileItemIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    fileItemContent: {
      flex: 1,
    },
    fileItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    fileItemTitleActive: {
      color: colors.primary,
    },
    fileItemPath: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    audioContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: 20,
    },
  });
