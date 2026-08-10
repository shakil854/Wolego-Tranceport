import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { ShieldCheck, X, Lock } from 'lucide-react-native';
import { verifyActionPasswordApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function PasswordConfirmModal({ visible, title = "Security Verification", message = "Enter your Action Security Password to proceed.", onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleVerify = async () => {
    if (!password || password.trim() === '') {
      Alert.alert("Password Required", "Please enter security action password.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyActionPasswordApi(password, user?.id, user?.username);
      if (res && res.success) {
        setPassword('');
        onConfirm();
      } else {
        Alert.alert("Access Denied", res?.error || "Incorrect Action Security Password.");
      }
    } catch (err) {
      Alert.alert("Verification Failed", err?.response?.data?.error || err?.message || "Incorrect Action Security Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={24} color="#f59e0b" />
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.inputContainer}>
            <Lock size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Action Security Password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.confirmText}>Verify & Proceed</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  cancelText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  confirmText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
