import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./context/AuthContext";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#0f172a" />
          <AppNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
