import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/apiService";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Phone, KeyRound, Eye, EyeOff, Sparkles, ShieldCheck, Truck } from "lucide-react-native";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Mobile Number/Username and Password are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await apiService.login(username, password);
      if (data.success && data.user) {
        await login(data.user);
      } else {
        setError(data.error || "Login failed. Check your credentials.");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Login Card */}
          <View style={styles.card}>
            {/* Header Branding */}
            <View style={styles.header}>
              <Text style={styles.logoText}>WOLEGO TRANSPORT</Text>
              <Text style={styles.tagline}>EVERYTHING IS FAST</Text>
              <View style={styles.subTagline}>
                <Sparkles size={12} color="#f59e0b" />
                <Text style={styles.subTaglineText}>Transport Billing & Accounting</Text>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              <CustomInput
                label="Mobile Number / Username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError("");
                }}
                placeholder="Enter Mobile Number"
                icon={Phone}
                required
              />

              <CustomInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError("");
                }}
                placeholder="Enter Password"
                secureTextEntry={!showPassword}
                icon={KeyRound}
                rightElement={
                  <Pressable style={{ padding: 6 }} onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                  </Pressable>
                }
                required
              />

              <CustomButton
                title="SIGN IN TO PORTAL"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
                style={{ marginTop: 14 }}
              />
            </View>

            {/* Footer Security Badges */}
            <View style={styles.footerBadges}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={12} color="#10b981" />
                <Text style={styles.badgeText}>256-Bit Encrypted</Text>
              </View>
              <View style={styles.badgeItem}>
                <Truck size={12} color="#f59e0b" />
                <Text style={styles.badgeText}>Wolego Master</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0f172a",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#009a44",
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f59e0b",
    fontStyle: "italic",
    letterSpacing: 1,
    marginTop: 2,
  },
  subTagline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  subTaglineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#cbd5e1",
    textTransform: "uppercase",
  },
  errorBox: {
    backgroundColor: "#450a0a",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  footerBadges: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
  },
});
