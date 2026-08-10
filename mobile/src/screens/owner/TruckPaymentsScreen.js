import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert, Modal } from 'react-native';
import { Plus, Trash2, Edit2, DollarSign, Search, ShieldAlert, X } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import SearchableSelect from '../../components/SearchableSelect';
import PasswordConfirmModal from '../../components/PasswordConfirmModal';
import { fetchTruckPaymentsApi, saveTruckPaymentApi, deleteTruckPaymentApi, fetchTrucksApi, fetchLREntriesApi } from '../../api/endpoints';
import { formatDateDisplay, formatCurrency } from '../../utils/dateUtils';

export default function TruckPaymentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [lrs, setLrs] = useState([]);
  const [search, setSearch] = useState('');

  // Security Prompt
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'DELETE', item: obj }

  // Form Modal
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const [truckModal, setTruckModal] = useState(false);
  const [lrModal, setLrModal] = useState(false);

  // Form Fields
  const [selectedTruckNo, setSelectedTruckNo] = useState('');
  const [selectedLrNo, setSelectedLrNo] = useState('');
  const [totalFreight, setTotalFreight] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [commission, setCommission] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    try {
      const [payRes, truckRes, lrRes] = await Promise.all([
        fetchTruckPaymentsApi(),
        fetchTrucksApi(),
        fetchLREntriesApi(),
      ]);
      setPayments(payRes || []);
      setTrucks(truckRes || []);
      setAllLrs(lrRes || []);
    } catch (e) {
      console.error("Load truck payments error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [allLrs, setAllLrs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setSelectedTruckNo('');
    setSelectedLrNo('');
    setTotalFreight('');
    setAdvancePaid('');
    setCommission('');
    setPaidAmount('');
    setPaymentMode('ONLINE');
    setRemarks('');
    setFormModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (!selectedTruckNo || !paidAmount) {
      Alert.alert("Required Fields", "Truck Number and Paid Amount are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: editingPayment?.id || `TPAY-${Date.now()}`,
        truckNo: selectedTruckNo,
        lrNo: selectedLrNo,
        totalFreight,
        advancePaid,
        commission,
        paidAmount,
        paymentMode,
        remarks,
        paymentDate: new Date().toISOString(),
      };

      await saveTruckPaymentApi(payload);
      setFormModalVisible(false);
      loadData();
      Alert.alert("Success", "Truck payment entry saved successfully!");
    } catch (e) {
      Alert.alert("Save Error", "Failed to save truck payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDelete = (item) => {
    setPendingAction({ type: 'DELETE', item });
    setSecurityModalVisible(true);
  };

  const handleSecurityVerified = async () => {
    setSecurityModalVisible(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'DELETE') {
      try {
        await deleteTruckPaymentApi(pendingAction.item.id);
        loadData();
        Alert.alert("Deleted", "Truck payment entry deleted.");
      } catch (e) {
        Alert.alert("Delete Error", "Could not delete payment entry.");
      }
    }
    setPendingAction(null);
  };

  const filteredPayments = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const truck = String(p.truckNo || '').toLowerCase();
    const lr = String(p.lrNo || '').toLowerCase();
    const rem = String(p.remarks || '').toLowerCase();
    return truck.includes(q) || lr.includes(q) || rem.includes(q);
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Truck Payment Ledger" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Truck No, LR No..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Payment List */}
      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.truckNoText}>TRUCK: {item.truckNo}</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleTriggerDelete(item)}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {item.lrNo ? <Text style={styles.lrText}>LR No: {item.lrNo}</Text> : null}

              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.subText}>Mode: {item.paymentMode || 'ONLINE'}</Text>
                  <Text style={styles.subText}>{formatDateDisplay(item.paymentDate)}</Text>
                </View>
                <Text style={styles.paidAmt}>₹ {formatCurrency(item.paidAmount)}</Text>
              </View>

              {item.remarks ? <Text style={styles.remText}>Remarks: {item.remarks}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No truck payments recorded.</Text>
            </View>
          }
        />
      )}

      {/* Security Action Password Modal */}
      <PasswordConfirmModal
        visible={securityModalVisible}
        title="Confirm Truck Payment Delete"
        message="Enter Action Security Password to delete this truck payment record."
        onConfirm={handleSecurityVerified}
        onCancel={() => setSecurityModalVisible(false)}
      />

      {/* Add Payment Modal */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Truck Payment Entry</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Truck Number *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setTruckModal(true)}>
              <Text style={styles.selectText} numberOfLines={1}>{selectedTruckNo || "Select Truck"}</Text>
              <Search size={16} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.label}>Select LR Number (Optional)</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setLrModal(true)}>
              <Text style={styles.selectText} numberOfLines={1}>{selectedLrNo || "Select LR"}</Text>
              <Search size={16} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.label}>Paid Amount (₹) *</Text>
            <TextInput style={styles.inputBold} value={paidAmount} onChangeText={setPaidAmount} keyboardType="numeric" placeholder="Enter amount" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Payment Mode</Text>
            <TextInput style={styles.input} value={paymentMode} onChangeText={setPaymentMode} placeholder="e.g. ONLINE / CHEQUE / CASH" placeholderTextColor="#64748b" />

            <Text style={styles.label}>Remarks</Text>
            <TextInput style={styles.input} value={remarks} onChangeText={setRemarks} placeholder="Payment notes" placeholderTextColor="#64748b" />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setFormModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSavePayment}>
                <Text style={styles.saveText}>Save Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Modals */}
      <SearchableSelect
        visible={truckModal}
        title="Select Truck"
        items={trucks}
        labelKey="truckNo"
        valueKey="truckNo"
        subtitleKey="driverMobile"
        selectedValue={selectedTruckNo}
        onSelect={(t) => setSelectedTruckNo(t.truckNo)}
        onClose={() => setTruckModal(false)}
      />

      <SearchableSelect
        visible={lrModal}
        title="Select LR"
        items={allLrs}
        labelKey="lrNumber"
        valueKey="lrNumber"
        subtitleKey="truckNo"
        selectedValue={selectedLrNo}
        onSelect={(l) => {
          setSelectedLrNo(l.lrNumber);
          if (!selectedTruckNo) setSelectedTruckNo(l.truckNo);
        }}
        onClose={() => setLrModal(false)}
      />

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  truckNoText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  lrText: { fontSize: 12, color: '#38bdf8', fontWeight: 'bold', marginBottom: 6 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  subText: { fontSize: 11, color: '#94a3b8' },
  paidAmt: { fontSize: 16, fontWeight: '900', color: '#4ade80' },
  remText: { fontSize: 11, color: '#cbd5e1', fontStyle: 'italic', marginTop: 4 },
  iconBtn: { padding: 6, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, color: '#f8fafc', fontSize: 13 },
  inputBold: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#009a44', paddingHorizontal: 12, height: 44, color: '#4ade80', fontWeight: 'bold', fontSize: 15 },
  selectBtn: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: '#f8fafc', fontSize: 13, flex: 1, fontWeight: 'bold' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  modalSave: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#009a44' },
  cancelText: { color: '#cbd5e1', fontWeight: 'bold' },
  saveText: { color: '#ffffff', fontWeight: 'bold' },
});
