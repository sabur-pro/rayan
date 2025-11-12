export const lightTheme = {
  primary: '#22c55e', // Green-500
  primaryDark: '#16a34a', // Green-600
  primaryLight: '#4ade80', // Green-400
  secondary: '#84cc16', // Lime-500
  secondaryDark: '#65a30d', // Lime-600
  secondaryLight: '#a3e635', // Lime-400
  
  background: '#ffffff',
  surface: '#f8fafc', // Slate-50
  surfaceVariant: '#f1f5f9', // Slate-100
  
  text: '#0f172a', // Slate-900
  textSecondary: '#475569', // Slate-600
  textTertiary: '#94a3b8', // Slate-400
  
  border: '#e2e8f0', // Slate-200
  borderLight: '#f1f5f9', // Slate-100
  
  success: '#10b981', // Emerald-500
  warning: '#f59e0b', // Amber-500
  error: '#ef4444', // Red-500
  info: '#3b82f6', // Blue-500
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkTheme = {
  primary: '#10b981', // Emerald-500 (более яркий для чёрного фона)
  primaryDark: '#059669', // Emerald-600
  primaryLight: '#34d399', // Emerald-400
  secondary: '#d4af37', // Золотой акцент
  secondaryDark: '#b8941f', // Тёмное золото
  secondaryLight: '#f0d365', // Светлое золото
  
  background: '#0a0a0a', // Практически чёрный
  surface: '#1a1815', // Очень тёмный с золотистым подтоном
  surfaceVariant: '#252218', // Тёмный уголь с золотисто-серым оттенком
  
  text: '#f5f5f4', // Тёплый белый
  textSecondary: '#c7c3ba', // Светло-золотистый серый
  textTertiary: '#8b857a', // Золотисто-серый
  
  border: '#3a3528', // Тёмный золотисто-серый
  borderLight: '#2a2720', // Очень тёмный золотисто-серый
  
  success: '#10b981', // Emerald-500
  warning: '#f59e0b', // Amber-500
  error: '#ef4444', // Red-500
  info: '#60a5fa', // Blue-400 (ярче для чёрного фона)
  
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

// Reading theme - оптимизирована для долгого чтения
// Исследования показывают, что сепия/бежевый фон снижает напряжение глаз
// и улучшает читаемость при длительном использовании
export const readingTheme = {
  primary: '#8b7355', // Коричневый акцент (мягче для глаз)
  primaryDark: '#6b5744', // Тёмный коричневый
  primaryLight: '#a58a6f', // Светлый коричневый
  secondary: '#9d8b73', // Тёплый серо-коричневый
  secondaryDark: '#7d6b53', // Тёмный серо-коричневый
  secondaryLight: '#bda793', // Светлый серо-коричневый
  
  background: '#f5f1e8', // Бежевый фон (снижает синий свет)
  surface: '#faf8f3', // Очень светлый бежевый
  surfaceVariant: '#ebe7dc', // Светло-бежевый с серым
  
  text: '#2d2a25', // Тёмно-коричневый (мягче чёрного)
  textSecondary: '#5a5550', // Серо-коричневый
  textTertiary: '#8b857a', // Светлый серо-коричневый
  
  border: '#d4cfc4', // Бежево-серая граница
  borderLight: '#e5e1d6', // Светлая бежево-серая граница
  
  success: '#6b8e6f', // Приглушённый зелёный
  warning: '#c4975d', // Приглушённый янтарный
  error: '#c26b6b', // Приглушённый красный
  info: '#6b8eb8', // Приглушённый синий
  
  shadow: 'rgba(45, 42, 37, 0.08)',
  overlay: 'rgba(45, 42, 37, 0.4)',
};

export type Theme = typeof lightTheme;

// Утилита для получения цветов темы
export const getThemeColors = (theme: 'light' | 'dark' | 'reading'): Theme => {
  switch (theme) {
    case 'dark':
      return darkTheme;
    case 'reading':
      return readingTheme;
    case 'light':
    default:
      return lightTheme;
  }
};
