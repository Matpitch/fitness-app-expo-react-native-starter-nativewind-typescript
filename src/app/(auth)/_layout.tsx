// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    // This Stack navigator will handle the flow for unauthenticated users
    <Stack>
      {/* Each Stack.Screen corresponds to a file in the (auth) folder */}
      {/* The 'name' should match the file name (without .tsx) */}
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      {/* Add more authentication-related screens here if you have them */}
    </Stack>
  );
}