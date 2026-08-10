import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LogOut, KeyRound, ShieldAlert, Truck, UserCheck, Shield } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

export default function HeaderBar({ title = "Wolego Transport", showBack = false, onBack }) {
  const { user, logout, isOwner, isParty, isTruck } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState('LOGIN');

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => logout() },
      ]
    );
  };

  const getRoleBadge = () => {
    if (isOwner) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' }]}>
          <Shield size={12} color="#f59e0b" style={{ marginRight: 3 }} />
          <Text style={[styles.roleBadgeText, { color: '#f59e0b' }]}>OWNER</Text>
        </View>
      );
    }
    if (isParty) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1' }]}>
          <UserCheck size={12} color="#818cf8" style={{ marginRight: 3 }} />
          <Text style={[styles.roleBadgeText, { color: '#818cf8' }]}>PARTY</Text>
        </View>
      );
    }
    if (isTruck) {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981' }]}>
          <Truck size={12} color="#34d399" style={{ marginRight: 3 }} />
          <Text style={[styles.roleBadgeText, { color: '#34d399' }]}>TRUCK</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftCol}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {getRoleBadge()}
      </View>

      <View style={styles.rightCol}>
        {isOwner && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setPasswordModalType('ACTION');
              setPasswordModalVisible(true);
            }}
            title="Change Security Action Password"
          >
            <ShieldAlert size={18} color="#f59e0b" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setPasswordModalType('LOGIN');
            setPasswordModalVisible(true);
          }}
          title="Change Password"
        >
          <KeyRound size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} title="Logout">
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ChangePasswordModal
        visible={passwordModalVisible}
        type={passwordModalType}
        onClose={() => setPasswordModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    maxWidth: 160,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
});
