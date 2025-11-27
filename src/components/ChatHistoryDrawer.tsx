import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { chatService } from '../services/chatService';
import { ChatHistorySession } from '../types/ai';

interface ChatHistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string, title: string) => void;
  accessToken: string | null;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    primary: string;
  };
  translations: {
    history: string;
    noHistory: string;
    messages: string;
    yesterday: string;
  };
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  visible,
  onClose,
  onSelectChat,
  accessToken,
  colors,
  translations,
}) => {
  const [sessions, setSessions] = useState<ChatHistorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  useEffect(() => {
    if (visible) {
      loadHistory();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadHistory = async (isRefresh = false) => {
    if (!accessToken) {
      console.error('[ChatHistoryDrawer] No access token');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('[ChatHistoryDrawer] Loading chat history...');
      const response = await chatService.getChatHistory(accessToken);
      console.log('[ChatHistoryDrawer] Loaded', response.count, 'sessions');
      setSessions(response.sessions);
    } catch (error: any) {
      console.error('[ChatHistoryDrawer] Error loading history:', error);
      // Обработка 401 ошибки
      if (error?.response?.status === 401 || error?.status === 401) {
        console.log('[ChatHistoryDrawer] 401 error, token may be expired');
        // Можно добавить callback для обновления токена
        setSessions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadHistory(true);
  };

  const handleSelectSession = (session: ChatHistorySession) => {
    console.log('[ChatHistoryDrawer] Selected session:', session.id);
    onSelectChat(session.id, session.title);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return translations.yesterday || 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!visible) return null;

  const styles = createStyles(colors);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: slideAnim.interpolate({ inputRange: [-300, 0], outputRange: [0, 1] }) },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{translations.history}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{translations.noHistory}</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.sessionsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    progressBackgroundColor={colors.background}
                  />
                }
              >
                {sessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionItem}
                    onPress={() => handleSelectSession(session)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sessionContent}>
                      <Text style={styles.sessionTitle} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <View style={styles.sessionMeta}>
                        <Text style={styles.sessionMetaText}>
                          {session.message_count} {translations.messages}
                        </Text>
                        <Text style={styles.sessionMetaText}>•</Text>
                        <Text style={styles.sessionMetaText}>
                          {formatDate(session.updated_at)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: {
  background: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
}) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
      width: 300,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    drawerContent: {
      flex: 1,
      paddingTop: 44,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    closeText: {
      fontSize: 24,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sessionsList: {
      flex: 1,
    },
    sessionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionContent: {
      flex: 1,
    },
    sessionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    sessionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionMetaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    chevron: {
      fontSize: 24,
      color: colors.textTertiary,
      marginLeft: 8,
    },
  });
