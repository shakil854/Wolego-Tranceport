import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { LogOut, Settings, ShieldCheck } from "lucide-react-native";

export default function Header({ title, onSettingsPress }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const dynamicPaddingTop = Math.max(insets.top + 8, 14);

  return (
    <View style={[styles.header, { paddingTop: dynamicPaddingTop }]}>
      <View style={styles.branding}>
        <Text style={styles.brandTitle}>WOLEGO TRANSPORT</Text>
        <Text style={styles.subTitle}>{title || "Mobile Portal"}</Text>
      </View>
      <View style={styles.actions}>
        {user && (
          <View style={styles.roleBadge}>
            <ShieldCheck size={12} color="#f59e0b" />
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        )}
        {onSettingsPress && (
          <Pressable style={styles.iconBtn} onPress={onSettingsPress}>
            <Settings size={18} color="#cbd5e1" />
          </Pressable>
        )}
        {user && (
          <Pressable style={styles.iconBtn} onPress={logout}>
            <LogOut size={18} color="#f87171" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#0f172a",
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  branding: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#009a44",
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f59e0b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1e293b",
    borderColor: "#f59e0b",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#f59e0b",
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
});
