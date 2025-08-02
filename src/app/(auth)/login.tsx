// src/app/login.tsx
import { View, Text, TextInput, Pressable, useColorScheme, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // Adjust path if needed

export default function LoginPage() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleLogin = async () => {
    setMessage(""); // Clear previous messages
    setIsError(false);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Logged in successfully! Redirecting to profile...");
      setIsError(false);
      // Give a small delay before navigating to allow message to be seen
      setTimeout(() => {
        router.push("/(app)/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Firebase Login Error:", error.message);
      setMessage(`Login Failed: ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 justify-center px-8 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <View className="items-center mb-10">
        <Text className="text-6xl mb-2">🐾</Text>
        <Text className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
          PetConnect
        </Text>
      </View>

      <Text className={`text-2xl font-semibold mb-6 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
        Log In
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
        className={`border rounded-lg px-4 py-3 mb-4 text-base ${
          isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-300 bg-white text-gray-900"
        }`}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
        className={`border rounded-lg px-4 py-3 mb-2 text-base ${
          isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-300 bg-white text-gray-900"
        }`}
      />
      
      {/* Forgot Password Link */}
      <View className="flex-row justify-end mb-4">
        <Pressable onPress={() => router.push("/forgot-password")}>
          <Text className="text-blue-600 font-semibold">Forgot Password?</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} className="mb-6" />
      ) : (
        <Pressable onPress={handleLogin} className="bg-blue-600 py-4 rounded-xl items-center mb-6">
          <Text className="text-white text-lg font-semibold">Log In</Text>
        </Pressable>
      )}

      {message ? (
        <Text className={`text-center mb-4 ${isError ? "text-red-500" : "text-green-500"}`}>
          {message}
        </Text>
      ) : null}

      <View className="flex-row justify-center">
        <Text className={`mr-1 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
          Don't have an account?
        </Text>
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text className="text-blue-600 font-semibold">Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}
