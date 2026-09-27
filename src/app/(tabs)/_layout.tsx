import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { ColorValue } from 'react-native';

import { colors } from '../../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

export default function TabLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Taste', tabBarIcon: icon('radio-button-on') }} />
      <Tabs.Screen name="learn" options={{ title: 'Lernen', tabBarIcon: icon('school') }} />
      <Tabs.Screen name="listen" options={{ title: 'Hören', tabBarIcon: icon('headset') }} />
      <Tabs.Screen name="text" options={{ title: 'Text', tabBarIcon: icon('chatbox-ellipses') }} />
      <Tabs.Screen name="settings" options={{ title: 'Optionen', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
