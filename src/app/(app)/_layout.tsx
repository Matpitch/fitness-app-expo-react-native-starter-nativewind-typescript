// app/(app)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native'; // Keep this for dark mode styling
import AntDesign from '@expo/vector-icons/AntDesign'; // Keep your icons
import Ionicons from '@expo/vector-icons/Ionicons'; // Keep your icons

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    // This Tabs navigator will handle the main authenticated app screens
    <Tabs
      screenOptions={{
        headerShown: false, // You probably want headers inside screens, not tabs
        tabBarActiveTintColor: isDark ? "#93c5fd" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderTopColor: isDark ? "#1e293b" : "#e5e7eb",
        },
      }}
    >
      {/* Each Tabs.Screen corresponds to a file in the (app) folder */}
      {/* The 'name' should match the file name (without .tsx) */}
      <Tabs.Screen
        name="index" // This links to app/(app)/index.tsx
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map" // This links to app/(app)/map.tsx
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="enviromento" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages" // This links to app/(app)/messages.tsx
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // This links to app/(app)/profile.tsx
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" color={color} size={size} />
          ),
        }}
      />

      {/* Hidden Tabs within the authenticated flow (e.g., create-pet-profile) */}
      {/* This links to app/(app)/create-pet-profile.tsx */}
      <Tabs.Screen
        name="create-pet-profile"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="create-post"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
      {/* Add more authenticated screens/tabs here */}
    </Tabs>
  );
}