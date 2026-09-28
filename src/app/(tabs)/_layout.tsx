import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';

import { useT } from '../../i18n';
import { usePalette } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

export default function TabLayout() {
  const colors = usePalette();
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.key'), tabBarIcon: icon('radio-button-on') }} />
      <Tabs.Screen name="learn" options={{ title: t('tab.learn'), tabBarIcon: icon('school') }} />
      <Tabs.Screen name="listen" options={{ title: t('tab.listen'), tabBarIcon: icon('headset') }} />
      <Tabs.Screen name="text" options={{ title: t('tab.text'), tabBarIcon: icon('chatbox-ellipses') }} />
      <Tabs.Screen name="settings" options={{ title: t('tab.settings'), tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
