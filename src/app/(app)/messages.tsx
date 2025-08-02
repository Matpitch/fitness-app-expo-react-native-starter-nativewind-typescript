import React from "react";
import { SafeAreaView, Text, useColorScheme } from "react-native";

export default function Messages() {
  const isDark = useColorScheme() === "dark";
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#0f172a" : "#fff" }}>
      <Text style={{ color: isDark ? "#f1f5f9" : "#1f2937", fontSize: 24, fontWeight: "bold" }}>
        Messages Page
      </Text>
    </SafeAreaView>
  );
}
