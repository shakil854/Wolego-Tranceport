import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Badge({ status, text }) {
  const label = text || status || "PENDING";
  const upper = label.toString().toUpperCase();

  const getColors = () => {
    if (upper === "PAID" || upper === "COMPLETED" || upper === "DELIVERED") {
      return { bg: "#064e3b", border: "#059669", text: "#34d399" };
    }
    if (upper === "PARTIAL" || upper === "IN PROGRESS" || upper === "PROCESSING") {
      return { bg: "#78350f", border: "#d97706", text: "#fbbf24" };
    }
    if (upper === "UNPAID" || upper === "PENDING" || upper === "CANCELLED") {
      return { bg: "#7f1d1d", border: "#dc2626", text: "#f87171" };
    }
    return { bg: "#1e293b", border: "#475569", text: "#cbd5e1" };
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{upper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
