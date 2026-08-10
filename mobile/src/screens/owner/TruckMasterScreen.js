import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { Search, Plus, Edit2, Trash2, Truck, Phone, User, X } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchTrucksApi, saveTruckApi, deleteTruckApi } from '../../api/endpoints';

export default function TruckMasterScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [search, setSearch] = useState('');

  // Modal Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);

  // Form Fields
  const [truckNo, setTruckNo] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [capacity, setCapacity] = useState('');

  const loadTrucks = async () => {
    try {
      const data = await fetchTrucksApi();
      setTrucks(data || []);
    } catch (e) {
      console.error("Fetch trucks error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTrucks();
  };

  const handleOpenAdd = () => {
    setEditingTruck(null);
    setTruckNo('');
    setOwnerName('');
    setDriverName('');
    setDriverMobile('');
    setCapacity('');
    setModalVisible(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTruck(t);
    setTruckNo(t.truckNo || '');
    setOwnerName(t.ownerName || '');
    setDriverName(t.driverName || '');
    setDriverMobile(t.driverMobile || t.mobileNo || '');
    setCapacity(t.capacity || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!truckNo || truckNo.trim() === '') {
      Alert.alert("Required Field", "Truck Number is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: editingTruck?.id || `TRUCK-${Date.now()}`,
        truckNo: truckNo.toUpperCase(),
        ownerName,
        driverName,
        driverMobile,
        mobileNo: driverMobile,
        capacity,
      };
      await saveTruckApi(payload);
      setModalVisible(false);
      loadTrucks();
      Alert.alert("Success", `Truck '${truckNo.toUpperCase()}' saved successfully!`);
    } catch (err) {
      Alert.alert("Save Failed", err?.response?.data?.error || err?.message || "Failed to save truck.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (t) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete Truck '${t.truckNo}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTruckApi(t.id);
              loadTrucks();
              Alert.alert("Deleted", "Truck deleted successfully.");
            } catch (e) {
              Alert.alert("Delete Failed", "Could not delete truck.");
            }
          },
        },
      ]
    );
  };

  const filteredTrucks = trucks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const no = String(t.truckNo || '').toLowerCase();
    const owner = String(t.ownerName || '').toLowerCase();
    const driver = String(t.driverName || '').toLowerCase();
    const mobile = String(t.driverMobile || t.mobileNo || '').toLowerCase();
    return no.includes(q) || owner.includes(q) || driver.includes(q) || mobile.includes(q);
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Truck Master" />

      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Truck No, Owner, Mobile..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Truck</Text>
        </TouchableOpacity>
      </View>

      {/* Truck List */}
      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredTrucks}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Truck size={18} color="#ec4899" />
                  <Text style={styles.truckTitle}>{item.truckNo}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEdit(item)}>
                    <Edit2 size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {item.driverName || item.ownerName ? (
                <View style={styles.infoRow}>
                  <User size={14} color="#94a3b8" />
                  <Text style={styles.infoText}>
                    {item.driverName ? `Driver: ${item.driverName}` : ''}
                    {item.ownerName ? ` (Owner: ${item.ownerName})` : ''}
                  </Text>
                </View>
              ) : null}

              {item.driverMobile || item.mobileNo ? (
                <View style={styles.infoRow}>
                  <Phone size={14} color="#94a3b8" />
                  <Text style={styles.infoText}>{item.driverMobile || item.mobileNo}</Text>
                </View>
              ) : null}

              {item.capacity ? (
                <Text style={styles.capText}>Capacity: {item.capacity}</Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No trucks found.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Truck Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingTruck ? "Edit Truck" : "Create New Truck"}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Truck Number *</Text>
              <TextInput style={styles.input} placeholder="e.g. GJ28AA2626" placeholderTextColor="#64748b" value={truckNo} onChangeText={setTruckNo} autoCapitalize="characters" />

              <Text style={styles.label}>Driver Name</Text>
              <TextInput style={styles.input} placeholder="Driver Full Name" placeholderTextColor="#64748b" value={driverName} onChangeText={setDriverName} />

              <Text style={styles.label}>Driver Mobile Number</Text>
              <TextInput style={styles.input} placeholder="e.g. 9979111555" placeholderTextColor="#64748b" value={driverMobile} onChangeText={setDriverMobile} keyboardType="phone-pad" />

              <Text style={styles.label}>Owner Name</Text>
              <TextInput style={styles.input} placeholder="Truck Owner Name" placeholderTextColor="#64748b" value={ownerName} onChangeText={setOwnerName} />

              <Text style={styles.label}>Capacity / Weight Limit</Text>
              <TextInput style={styles.input} placeholder="e.g. 25 TON / 30 TON" placeholderTextColor="#64748b" value={capacity} onChangeText={setCapacity} />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                  <Text style={styles.saveText}>Save Truck</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12, flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, height: 42 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 13 },
  addBtn: { backgroundColor: '#009a44', paddingHorizontal: 12, height: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  truckTitle: { fontSize: 16, fontWeight: '900', color: '#f8fafc' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: '#cbd5e1' },
  capText: { fontSize: 11, color: '#ec4899', fontWeight: 'bold', marginTop: 4 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center' },
  modalScroll: { padding: 20, justifyContent: 'center' },
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
