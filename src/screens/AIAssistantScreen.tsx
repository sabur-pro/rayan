import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors } from '../theme/colors';
import { ChatMaterialSelectorScreen } from './ChatMaterialSelectorScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { MaterialDetail, MaterialDetailTranslation } from '../types/academic';
import { userService } from '../services/userService';
import { ExtendedUserProfile } from '../types/user';

type NavigationScreen = 'selector' | 'chat' | 'generalChat';

export const AIAssistantScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { accessToken } = useAuth();
  const navigation = useNavigation();
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('selector');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetail | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<MaterialDetailTranslation | null>(null);
  const [userData, setUserData] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingChatId, setExistingChatId] = useState<string | null>(null);
  const [selectorState, setSelectorState] = useState<{
    selectedSubject: any;
    selectedMaterialType: any;
    currentStep: 'welcome' | 'subjects' | 'materialTypes' | 'materials';
  } | null>(null);

  // Скрытие/показ нижней навигации
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        tabBarStyle: (currentScreen === 'chat' || currentScreen === 'generalChat')
          ? { display: 'none' }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            }
      });
    }
  }, [currentScreen, navigation, colors]);

  useEffect(() => {
    loadUserData();
  }, [accessToken]);

  const loadUserData = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const payload = userService.decodeJWT(accessToken);
      if (payload?.user_id) {
        const profile = await userService.getUserById(payload.user_id, accessToken);
        setUserData(profile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSelected = (
    material: MaterialDetail,
    translation: MaterialDetailTranslation,
    state?: { selectedSubject: any; selectedMaterialType: any; currentStep: 'welcome' | 'subjects' | 'materialTypes' | 'materials' }
  ) => {
    setSelectedMaterial(material);
    setSelectedTranslation(translation);
    setExistingChatId(null);
    if (state) {
      setSelectorState(state);
    }
    setCurrentScreen('chat');
  };

  const handleChatSelected = (chatId: string, title: string) => {
    setExistingChatId(chatId);
    setSelectedMaterial(null);
    setSelectedTranslation(null);
    setCurrentScreen('chat');
  };

  const handleGeneralChatSelected = () => {
    setSelectedMaterial(null);
    setSelectedTranslation(null);
    setExistingChatId(null);
    setCurrentScreen('generalChat');
  };

  const handleBackFromChat = () => {
    setCurrentScreen('selector');
    setSelectedMaterial(null);
    setSelectedTranslation(null);
    setExistingChatId(null);
    // Не сбрасываем selectorState, чтобы вернуться к списку материалов
  };

  const handleBackFromSelector = () => {
    // This is the root screen, no back action needed
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Navigation rendering
  if (currentScreen === 'chat') {
    if (selectedMaterial && selectedTranslation) {
      return (
        <ChatScreen
          material={selectedMaterial}
          translation={selectedTranslation}
          onBack={handleBackFromChat}
          existingChatId={null}
          isGeneralChat={false}
        />
      );
    } else if (existingChatId) {
      return (
        <ChatScreen
          material={null}
          translation={null}
          onBack={handleBackFromChat}
          existingChatId={existingChatId}
          isGeneralChat={false}
        />
      );
    }
  }

  if (currentScreen === 'generalChat') {
    return (
      <ChatScreen
        material={null}
        translation={null}
        onBack={handleBackFromChat}
        existingChatId={null}
        isGeneralChat={true}
      />
    );
  }

  return (
    <ChatMaterialSelectorScreen
      userData={userData}
      onMaterialSelected={handleMaterialSelected}
      onBack={handleBackFromSelector}
      onChatSelected={handleChatSelected}
      onGeneralChatSelected={handleGeneralChatSelected}
      initialState={selectorState}
    />
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
  });
