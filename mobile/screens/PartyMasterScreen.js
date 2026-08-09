import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Search, Plus, Building2, Phone, MapPin, Trash2, Edit3, X } from "lucide-react-native";

export default function PartyMasterScreen({ navigation }) {
  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const initialForm = {
    id: null,
    partyName: "",
    mobileNos: "",
    city: "",
    state: "",
    gstNo: "",
    panNo: "",
    selectType: "BOTH",
  };

  const [form, setForm] = useState(initialForm);

  const fetchParties = async () => {
    try {
      const data = await apiService.getParties();
      setParties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch parties error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleOpenAddModal = () => {
    setForm(initialForm);
    setModalVisible(true);
  };

  const handleOpenEditModal = (party) => {
    setForm({
      id: party.id,
      partyName: party.partyName || "",
      mobileNos: party.mobileNos || "",
      city: party.city || "",
      state: party.state || "",
      gstNo: party.gstNo || "",
      panNo: party.panNo || "",
      selectType: party.selectType || "BOTH",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.partyName || !form.partyName.trim()) {
      Alert.alert("Error", "Party Name is required!");
      return;
    }

    try {
      await apiService.saveParty(form);
      Alert.alert("Success", `Party "${form.partyName}" saved!`);
      setModalVisible(false);
      fetchParties();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save party.");
    }
  };

  const handleDelete = async (party) => {
    Alert.alert("Confirm Delete", `Delete party "${party.partyName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteParty(party.id);
            fetchParties();
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete party.");
          }
        },
      },
    ]);
  };

  const filteredParties = parties.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = String(p.partyName || "").toLowerCase();
    const mobile = String(p.mobileNos || "").toLowerCase();
    const city = String(p.city || "").toLowerCase();
    return name.includes(q) || mobile.includes(q) || city.includes(q);
  });

  return (
    <View style={styles.screen}>
      <Header title="Party Master" />

      <View style={styles.searchRow}>
        <CustomInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search party name, mobile, city..."
          icon={Search}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <Pressable style={styles.addBtn} onPress={handleOpenAddModal}>
          <Plus size={20} color="#0f172a" />
        </Pressable>
      </View>

      <FlatList
        data={filteredParties}
        keyExtractor={(item) => String(item.id || item.partyName)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.nameContainer}>
                <Building2 size={18} color="#a78bfa" />
                <Text style={styles.partyName}>{item.partyName}</Text>
              </View>
              <Text style={styles.typeBadge}>{item.selectType || "BOTH"}</Text>
            </View>

            {item.mobileNos ? (
              <View style={styles.infoRow}>
                <Phone size={14} color="#94a3b8" />
                <Text style={styles.infoText}>{item.mobileNos}</Text>
              </View>
            ) : null}

            {item.city || item.state ? (
              <View style={styles.infoRow}>
                <MapPin size={14} color="#94a3b8" />
                <Text style={styles.infoText}>
                  {item.city ? item.city : ""}{item.city && item.state ? ", " : ""}{item.state ? item.state : ""}
                </Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <Text style={styles.gstText}>GST: {item.gstNo || "N/A"}</Text>
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

      {/* Add / Edit Party Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{form.id ? "Edit Party" : "Add New Party"}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <CustomInput
              label="Party Name *"
              value={form.partyName}
              onChangeText={(t) => setForm((prev) => ({ ...prev, partyName: t }))}
              placeholder="e.g. Acme Logistics"
            />
            <CustomInput
              label="Mobile Number"
              value={form.mobileNos}
              onChangeText={(t) => setForm((prev) => ({ ...prev, mobileNos: t }))}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
            />
            <CustomInput
              label="City"
              value={form.city}
              onChangeText={(t) => setForm((prev) => ({ ...prev, city: t }))}
              placeholder="City"
            />
            <CustomInput
              label="GST Number"
              value={form.gstNo}
              onChangeText={(t) => setForm((prev) => ({ ...prev, gstNo: t.toUpperCase() }))}
              placeholder="e.g. 24ABCDE1234F1Z5"
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomButton
                title="Save Party"
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
  partyName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#a78bfa",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a78bfa",
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  gstText: {
    fontSize: 11,
    color: "#94a3b8",
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
