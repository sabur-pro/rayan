import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../services/chatService';
import { MaterialDetail, MaterialDetailTranslation } from '../types/academic';
import { ChatSessionMessage, ChatEventData, ChatHistoryMessage } from '../types/ai';
import { showToast } from '../utils/toast';
import { ChatHistoryDrawer } from '../components/ChatHistoryDrawer';
import { ThinkingAnimation } from '../components/ThinkingAnimation';
import { MarkdownMessage } from '../components/MarkdownMessage';

interface ChatScreenProps {
  material: MaterialDetail | null;
  translation: MaterialDetailTranslation | null;
  onBack: () => void;
  existingChatId?: string | null;
  isGeneralChat?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  material,
  translation,
  onBack,
  existingChatId,
  isGeneralChat = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { accessToken, refreshAccessToken } = useAuth();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [messages, setMessages] = useState<ChatSessionMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Set token refresh callback
  // Load existing chat if existingChatId provided
  useEffect(() => {
    if (existingChatId && accessToken) {
      console.log('[ChatScreen] Loading existing chat:', existingChatId);
      loadChatMessages(existingChatId, '');
    }
  }, [existingChatId]);

  useEffect(() => {
    chatService.setTokenRefreshCallback(async () => {
      console.log('[ChatScreen] Token refresh requested');
      const success = await refreshAccessToken();
      if (success && accessToken) {
        console.log('[ChatScreen] Token refreshed successfully');
        return accessToken;
      }
      console.error('[ChatScreen] Token refresh failed');
      return null;
    });
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isStreaming) {
        chatService.cancelStream();
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isStreaming]);

  useEffect(() => {
    if (messages.length > 0 || currentStreamingMessage) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, currentStreamingMessage]);

  const handleBackPress = () => {
    if (isStreaming) {
      chatService.cancelStream();
    }
    onBack();
  };

  const handleNewChat = () => {
    console.log('[ChatScreen] Starting new chat');
    setMessages([]);
    setChatId(null);
    setChatTitle('');
    setCurrentStreamingMessage('');
    setHasMoreMessages(false);
    setCurrentOffset(0);
  };

  const loadChatMessages = async (selectedChatId: string, title: string) => {
    if (!accessToken) return;

    try {
      setLoadingHistory(true);
      console.log('[ChatScreen] Loading chat messages for:', selectedChatId);
      
      const response = await chatService.getChatMessages(selectedChatId, 50, 0, accessToken);
      console.log('[ChatScreen] Loaded', response.messages.length, 'messages');
      
      const convertedMessages: ChatSessionMessage[] = response.messages.map((msg: ChatHistoryMessage) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isStreaming: false,
      }));

