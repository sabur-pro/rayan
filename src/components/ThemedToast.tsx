import React from 'react';
import Toast from 'react-native-toast-message';
import { useToastConfig } from './ToastConfig';

export const ThemedToast: React.FC = () => {
  const toastConfig = useToastConfig();
  
  return <Toast config={toastConfig} />;
};
