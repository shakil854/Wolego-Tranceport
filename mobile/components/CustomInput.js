import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon: IconComponent,
  rightElement,
  style,
  inputStyle,
  editable = true,
  required = false,
}) {
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      ) : null}
      <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.disabledInput]}>
        {IconComponent && (
          <View style={styles.iconContainer} pointerEvents="none">
            <IconComponent size={18} color="#94a3b8" />
          </View>
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: "#f59e0b",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  disabledInput: {
    backgroundColor: "#0f172a",
    opacity: 0.7,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 10,
  },
  errorText: {
    color: "#f87171",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});
