// app/_layout.tsx
// v0.6: scheme-aware status bar + header colors so dark mode looks right.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useColors } from '../src/theme/colors';
import { BRAND } from '../src/config/brand';
import { configureForegroundDisplay } from '../src/services/notificationService';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useColors();
  const isDark = scheme === 'dark';

  // Configure how notifications appear when the app is foregrounded.
  // Safe to call once on mount.
  useEffect(() => {
    configureForegroundDisplay();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="index" options={{ title: BRAND.appName }} />
        <Stack.Screen name="select" options={{ title: 'Choose a test' }} />
        <Stack.Screen name="assessment" options={{ title: 'Test sprint' }} />
        <Stack.Screen name="celebration" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ title: 'ScoreLift Report' }} />
      </Stack>
    </>
  );
}
