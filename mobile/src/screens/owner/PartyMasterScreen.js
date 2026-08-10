import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { Search, Plus, Edit2, Trash2, Users, Phone, MapPin, X } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchPartiesApi, savePartyApi, deletePartyApi } from '../../api/endpoints';

export default function PartyMasterScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  // Form Fields
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [mobileNos, setMobileNos] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [city, setCity] = useState('');

  const loadParties = async () => {
    try {
      const data = await fetchPartiesApi();
      setParties(data || []);
    } catch (e) {
      console.error("Fetch parties error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadParties();
  };

  const handleOpenAdd = () => {
    setEditingParty(null);
    setPartyName('');
    setAddress('');
    setGstNo('');
    setMobileNos('');
    setContactPerson('');
    setCity('');
    setModalVisible(true);
  };

  const handleOpenEdit = (p) => {
    setEditingParty(p);
    setPartyName(p.partyName || '');
    setAddress(p.address || '');
    setGstNo(p.gstNo || '');
    setMobileNos(p.mobileNos || '');
    setContactPerson(p.contactPerson || '');
    setCity(p.city || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!partyName || partyName.trim() === '') {
      Alert.alert("Required Field", "Party Name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: editingParty?.id || `PARTY-${Date.now()}`,
        partyName,
        address,
        gstNo,
        mobileNos,
        contactPerson,
        city,
      };
      await savePartyApi(payload);
      setModalVisible(false);
      loadParties();
      Alert.alert("Success", `Party '${partyName}' saved successfully!`);
    } catch (err) {
      Alert.alert("Save Failed", err?.response?.data?.error || err?.message || "Failed to save party.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (p) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete Party '${p.partyName}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePartyApi(p.id);
              loadParties();
              Alert.alert("Deleted", "Party deleted successfully.");
            } catch (e) {
              Alert.alert("Delete Failed", "Could not delete party.");
            }
          },
        },
      ]
    );
  };

  const filteredParties = parties.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = String(p.partyName || '').toLowerCase();
    const mobile = String(p.mobileNos || '').toLowerCase();
    const gst = String(p.gstNo || '').toLowerCase();
    const cityStr = String(p.city || '').toLowerCase();
    return name.includes(q) || mobile.includes(q) || gst.includes(q) || cityStr.includes(q);
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Party Master" />

      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Party Name, Mobile, GST..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Party</Text>
        </TouchableOpacity>
      </View>

      {/* Party List */}
      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredParties}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.partyTitle} numberOfLines={1}>{item.partyName}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEdit(item)}>
                    <Edit2 size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {item.mobileNos ? (
                <View style={styles.infoRow}>
                  <Phone size={14} color="#94a3b8" />
                  <Text style={styles.infoText}>{item.mobileNos}</Text>
                </View>
              ) : null}

              {item.city || item.address ? (
                <View style={styles.infoRow}>
                  <MapPin size={14} color="#94a3b8" />
                  <Text style={styles.infoText}>{item.city ? `${item.city} - ` : ''}{item.address}</Text>
                </View>
              ) : null}

              {item.gstNo ? (
                <Text style={styles.gstText}>GSTIN: {item.gstNo}</Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No parties found.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Party Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingParty ? "Edit Party" : "Create New Party"}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Party Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. RAJ CERAMICS" placeholderTextColor="#64748b" value={partyName} onChangeText={setPartyName} />

              <Text style={styles.label}>Mobile Numbers (Comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g. 9979111555, 9825000000" placeholderTextColor="#64748b" value={mobileNos} onChangeText={setMobileNos} keyboardType="phone-pad" />

              <Text style={styles.label}>GSTIN Number</Text>
              <TextInput style={styles.input} placeholder="24XXXXX1234X1Z" placeholderTextColor="#64748b" value={gstNo} onChangeText={setGstNo} autoCapitalize="characters" />

              <Text style={styles.label}>City / Station</Text>
              <TextInput style={styles.input} placeholder="e.g. WANKANER / MORBI" placeholderTextColor="#64748b" value={city} onChangeText={setCity} />

              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, { height: 60 }]} placeholder="Full Address" placeholderTextColor="#64748b" value={address} onChangeText={setAddress} multiline />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                  <Text style={styles.saveText}>Save Party</Text>
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
  partyTitle: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: '#cbd5e1' },
  gstText: { fontSize: 11, color: '#4ade80', fontWeight: 'bold', marginTop: 4 },
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
