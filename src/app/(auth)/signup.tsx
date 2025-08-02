// src/app/signup.tsx
import { View, Text, TextInput, Pressable, useColorScheme, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "../../firebaseConfig"; // Import db

export default function SignUpPage() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // Keep username state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSignup = async () => {
    setMessage(""); // Clear previous messages
    setIsError(false);
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store username in Firestore
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          username: username,
          // You can add other user-specific data here
        });
      }

      setMessage("Account created successfully! Redirecting to pet profile...");
      setIsError(false);
      // Give a small delay before navigating to allow message to be seen
      setTimeout(() => {
        router.push("/(app)/create-pet-profile");
      }, 1500);
    } catch (error: any) {
      console.error("Firebase SignUp Error:", error.message);
      setMessage(`Sign Up Failed: ${error.message}`);
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
        Create Account
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
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
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
        className={`border rounded-lg px-4 py-3 mb-4 text-base ${
          isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-300 bg-white text-gray-900"
        }`}
      />

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
        className={`border rounded-lg px-4 py-3 mb-6 text-base ${
          isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-300 bg-white text-gray-900"
        }`}
      />

      {loading ? (
        <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} className="mb-6" />
      ) : (
        <Pressable onPress={handleSignup} className="bg-blue-600 py-4 rounded-xl items-center mb-6">
          <Text className="text-white text-lg font-semibold">Create Account</Text>
        </Pressable>
      )}

      {message ? (
        <Text className={`text-center mb-4 ${isError ? "text-red-500" : "text-green-500"}`}>
          {message}
        </Text>
      ) : null}

      <View className="flex-row justify-center">
        <Text className={`mr-1 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
          Already have an account?
        </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text className="text-blue-600 font-semibold">Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}
