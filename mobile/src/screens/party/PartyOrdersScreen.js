import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert, Modal } from 'react-native';
import { Plus, Clock, CheckCircle2, Truck, X } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchPartyOrdersApi, savePartyOrderApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay } from '../../utils/dateUtils';

export default function PartyOrdersScreen({ navigation }) {
  const { user, isOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [fromPlace, setFromPlace] = useState('WANKANER');
  const [toPlace, setToPlace] = useState('');
  const [truckType, setTruckType] = useState('FULL TRUCK');
  const [goodsDescription, setGoodsDescription] = useState('TILES');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const loadOrders = async () => {
    try {
      const data = await fetchPartyOrdersApi(isOwner ? null : user?.partyId);
      setOrders(data || []);
    } catch (e) {
      console.error("Fetch party orders error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleCreateOrder = async () => {
    if (!toPlace) {
      Alert.alert("Required Field", "Destination 'To Place' is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: `PORD-${Date.now()}`,
        partyId: user?.partyId || user?.id,
        partyName: user?.partyName || user?.username,
        fromPlace,
        toPlace,
        truckType,
        goodsDescription,
        requiredDate,
        notes,
        status: 'PENDING',
      };
      await savePartyOrderApi(payload);
      setModalVisible(false);
      loadOrders();
      Alert.alert("Success", "Transport Order request submitted!");
    } catch (e) {
      Alert.alert("Error", "Failed to submit transport order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Transport Order Requests" />

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Active Orders ({orders.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Request Truck</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isPending = item.status === 'PENDING';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.routeText}>{item.fromPlace} → {item.toPlace}</Text>
                  <View style={[styles.statusBadge, isPending ? styles.statusPending : styles.statusAccepted]}>
                    <Text style={[styles.statusText, isPending ? { color: '#facc15' } : { color: '#4ade80' }]}>
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                {isOwner && item.partyName ? <Text style={styles.partyText}>Party: {item.partyName}</Text> : null}
                <Text style={styles.subText}>Material: {item.goodsDescription || 'TILES'} • Truck: {item.truckType || 'FULL TRUCK'}</Text>
                <Text style={styles.subText}>Required Date: {formatDateDisplay(item.requiredDate)}</Text>
                {item.notes ? <Text style={styles.notesText}>Notes: {item.notes}</Text> : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No transport order requests placed yet.</Text>
            </View>
          }
        />
      )}

      {/* Modal Form */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Transport Order Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>From Place</Text>
            <TextInput style={styles.input} value={fromPlace} onChangeText={setFromPlace} />

            <Text style={styles.label}>To Destination *</Text>
            <TextInput style={styles.input} placeholder="e.g. MUMBAI / DELHI" placeholderTextColor="#64748b" value={toPlace} onChangeText={setToPlace} />

            <Text style={styles.label}>Goods / Material Description</Text>
            <TextInput style={styles.input} value={goodsDescription} onChangeText={setGoodsDescription} />

            <Text style={styles.label}>Required Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={requiredDate} onChangeText={setRequiredDate} />

            <Text style={styles.label}>Additional Notes</Text>
            <TextInput style={styles.input} placeholder="Specific instructions" placeholderTextColor="#64748b" value={notes} onChangeText={setNotes} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateOrder}>
                <Text style={styles.saveText}>Submit Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  addBtn: { backgroundColor: '#009a44', paddingHorizontal: 12, height: 38, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusPending: { backgroundColor: 'rgba(250, 204, 21, 0.15)' },
  statusAccepted: { backgroundColor: 'rgba(74, 222, 128, 0.15)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  partyText: { fontSize: 12, fontWeight: 'bold', color: '#38bdf8', marginBottom: 2 },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  notesText: { fontSize: 11, color: '#cbd5e1', fontStyle: 'italic', marginTop: 4 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, color: '#f8fafc', fontSize: 13 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  modalSave: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#009a44' },
  cancelText: { color: '#cbd5e1', fontWeight: 'bold' },
  saveText: { color: '#ffffff', fontWeight: 'bold' },
});
