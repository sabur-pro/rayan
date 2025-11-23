import Toast from 'react-native-toast-message';

export const showToast = {
  success: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title || 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  error: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  info: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || 'Info',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  warning: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || 'Warning',
      text2: message,
      position: 'top',
      visibilityTime: 3500,
      autoHide: true,
      topOffset: 50,
    });
  },
  
  confirm: (
    message: string,
    title: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    Toast.show({
      type: 'confirm',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 0,
      autoHide: false,
      bottomOffset: 80,
      props: {
        onConfirm,
        onCancel,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
      },
    });
  },
};
