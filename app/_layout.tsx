import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightTheme, darkTheme, amoledTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useActivityStore } from '@/src/store/activityStore';
import { initDB, getUser } from '@/src/services/db';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { settings } = useSettingsStore();
  const [isReady, setIsReady] = useState(false);
  
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      // 1. Initialize SQLite Database
      initDB();

      // 2. Hydrate Zustand stores with SQLite data
      useSettingsStore.getState().hydrate();
      useAuthStore.getState().hydrate();
      useActivityStore.getState().refresh();

      // 3. Check if user exists for onboarding routing
      const user = getUser();
      
      SplashScreen.hideAsync().then(() => {
        setIsReady(true);
        // Force replace to onboarding if no user
        if (!user) {
          router.replace('/onboarding');
        }
      });
    }
  }, [loaded, error]);

  if (!isReady || (!loaded && !error)) {
    return null;
  }

  const theme = settings.theme === 'amoled' 
    ? amoledTheme 
    : (settings.theme === 'light' ? lightTheme : darkTheme);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={settings.theme === 'light' ? 'dark' : 'light'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
