import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from 'react-native';
import { User, Lock, Server, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl, setCustomApiUrl } from '../../config/apiConfig';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [currentUrlDisplay, setCurrentUrlDisplay] = useState('');

  const { login } = useAuth();

  useEffect(() => {
    getApiBaseUrl().then((url) => {
      setCurrentUrlDisplay(url);
      setCustomServerUrl(url);
    });
  }, [serverModalVisible]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing Fields", "Please enter Mobile Number / Username and Password.");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      Alert.alert("Login Failed", err?.response?.data?.error || err?.message || "Invalid credentials or backend network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    await setCustomApiUrl(customServerUrl);
    const updated = await getApiBaseUrl();
    setCurrentUrlDisplay(updated);
    setServerModalVisible(false);
    Alert.alert("Server URL Saved", `API URL set to:\n${updated}`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Top Header Logo Banner */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoTitle}>WOLEGO TRANSPORT</Text>
            <Text style={styles.logoSubtitle}>EVERYTHING IS FAST</Text>
          </View>
          <Text style={styles.appBadgeText}>MOBILE PORTAL</Text>
        </View>

        {/* Login Form Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your Mobile Number / Username to access</Text>

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile No / Username</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 9979111555 or owner"
                placeholderTextColor="#64748b"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="default"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0f172a" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>SIGN IN TO PORTAL</Text>
                <ArrowRight size={18} color="#0f172a" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Server IP Configuration & Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.serverBtn} onPress={() => setServerModalVisible(true)}>
            <Server size={14} color="#94a3b8" />
            <Text style={styles.serverBtnText} numberOfLines={1}>Server: {currentUrlDisplay}</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Wolego Transport v1.0 • All Rights Reserved</Text>
        </View>

      </ScrollView>

      {/* Server API URL Configuration Modal */}
      <Modal visible={serverModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Server size={20} color="#f59e0b" />
              <Text style={styles.modalTitle}>Backend API Configuration</Text>
            </View>
            <Text style={styles.modalDesc}>
              Enter your backend API endpoint URL (e.g. http://192.168.1.100:8002/api or https://wolegotransport.com/api):
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              placeholder="http://192.168.1.x:8002/api"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setServerModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveServerUrl}>
                <Text style={styles.modalSaveText}>Save Server URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#009a44',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 154, 68, 0.08)',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#009a44',
    letterSpacing: 1.5,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  appBadgeText: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: '#009a44',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 15,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: '90%',
  },
  serverBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  versionText: {
    color: '#64748b',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  modalSave: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#009a44',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
