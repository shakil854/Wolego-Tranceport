import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from "react-native";

export default function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // primary (amber), secondary (slate), danger (red), success (emerald)
  icon: IconComponent,
  style,
  textStyle,
}) {
  const getBackgroundColor = () => {
    if (disabled) return "#334155";
    switch (variant) {
      case "primary":
        return "#f59e0b";
      case "secondary":
        return "#334155";
      case "danger":
        return "#dc2626";
      case "success":
        return "#009a44";
      default:
        return "#f59e0b";
    }
  };

  const getTextColor = () => {
    if (disabled) return "#94a3b8";
    return variant === "primary" ? "#0f172a" : "#ffffff";
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: getBackgroundColor() },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {IconComponent && <IconComponent size={18} color={getTextColor()} style={styles.icon} />}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
