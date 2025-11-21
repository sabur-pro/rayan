import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { lightTheme, darkTheme } from '../theme/colors';

// Screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { VerificationScreen } from '../screens/VerificationScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AIAssistantScreen } from '../screens/AIAssistantScreen';
import { MarketScreen } from '../screens/MarketScreen';
import { CatalogProductsScreen } from '../screens/CatalogProductsScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';

// Auth context
import { useAuth } from '../contexts/AuthContext';

// Tab Bar Icons
import { TabBarIcon } from '../components/TabBarIcon';

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Subscription: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verification: { txnId: string; phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  AIAssistant: undefined;
  MarketTab: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Favorites: undefined;
};

export type MarketStackParamList = {
  Market: undefined;
  CatalogProducts: { catalogId: number; catalogName: string };
  Cart: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const MarketStack = createStackNavigator<MarketStackParamList>();

const AuthNavigator = () => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreenWrapper} />
      <AuthStack.Screen name="Register" component={RegisterScreenWrapper} />
      <AuthStack.Screen name="Verification" component={VerificationScreenWrapper} />
    </AuthStack.Navigator>
  );
};

const MainNavigator = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            name={getTabIconName(route.name)}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreenWrapper}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <MainTab.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ tabBarLabel: t('navigation.aiAssistant') }}
      />
      <MainTab.Screen
        name="MarketTab"
        component={MarketNavigator}
        options={{ tabBarLabel: t('navigation.market') }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: t('navigation.profile') }}
      />
    </MainTab.Navigator>
  );
};

const getTabIconName = (routeName: string): string => {
  switch (routeName) {
    case 'Home':
      return 'home';
    case 'AIAssistant':
      return 'robot';
    case 'MarketTab':
      return 'shop';
    case 'ProfileTab':
      return 'person';
    default:
      return 'home';
  }
};

// Screen wrappers to handle navigation
const HomeScreenWrapper = ({ navigation }: any) => {
  return <HomeScreen navigation={navigation} />;
};

// Auth screen wrappers
const LoginScreenWrapper = ({ navigation }: any) => {
  const { login } = useAuth();
  const { resetLanguageSelection } = useLanguage();
  
  return (
    <LoginScreen
      onLogin={login}
      onNavigateToRegister={() => navigation.navigate('Register')}
      onBack={resetLanguageSelection}
      onVerificationNeeded={(txnId: string, phone: string) => 
        navigation.navigate('Verification', { txnId, phone })
      }
    />
  );
};

const RegisterScreenWrapper = ({ navigation }: any) => {
  const { login } = useAuth();
  const { resetLanguageSelection } = useLanguage();
  
  return (
    <RegisterScreen
      onRegister={login}
      onNavigateToLogin={() => navigation.navigate('Login')}
      onBack={resetLanguageSelection}
      onVerificationNeeded={(txnId: string, phone: string) => 
        navigation.navigate('Verification', { txnId, phone })
      }
    />
  );
};

const VerificationScreenWrapper = ({ navigation, route }: any) => {
  const { login } = useAuth();
  const { txnId, phone } = route.params;
  
  return (
    <VerificationScreen
      txnId={txnId}
      phone={phone}
      onVerified={login}
      onBack={() => navigation.goBack()}
    />
  );
};

const ProfileScreenWrapper = ({ navigation }: any) => {
  const { logout } = useAuth();
  
  return <ProfileScreen onLogout={logout} navigation={navigation} />;
};

const MarketNavigator = () => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <MarketStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <MarketStack.Screen name="Market" component={MarketScreen} />
      <MarketStack.Screen name="CatalogProducts" component={CatalogProductsScreen} />
      <MarketStack.Screen name="Cart" component={CartScreen} />
    </MarketStack.Navigator>
  );
};

const ProfileNavigator = () => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreenWrapper} />
      <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
    </ProfileStack.Navigator>
  );
};

const SubscriptionScreenWrapper = () => {
  const { accessToken, subscription, freeTrialInfo, handleSubscriptionComplete, recheckSubscription } = useAuth();
  const { resetLanguageSelection } = useLanguage();
  
  return (
    <SubscriptionScreen
      accessToken={accessToken || ''}
      subscription={subscription}
      freeTrialInfo={freeTrialInfo}
      onSubscriptionComplete={handleSubscriptionComplete}
      onRefreshStatus={recheckSubscription}
      onBack={resetLanguageSelection}
    />
  );
};

export const AppNavigator = () => {
  const { theme } = useTheme();
  const { isLanguageSelected } = useLanguage();
  const { isAuthenticated, needsSubscription, completeWelcome } = useAuth();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const navigationTheme = useMemo(
    () => ({
      dark: theme === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '700' as const,
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '900' as const,
        },
      },
    }),
    [theme, colors]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isLanguageSelected ? (
          <RootStack.Screen name="Welcome">
            {() => <WelcomeScreen onComplete={completeWelcome} />}
          </RootStack.Screen>
        ) : !isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : needsSubscription ? (
          <RootStack.Screen name="Subscription" component={SubscriptionScreenWrapper} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
