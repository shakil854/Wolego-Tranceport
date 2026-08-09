import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import SearchablePickerModal from "../components/SearchablePickerModal";
import ActionPasswordModal from "../components/ActionPasswordModal";
import { Truck, Plus, CreditCard, Trash2, X, ChevronDown } from "lucide-react-native";

export default function TruckPaymentScreen() {
  const [payments, setPayments] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [form, setForm] = useState({
    truckNo: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
    paymentMode: "CASH",
  });

  const fetchData = async () => {
    try {
      const [pmtList, truckList] = await Promise.all([
        apiService.getTruckPayments().catch(() => []),
        apiService.getTrucks().catch(() => []),
      ]);
      setPayments(Array.isArray(pmtList) ? pmtList : []);
      setTrucks(Array.isArray(truckList) ? truckList : []);
    } catch (err) {
      console.error("Fetch truck payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePayment = async () => {
    if (!form.truckNo || !form.amount) {
      Alert.alert("Error", "Truck Number and Amount are required!");
      return;
    }

    try {
      await apiService.saveTruckPayment({
        ...form,
        amount: Number(form.amount) || 0,
      });
      Alert.alert("Success", "Truck payment recorded!");
      setModalVisible(false);
      setForm({
        truckNo: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        paymentMode: "CASH",
      });
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save truck payment.");
    }
  };

  const handleDeletePress = (id) => {
    setPendingDeleteId(id);
    setSecurityModalVisible(true);
  };

  const handleSecuritySuccess = async () => {
    if (!pendingDeleteId) return;
    try {
      await apiService.deleteTruckPayment(pendingDeleteId);
      Alert.alert("Deleted", "Truck payment entry deleted.");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to delete payment.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  return (
    <View style={styles.screen}>
      <Header title="Truck Payment & Debit" />

      <View style={styles.topRow}>
        <Text style={styles.subtitle}>Truck Advance & Debit Log</Text>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#0f172a" />
          <Text style={styles.addBtnText}>Add Payment</Text>
        </Pressable>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Truck size={18} color="#fbbf24" />
                <Text style={styles.truckNo}>{item.truckNo}</Text>
              </View>
              <Text style={styles.modeBadge}>{item.paymentMode || "CASH"}</Text>
            </View>

            <View style={styles.footer}>
              <View>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => handleDeletePress(item.id)}>
                <Trash2 size={16} color="#f87171" />
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Truck Payment Entries</Text>
          </View>
        }
      />

      {/* New Truck Payment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Truck Payment</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <Text style={styles.label}>Select Truck Number *</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowTruckModal(true)}>
              <Truck size={18} color="#fbbf24" />
              <Text style={styles.pickerText}>{form.truckNo || "Select Truck Number"}</Text>
              <ChevronDown size={18} color="#94a3b8" />
            </Pressable>

            <View style={{ flexDirection: "row" }}>
              <CustomInput
                label="Amount (₹) *"
                value={form.amount}
                onChangeText={(t) => setForm((prev) => ({ ...prev, amount: t }))}
                placeholder="0"
                keyboardType="numeric"
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomInput
                label="Date *"
                value={form.date}
                onChangeText={(t) => setForm((prev) => ({ ...prev, date: t }))}
                placeholder="YYYY-MM-DD"
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>

            <CustomInput
              label="Remarks / Notes"
              value={form.remarks}
              onChangeText={(t) => setForm((prev) => ({ ...prev, remarks: t }))}
              placeholder="e.g. Fuel Advance / Driver Trip Cash"
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomButton
                title="Save Payment"
                variant="primary"
                onPress={handleSavePayment}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Truck Search Modal */}
      <SearchablePickerModal
        visible={showTruckModal}
        onClose={() => setShowTruckModal(false)}
        items={trucks}
        title="Select Truck Number"
        selectedValue={form.truckNo}
        onSelect={(t) => setForm((prev) => ({ ...prev, truckNo: t.truckNo }))}
      />

      <ActionPasswordModal
        visible={securityModalVisible}
        onClose={() => setSecurityModalVisible(false)}
        onSuccess={handleSecuritySuccess}
        title="Verify Security to Delete Payment"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  truckNo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fbbf24",
  },
  modeBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34d399",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  amount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#009a44",
  },
  date: {
    fontSize: 10,
    color: "#64748b",
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.85)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f8fafc",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 8,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 14,
  },
});
