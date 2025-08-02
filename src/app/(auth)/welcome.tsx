// app/auth/welcome.tsx
import React from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomePage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  return (
    <View className={`flex-1 justify-center items-center px-8 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      {/* Logo as emoji */}
      <Text className="text-7xl mb-6">🐾</Text>

      {/* App Name */}
      <Text className={`text-4xl font-extrabold mb-2 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
        PetConnect
      </Text>

      {/* Tagline */}
      <Text className={`text-lg italic mb-6 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
        Connect. Explore. Keep Paws Safe.
      </Text>

      {/* Description */}
      <Text className={`text-center mb-12 text-base ${isDark ? "text-slate-400" : "text-gray-700"}`}>
        The community app for pet lovers to share, explore, and protect their best friends.
      </Text>

      {/* Buttons */}
      <View className="w-full">
        <Pressable
          onPress={() => router.push("/signup")}
          className="bg-blue-600 py-4 rounded-xl items-center mb-4" // <-- add mb-8 here
        >
          <Text className="text-white text-lg font-semibold">Sign Up</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/login")}
          className={`py-4 rounded-xl items-center border-2 ${isDark ? "border-slate-600" : "border-gray-300"
            }`}
        >
          <Text className={`${isDark ? "text-slate-100" : "text-gray-900"} text-lg font-semibold`}>
            Log In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
