// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { SplashScreen, Stack, useSegments, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, setUser] = useState<any>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      SplashScreen.hideAsync();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      router.replace("/(app)/index");
    } else if (!user && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    }
  }, [user, segments]);

  if (user === undefined) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
