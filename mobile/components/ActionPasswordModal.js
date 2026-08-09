import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Alert } from "react-native";
import CustomInput from "./CustomInput";
import CustomButton from "./CustomButton";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { Lock, ShieldAlert } from "lucide-react-native";

export default function ActionPasswordModal({ visible, onClose, onSuccess, title = "Security Verification" }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleVerify = async () => {
    if (!password) {
      setError("Action Security Password is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await apiService.verifyActionPassword(password, user?.username, user?.id);
      if (res.success) {
        setPassword("");
        onClose();
        onSuccess();
      } else {
        setError(res.error || "Incorrect Action Password!");
      }
    } catch (err) {
      setError(err.message || "Password verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconHeader}>
            <ShieldAlert size={32} color="#f59e0b" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            This action requires your Security Action Password to proceed.
          </Text>

          <CustomInput
            label="Action Security Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError("");
            }}
            placeholder="Enter security password"
            secureTextEntry
            icon={Lock}
            error={error}
          />

          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="secondary"
              onPress={() => {
                setPassword("");
                setError("");
                onClose();
              }}
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomButton
              title="Verify"
              variant="primary"
              loading={loading}
              onPress={handleVerify}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1e293b",
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#f59e0b",
  },
  iconHeader: {
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
});
