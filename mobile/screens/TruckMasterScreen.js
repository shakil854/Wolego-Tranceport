import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Search, Plus, Truck, Phone, User, Trash2, Edit3, X, CreditCard } from "lucide-react-native";

export default function TruckMasterScreen({ navigation }) {
  const [trucks, setTrucks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const initialForm = {
    id: null,
    truckNo: "",
    ownerName: "",
    mobileNo: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
  };

  const [form, setForm] = useState(initialForm);

  const fetchTrucks = async () => {
    try {
      const data = await apiService.getTrucks();
      setTrucks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch trucks error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleOpenAddModal = () => {
    setForm(initialForm);
    setModalVisible(true);
  };

  const handleOpenEditModal = (truck) => {
    setForm({
      id: truck.id,
      truckNo: truck.truckNo || "",
      ownerName: truck.ownerName || "",
      mobileNo: truck.mobileNo || "",
      bankName: truck.bankName || "",
      accountNo: truck.accountNo || "",
      ifscCode: truck.ifscCode || "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.truckNo || !form.truckNo.trim()) {
      Alert.alert("Error", "Truck Number is required!");
      return;
    }

    try {
      await apiService.saveTruck({
        ...form,
        truckNo: form.truckNo.trim().toUpperCase(),
      });
      Alert.alert("Success", `Truck "${form.truckNo}" saved!`);
      setModalVisible(false);
      fetchTrucks();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save truck.");
    }
  };

  const handleDelete = async (truck) => {
    Alert.alert("Confirm Delete", `Delete truck "${truck.truckNo}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteTruck(truck.id);
            fetchTrucks();
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete truck.");
          }
        },
      },
    ]);
  };

  const filteredTrucks = trucks.filter((t) => {
    const q = searchQuery.toLowerCase();
    const no = String(t.truckNo || "").toLowerCase();
    const owner = String(t.ownerName || "").toLowerCase();
    const mobile = String(t.mobileNo || "").toLowerCase();
    return no.includes(q) || owner.includes(q) || mobile.includes(q);
  });

  return (
    <View style={styles.screen}>
      <Header title="Truck Master" />

      <View style={styles.searchRow}>
        <CustomInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search truck no, owner, mobile..."
          icon={Search}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <Pressable style={styles.addBtn} onPress={handleOpenAddModal}>
          <Plus size={20} color="#0f172a" />
        </Pressable>
      </View>

      <FlatList
        data={filteredTrucks}
        keyExtractor={(item) => String(item.id || item.truckNo)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameContainer}>
                <Truck size={18} color="#fbbf24" />
                <Text style={styles.truckNo}>{item.truckNo}</Text>
              </View>
            </View>

            {item.ownerName ? (
              <View style={styles.infoRow}>
                <User size={14} color="#94a3b8" />
                <Text style={styles.infoText}>Owner: {item.ownerName}</Text>
              </View>
            ) : null}

            {item.mobileNo ? (
              <View style={styles.infoRow}>
                <Phone size={14} color="#94a3b8" />
                <Text style={styles.infoText}>{item.mobileNo}</Text>
              </View>
            ) : null}

            {item.bankName || item.accountNo ? (
              <View style={styles.infoRow}>
                <CreditCard size={14} color="#94a3b8" />
                <Text style={styles.infoText}>
                  {item.bankName || "Bank"}: {item.accountNo || "-"} ({item.ifscCode || ""})
                </Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={() => handleOpenEditModal(item)}>
                  <Edit3 size={16} color="#38bdf8" />
                </Pressable>
                <Pressable style={[styles.actionBtn, { borderColor: "#ef4444" }]} onPress={() => handleDelete(item)}>
                  <Trash2 size={16} color="#f87171" />
                </Pressable>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Add / Edit Truck Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{form.id ? "Edit Truck" : "Add New Truck"}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <CustomInput
              label="Truck Number *"
              value={form.truckNo}
              onChangeText={(t) => setForm((prev) => ({ ...prev, truckNo: t }))}
              placeholder="e.g. GJ01AB1234"
              autoCapitalize="characters"
            />
            <CustomInput
              label="Owner / Driver Name"
              value={form.ownerName}
              onChangeText={(t) => setForm((prev) => ({ ...prev, ownerName: t }))}
              placeholder="Owner Name"
            />
            <CustomInput
              label="Mobile Number"
              value={form.mobileNo}
              onChangeText={(t) => setForm((prev) => ({ ...prev, mobileNo: t }))}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
            />
            <CustomInput
              label="Bank Account No"
              value={form.accountNo}
              onChangeText={(t) => setForm((prev) => ({ ...prev, accountNo: t }))}
              placeholder="Account Number"
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomButton
                title="Save Truck"
                variant="primary"
                onPress={handleSave}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  searchRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  addBtn: {
    backgroundColor: "#f59e0b",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  truckNo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fbbf24",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#cbd5e1",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38bdf8",
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
  modalActions: {
    flexDirection: "row",
    marginTop: 14,
  },
});
