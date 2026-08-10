import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert, Modal } from 'react-native';
import { Search, Filter, Printer, Download, Share2, Edit2, Trash2, CheckCircle2, Clock, X, DollarSign } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import PasswordConfirmModal from '../../components/PasswordConfirmModal';
import { fetchLREntriesApi, deleteLREntryApi, updateLRPaymentStatusApi } from '../../api/endpoints';
import { formatDateDisplay, formatCurrency, getFinancialYear } from '../../utils/dateUtils';
import { generateLRHtmlForMobile, printDocumentNative, fetchAndSaveBackendLRPdf } from '../../utils/pdfGenerator';
import { shareFileNative, shareToWhatsApp } from '../../utils/shareUtils';

export default function LRListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lrs, setLrs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFY, setSelectedFY] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Password Security Modal State
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'EDIT'|'DELETE', lr: object }

  // Quick Payment Update Modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [targetLr, setTargetLr] = useState(null);
  const [partyStatus, setPartyStatus] = useState('PENDING');
  const [partyPaidAmt, setPartyPaidAmt] = useState('');
  const [truckStatus, setTruckStatus] = useState('PENDING');
  const [truckPaidAmt, setTruckPaidAmt] = useState('');

  const loadLRs = async () => {
    try {
      const data = await fetchLREntriesApi();
      setLrs(data || []);
    } catch (e) {
      console.error("Fetch LRs error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLRs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLRs();
  };

  // Filtered LRs
  const filteredLrs = lrs.filter((lr) => {
    if (selectedFY !== 'ALL') {
      if (!lr.dateTime || getFinancialYear(lr.dateTime).label !== selectedFY) return false;
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PAID' && lr.partyPaymentStatus !== 'PAID') return false;
      if (statusFilter === 'PENDING' && lr.partyPaymentStatus === 'PAID') return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const lrNo = String(lr.lrNumber || '').toLowerCase();
    const truck = String(lr.truckNo || '').toLowerCase();
    const consignor = String(lr.consignorName || '').toLowerCase();
    const consignee = String(lr.consigneeName || '').toLowerCase();
    const fromTo = `${lr.fromPlace} ${lr.toPlace}`.toLowerCase();
    return lrNo.includes(q) || truck.includes(q) || consignor.includes(q) || consignee.includes(q) || fromTo.includes(q);
  });

  const handleTriggerEdit = (lr) => {
    setPendingAction({ type: 'EDIT', lr });
    setSecurityModalVisible(true);
  };

  const handleTriggerDelete = (lr) => {
    setPendingAction({ type: 'DELETE', lr });
    setSecurityModalVisible(true);
  };

  const handleSecurityVerified = async () => {
    setSecurityModalVisible(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'EDIT') {
      navigation.navigate('LREntry', { editLR: pendingAction.lr });
    } else if (pendingAction.type === 'DELETE') {
      try {
        await deleteLREntryApi(pendingAction.lr.id);
        Alert.alert("Deleted", `LR ${pendingAction.lr.lrNumber} has been deleted.`);
        loadLRs();
      } catch (err) {
        Alert.alert("Delete Failed", err?.response?.data?.error || err?.message || "Failed to delete LR.");
      }
    }
    setPendingAction(null);
  };

  const handleOpenPaymentModal = (lr) => {
    setTargetLr(lr);
    setPartyStatus(lr.partyPaymentStatus || 'PENDING');
    setPartyPaidAmt(String(lr.partyPaidAmount || lr.netTotalAmount || lr.freightAmount || ''));
    setTruckStatus(lr.truckPaymentStatus || 'PENDING');
    setTruckPaidAmt(String(lr.truckPaidAmount || ''));
    setPaymentModalVisible(true);
  };

  const handleSavePaymentStatus = async () => {
    if (!targetLr) return;
    try {
      await updateLRPaymentStatusApi(targetLr.id, {
        partyPaymentStatus: partyStatus,
        partyPaidAmount: partyPaidAmt,
        partyPaidDate: partyStatus === 'PAID' ? new Date().toISOString() : null,
        truckPaymentStatus: truckStatus,
        truckPaidAmount: truckPaidAmt,
        truckPaidDate: truckStatus === 'PAID' ? new Date().toISOString() : null,
      });
      setPaymentModalVisible(false);
      loadLRs();
      Alert.alert("Success", "Payment status updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update payment status.");
    }
  };

  const handlePrintLR = async (lr) => {
    try {
      const html = generateLRHtmlForMobile(lr, null, ["CONSIGNOR"]);
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Print Failed", "Could not print LR.");
    }
  };

  const handleExportPDF = async (lr) => {
    try {
      const fileUri = await fetchAndSaveBackendLRPdf(lr, null, ["CONSIGNOR"]);
      await shareFileNative(fileUri, "Export LR PDF");
    } catch (e) {
      Alert.alert("PDF Failed", "Could not export PDF.");
    }
  };

  const handleShareWhatsApp = async (lr) => {
    try {
      const fileUri = await fetchAndSaveBackendLRPdf(lr, null, ["CONSIGNOR"]);
      const msg = `Wolego Transport LR No: ${lr.lrNumber}\nTruck No: ${lr.truckNo}\nFrom: ${lr.fromPlace} -> To: ${lr.toPlace}\nConsignor: ${lr.consignorName}\nConsignee: ${lr.consigneeName}`;
      await shareToWhatsApp('', msg, fileUri);
    } catch (e) {
      Alert.alert("Share Failed", "Could not share via WhatsApp.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="LR Records & Search" />

      {/* Top Search & Filter Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search LR No, Truck, Party..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Badges */}
        <View style={styles.filterRow}>
          <View style={styles.fyGroup}>
            {['ALL', '2026-27', '2025-26'].map((fy) => (
              <TouchableOpacity
                key={fy}
                style={[styles.chip, selectedFY === fy && styles.chipActive]}
                onPress={() => setSelectedFY(fy)}
              >
                <Text style={[styles.chipText, selectedFY === fy && styles.chipTextActive]}>{fy}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.fyGroup}>
            {['ALL', 'PAID', 'PENDING'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.chip, statusFilter === st && styles.chipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* LR List */}
      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredLrs}
          keyExtractor={(item) => String(item.id || item.lrNumber)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isPaid = item.partyPaymentStatus === 'PAID';
            const netAmt = parseFloat(item.netTotalAmount || item.freightAmount) || 0;

            return (
              <View style={styles.card}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.lrBadge}>
                    <Text style={styles.lrNumberText}>LR: {item.lrNumber}</Text>
                    <Text style={styles.dateText}>{formatDateDisplay(item.dateTime)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}
                    onPress={() => handleOpenPaymentModal(item)}
                  >
                    {isPaid ? <CheckCircle2 size={12} color="#4ade80" /> : <Clock size={12} color="#facc15" />}
                    <Text style={[styles.statusText, isPaid ? { color: '#4ade80' } : { color: '#facc15' }]}>
                      {isPaid ? 'PAID' : 'PENDING'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Truck & Route Row */}
                <View style={styles.routeRow}>
                  <Text style={styles.truckText}>TRUCK: {item.truckNo || 'N/A'}</Text>
                  <Text style={styles.routeText}>{item.fromPlace || 'WANKANER'} → {item.toPlace}</Text>
                </View>

                {/* Consignor & Consignee */}
                <View style={styles.partyBox}>
                  <Text style={styles.partyLabel}>SENDER: <Text style={styles.partyVal}>{item.consignorName}</Text></Text>
                  <Text style={styles.partyLabel}>RECEIVER: <Text style={styles.partyVal}>{item.consigneeName}</Text></Text>
                </View>

                {/* Goods & Net Amount Bar */}
                <View style={styles.goodsBar}>
                  <Text style={styles.goodsText}>{item.noOfArticles || ''} {item.bundles || ''} {item.descriptionOfGoods || ''}</Text>
                  <Text style={styles.amountText}>₹ {formatCurrency(netAmt)}</Text>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handlePrintLR(item)} title="Print">
                    <Printer size={16} color="#f59e0b" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleExportPDF(item)} title="Export PDF">
                    <Download size={16} color="#10b981" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleShareWhatsApp(item)} title="WhatsApp">
                    <Share2 size={16} color="#22c55e" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleTriggerEdit(item)} title="Edit LR">
                    <Edit2 size={16} color="#3b82f6" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleTriggerDelete(item)} title="Delete LR">
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No matching LR records found.</Text>
            </View>
          }
        />
      )}

      {/* Security Verification Modal for Edit/Delete */}
      <PasswordConfirmModal
        visible={securityModalVisible}
        title={pendingAction?.type === 'DELETE' ? "Confirm LR Delete" : "Security Verification"}
        message={pendingAction?.type === 'DELETE' ? `Enter Action Security Password to delete LR ${pendingAction?.lr?.lrNumber}.` : "Enter Action Security Password to edit LR details."}
        onConfirm={handleSecurityVerified}
        onCancel={() => setSecurityModalVisible(false)}
      />

      {/* Payment Status Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <DollarSign size={20} color="#009a44" />
              <Text style={styles.modalTitle}>Update Payment Status (LR {targetLr?.lrNumber})</Text>
            </View>

            <Text style={styles.fieldLabel}>Party Payment Status</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, partyStatus === 'PAID' && styles.togglePaid]}
                onPress={() => setPartyStatus('PAID')}
              >
                <Text style={styles.toggleText}>PAID</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, partyStatus === 'PENDING' && styles.togglePending]}
                onPress={() => setPartyStatus('PENDING')}
              >
                <Text style={styles.toggleText}>PENDING</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Party Paid Amount (₹)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={partyPaidAmt}
              onChangeText={setPartyPaidAmt}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSavePaymentStatus}>
                <Text style={styles.saveText}>Save Status</Text>
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
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, height: 42 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 13 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fyGroup: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#009a44', borderColor: '#009a44' },
  chipText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  chipTextActive: { color: '#ffffff' },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lrBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lrNumberText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  dateText: { fontSize: 11, color: '#94a3b8' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusPaid: { backgroundColor: 'rgba(74, 222, 128, 0.15)' },
  statusPending: { backgroundColor: 'rgba(250, 204, 21, 0.15)' },
  statusText: { fontSize: 10, fontWeight: '900' },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  truckText: { fontSize: 12, fontWeight: 'bold', color: '#38bdf8' },
  routeText: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1' },
  partyBox: { backgroundColor: '#0f172a', borderRadius: 8, padding: 8, marginVertical: 6 },
  partyLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  partyVal: { color: '#f8fafc', fontWeight: 'normal' },
  goodsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#334155' },
  goodsText: { fontSize: 12, color: '#cbd5e1' },
  amountText: { fontSize: 15, fontWeight: '900', color: '#4ade80' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  iconBtn: { padding: 8, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc' },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 6 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  togglePaid: { backgroundColor: '#009a44', borderColor: '#009a44' },
  togglePending: { backgroundColor: '#eab308', borderColor: '#eab308' },
  toggleText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  modalInput: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, color: '#f8fafc', fontSize: 14, marginBottom: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  modalSave: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#009a44' },
  cancelText: { color: '#cbd5e1', fontWeight: 'bold' },
  saveText: { color: '#ffffff', fontWeight: 'bold' },
});
