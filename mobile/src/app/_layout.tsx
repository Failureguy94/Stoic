import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { font, useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const t = useTheme();
  const [loaded, error] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerTitleStyle: { fontFamily: font.display, fontSize: 20 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="guides/index" options={{ title: "Setup guides" }} />
        <Stack.Screen name="guides/[slug]" options={{ title: "Guide" }} />
        <Stack.Screen name="survey" options={{ title: "Survey results" }} />
        <Stack.Screen name="about" options={{ title: "About and method" }} />
        <Stack.Screen name="design-note" options={{ title: "Design note" }} />
        <Stack.Screen name="screen-time" options={{ title: "My screen time" }} />
        <Stack.Screen name="limits" options={{ title: "Limits and pauses" }} />
      </Stack>
    </>
  );
}