      setMessages(convertedMessages);
      setChatId(selectedChatId);
      setChatTitle(title);
      setHasMoreMessages(response.pagination.has_more);
      setCurrentOffset(response.messages.length);
      setShowHistory(false);
    } catch (error) {
      console.error('[ChatScreen] Error loading chat messages:', error);
      showToast.error(t('chat.errorLoadingMessages'), t('common.error'));
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingHistory || !chatId || !accessToken) return;

    try {
      setLoadingHistory(true);
      console.log('[ChatScreen] Loading more messages, offset:', currentOffset);
      
      const response = await chatService.getChatMessages(chatId, 50, currentOffset, accessToken);
      console.log('[ChatScreen] Loaded', response.messages.length, 'more messages');
      
      const convertedMessages: ChatSessionMessage[] = response.messages.map((msg: ChatHistoryMessage) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isStreaming: false,
      }));

      setMessages((prev) => [...convertedMessages, ...prev]);
      setHasMoreMessages(response.pagination.has_more);
      setCurrentOffset((prev) => prev + response.messages.length);
    } catch (error) {
      console.error('[ChatScreen] Error loading more messages:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectChatFromHistory = (selectedChatId: string, title: string) => {
    loadChatMessages(selectedChatId, title);
  };

  const handleSendMessage = async () => {
    const question = inputText.trim();
    // For existing chats or general chat, we don't need file URL
    const fileUrl = translation?.paths?.[0] || null;
    
    console.log('[ChatScreen] Sending message:', question);
    console.log('[ChatScreen] File URL:', fileUrl);
    console.log('[ChatScreen] Current Chat ID:', chatId);
    console.log('[ChatScreen] Existing Chat ID:', existingChatId);
    console.log('[ChatScreen] Is General Chat:', isGeneralChat);
    
    if (!question || isStreaming) {
      return;
    }
    
    // For new chats with material, we need a file URL (skip check for general chat)
    if (!chatId && !fileUrl && !isGeneralChat) {
      console.error('[ChatScreen] No file URL available for new chat');
      showToast.error(t('chat.noFileUrl') || 'Material has no file URL', t('common.error'));
      return;
    }

    if (!accessToken) {
      console.error('[ChatScreen] No access token');
      showToast.error('Authentication required', t('common.error'));
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatSessionMessage = {
      id: userMessageId,
      role: 'user',
      content: question,
      timestamp: new Date(),
      isStreaming: false,
    };

    console.log('[ChatScreen] Adding user message:', userMessage.id);
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: ChatSessionMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    
    console.log('[ChatScreen] Creating AI message placeholder:', aiMessageId);
    setMessages((prev) => [...prev, aiMessage]);

    let streamedContent = '';

    try {
      console.log('[ChatScreen] Starting SSE stream');
      await chatService.streamQuery(
        {
          question,
          file_url: isGeneralChat ? '' : (fileUrl || ''),
          chat_id: chatId || undefined,
        },
        (event: ChatEventData) => {
          console.log('[ChatScreen] Received SSE event:', event.type);

          if (event.type === 'metadata' && event.metadata?.chat_id) {
            const newChatId = event.metadata.chat_id;
            console.log('[ChatScreen] Received chat_id:', newChatId);
            setChatId(newChatId);
            if (!chatTitle) {
              setChatTitle(question);
            }
          } else if (event.type === 'answer' && event.content) {
            streamedContent += event.content;
            console.log(`[ChatScreen] Content received: ${streamedContent.length} chars total`);
            setCurrentStreamingMessage(streamedContent);
            
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          } else if (event.type === 'complete') {
            console.log('[ChatScreen] Stream completed, final length:', streamedContent.length);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: streamedContent, isStreaming: false }
                  : msg
              )
            );
          } else if (event.type === 'status' && event.content.includes('error')) {
            console.error('[ChatScreen] Stream error:', event.content);
            showToast.error(
              event.content || 'An error occurred',
              t('common.error')
            );
          }
        },
        accessToken
      );
    } catch (error: any) {
      console.error('[ChatScreen] Error in stream:', error);
      showToast.error(
        error.message || t('chat.errorSendingMessage') || 'Failed to send message',
        t('common.error')
      );
    } finally {
      console.log('[ChatScreen] Cleaning up, setting isStreaming to false');
      setIsStreaming(false);
      setCurrentStreamingMessage('');
    }
  };

  const handleStopStreaming = () => {
    chatService.cancelStream();
    setIsStreaming(false);
    
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
    setCurrentStreamingMessage('');
  };

  const renderMessage = (message: ChatSessionMessage, isLastMessage: boolean) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.aiMessageBubble,
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {message.content}
            </Text>
          ) : (
            <MarkdownMessage
              content={message.content || ''}
              isStreaming={message.isStreaming && isLastMessage}
              typingSpeed={15}
            />
          )}
        </View>
        
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatTitle || translation?.name || (isGeneralChat ? t('chat.generalChat') : t('chat.chatSession'))}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {chatId 
              ? `${t('chat.chatSession')}`
              : (isGeneralChat ? t('chat.generalChatSubtitle') : t('chat.newChat')) || 'Новый чат'
            }
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleNewChat}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowHistory(true)}>
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {hasMoreMessages && !loadingHistory && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMoreMessages}
            >
              <Text style={styles.loadMoreText}>
                {t('chat.loadMore') || 'Load more messages'}
              </Text>
              <Ionicons name="chevron-up" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {loadingHistory && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {messages.length === 0 && !loadingHistory ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyStateTitle}>
                {t('chat.startConversation') || 'Начните разговор'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {isGeneralChat 
                  ? (t('chat.askAnything') || 'Задайте любой вопрос')
                  : (t('chat.askAboutMaterial') || 'Задайте вопрос по материалу')
                }
              </Text>
            </View>
          ) : (
            <>
              {messages.map((message, index) =>
                renderMessage(message, index === messages.length - 1)
              )}
              
              {isStreaming && !currentStreamingMessage && (
                <ThinkingAnimation />
              )}
            </>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          {isStreaming && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopStreaming}
            >
              <Ionicons name="stop-circle" size={32} color={colors.error} />
              <Text style={styles.stopButtonText}>
                {t('chat.stopGenerating') || 'Остановить'}
              </Text>
            </TouchableOpacity>
          )}
          
          {!isStreaming && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={t('chat.typeYourQuestion') || 'Введите ваш вопрос...'}
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!isStreaming}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isStreaming) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isStreaming}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !isStreaming ? '#ffffff' : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {showHistory && (
        <ChatHistoryDrawer
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectChat={handleSelectChatFromHistory}
          accessToken={accessToken}
          colors={{
            background: colors.background,
            text: colors.text,
            textSecondary: colors.textSecondary,
            textTertiary: colors.textTertiary,
            border: colors.border,
            primary: colors.primary,
          }}
          translations={{
            history: t('chat.history'),
            noHistory: t('chat.noHistory'),
            messages: t('chat.messages'),
            yesterday: t('common.yesterday') || 'Yesterday',
          }}
        />
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
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
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIconContainer: {
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 20,
      alignSelf: 'center',
    },
    loadMoreText: {
      fontSize: 14,
      color: colors.primary,
      marginRight: 4,
      fontWeight: '500',
    },
    loadingMoreContainer: {
      padding: 16,
      alignItems: 'center',
    },
    messageContainer: {
      marginBottom: 12,
    },
    userMessageContainer: {
      alignSelf: 'flex-end',
    },
    aiMessageContainer: {
      alignSelf: 'flex-start',
    },
    messageBubble: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      maxWidth: '85%',
    },
    userMessageBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    aiMessageBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      maxWidth: '95%',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
    },
    userMessageText: {
      color: '#ffffff',
    },
    aiMessageText: {
      color: colors.text,
    },
    stopStreamingText: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
      marginHorizontal: 4,
    },
    messageTime: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 4,
      marginHorizontal: 4,
    },
    inputContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    textInput: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
      marginRight: 8,
    },
    sendButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    stopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: `${colors.error}15`,
      borderRadius: 12,
    },
    stopButtonText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
