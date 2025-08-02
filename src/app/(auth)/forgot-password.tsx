// app/forgot-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  useColorScheme,
  Alert, // Using Alert for simple feedback, but a custom modal is also a good option
} from "react-native";
import { useRouter } from "expo-router";

// Import the necessary Firebase auth functions and the auth object
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Adjust the import path if needed

export default function ForgotPasswordPage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  // State for the email input
  const [email, setEmail] = useState("");

  // States for handling UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Function to handle the password reset process
  const handlePasswordReset = async () => {
    // Basic validation
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true); // Start loading state
    setMessage(""); // Clear previous messages
    setError(""); // Clear previous errors

    try {
      // Call the Firebase function to send the password reset email
      await sendPasswordResetEmail(auth, email);

      // Set a success message if the email was sent successfully
      setMessage("A password reset link has been sent to your email!");

      // Optional: Navigate back to the login page after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (firebaseError: any) {
      // Handle various Firebase errors and provide user-friendly feedback
      console.error("Firebase Password Reset Error:", firebaseError.message);
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          setError("The email address is not valid.");
          break;
        case 'auth/user-not-found':
          setError("No user found with that email address.");
          break;
        case 'auth/too-many-requests':
          setError("Too many requests. Please try again later.");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
          break;
      }
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  return (
    <View
      className={`flex-1 justify-center px-8 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}
    >
      {/* Logo & App Name */}
      <View className="items-center mb-10">
        <Text className="text-6xl mb-2">🐾</Text>
        <Text
          className={`text-3xl font-bold ${
            isDark ? "text-slate-100" : "text-gray-900"
          }`}
        >
          PetConnect
        </Text>
      </View>

      {/* Heading */}
      <Text
        className={`text-2xl font-semibold mb-4 ${
          isDark ? "text-slate-100" : "text-gray-900"
        }`}
      >
        Reset Password
      </Text>

      {/* Instructions */}
      <Text
        className={`mb-6 text-center ${
          isDark ? "text-slate-300" : "text-gray-700"
        }`}
      >
        Enter your email to receive a password reset link.
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className={`border rounded-lg px-4 py-3 mb-6 text-base ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-100"
            : "border-gray-300 bg-white text-gray-900"
        }`}
      />

      {/* Displaying messages or errors */}
      {message ? (
        <Text className="text-green-500 text-center mb-4">{message}</Text>
      ) : null}
      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}

      {/* Send Reset Link Button */}
      <Pressable
        onPress={handlePasswordReset}
        // Disable the button while loading
        disabled={isLoading}
        className={`py-4 rounded-xl items-center mb-6 ${
          isLoading ? "bg-blue-400" : "bg-blue-600"
        }`}
      >
        <Text className="text-white text-lg font-semibold">
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Text>
      </Pressable>

      {/* Back to Login link */}
      <View className="flex-row justify-center">
        <Text className={`mr-1 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
          Remembered your password?
        </Text>
        <Pressable onPress={() => router.push("/login")}>
          <Text className="text-blue-600 font-semibold">Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}
