import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '../src/theme/colors';
import { BRAND } from '../src/config/brand';
import { configureForegroundDisplay } from '../src/services/notificationService';

export default function RootLayout() {
  // Configure how notifications appear when the app is foregrounded.
  // Safe to call once on mount.
  useEffect(() => {
    configureForegroundDisplay();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
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
