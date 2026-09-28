import { DarkTheme, ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/ui';
import { StoreProvider, useStore } from '../state/store';
import { colors } from '../theme/colors';

// Splash bleibt sichtbar, bis Einstellungen und Fortschritt geladen sind.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function AppNavigator() {
  const { loaded } = useStore();
  useEffect(() => {
    if (loaded) SplashScreen.hide();
  }, [loaded]);
  // Erst rendern, wenn der gespeicherte Zustand da ist – sonst starten die
  // Übungen kurz mit dem Standard-Fortschritt.
  if (!loaded) return null;
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <AppNavigator />
      </ThemeProvider>
    </StoreProvider>
  );
}

/** Fängt Laufzeitfehler in Screens ab, statt die App abstürzen zu lassen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Da ist etwas schiefgelaufen.</Text>
      <Text style={styles.errorText}>{error.message}</Text>
      <Button label="Erneut versuchen" icon="refresh" variant="primary" onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  errorText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
