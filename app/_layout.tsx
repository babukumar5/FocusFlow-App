import { useEffect } from 'react';
import { Stack } from 'expo-router';
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

import { lightTheme, darkTheme, amoledTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/store/settingsStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { settings } = useSettingsStore();
  
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  const theme = settings.theme === 'amoled' 
    ? amoledTheme 
    : (settings.theme === 'light' ? lightTheme : darkTheme);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={settings.theme === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </PaperProvider>
  );
}
