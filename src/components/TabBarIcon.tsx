import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

const iconMap: { [key: string]: { default: keyof typeof Ionicons.glyphMap; focused: keyof typeof Ionicons.glyphMap } } = {
  home: { default: 'home-outline', focused: 'home' },
  robot: { default: 'chatbox-outline', focused: 'chatbox' },
  star: { default: 'star-outline', focused: 'star' },
  shop: { default: 'storefront-outline', focused: 'storefront' },
  person: { default: 'person-outline', focused: 'person' },
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused,
  color,
  size,
}) => {
  const icon = iconMap[name];
  if (!icon) return null;

  return (
    <Ionicons
      name={focused ? icon.focused : icon.default}
      size={size}
      color={color}
    />
  );
};
