import { DarkTheme, DefaultTheme, ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/ui';
import { useT } from '../i18n';
import { StoreProvider, useStore } from '../state/store';
import { Palette, usePalette, useTheme } from '../theme';

// Splash bleibt sichtbar, bis Einstellungen und Fortschritt geladen sind.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

function AppNavigator() {
  const { loaded } = useStore();
  const colors = usePalette();
  const navTheme = useMemo(() => {
    const base = colors.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors]);

  useEffect(() => {
    if (loaded) SplashScreen.hide();
  }, [loaded]);
  // Erst rendern, wenn der gespeicherte Zustand da ist – sonst starten die
  // Übungen kurz mit dem Standard-Fortschritt und dem falschen Theme.
  if (!loaded) return null;
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={colors.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <AppNavigator />
    </StoreProvider>
  );
}

/** Fängt Laufzeitfehler in Screens ab, statt die App abstürzen zu lassen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { styles } = useTheme(makeStyles);
  const t = useT();
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>{t('error.title')}</Text>
      <Text style={styles.errorText}>{error.message}</Text>
      <Button label={t('error.retry')} icon="refresh" variant="primary" onPress={retry} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    error: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    errorTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
    errorText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  });
