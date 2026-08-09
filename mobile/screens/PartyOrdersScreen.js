import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { PackagePlus, Plus, X, Calendar, MapPin } from "lucide-react-native";

export default function PartyOrdersScreen() {
  const { user, isOwner, isParty } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    partyName: user?.partyName || "",
    fromLocation: "",
    toLocation: "",
    materialType: "",
    weightMT: "",
    orderDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const fetchOrders = async () => {
    try {
      const data = await apiService.getPartyOrders();
      let list = Array.isArray(data) ? data : [];

      if (isParty && user?.partyName) {
        list = list.filter((o) => o.partyName && o.partyName.toLowerCase() === user.partyName.toLowerCase());
      }
      setOrders(list);
    } catch (err) {
      console.error("Fetch party orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async () => {
    if (!form.fromLocation || !form.toLocation) {
      Alert.alert("Error", "From and To locations are required!");
      return;
    }

    try {
      await apiService.savePartyOrder({
        ...form,
        partyName: form.partyName || user?.partyName || "Party Order",
        status: "PENDING",
      });
      Alert.alert("Success", "Party Order submitted successfully!");
      setModalVisible(false);
      fetchOrders();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create party order.");
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Party Load Orders" />

      <View style={styles.topRow}>
        <Text style={styles.pageSubtitle}>Active Load Bookings & Requests</Text>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#0f172a" />
          <Text style={styles.addBtnText}>New Order</Text>
        </Pressable>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PackagePlus size={18} color="#a78bfa" />
                <Text style={styles.partyName}>{item.partyName}</Text>
              </View>
              <Badge status={item.status || "PENDING"} />
            </View>

            <View style={styles.row}>
              <MapPin size={14} color="#94a3b8" />
              <Text style={styles.val}>
                {item.fromLocation} ➔ {item.toLocation}
              </Text>
            </View>

            {item.materialType ? (
              <Text style={styles.subText}>Material: {item.materialType} ({item.weightMT} MT)</Text>
            ) : null}

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>Order Date: {item.orderDate || "-"}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Load Orders Placed Yet</Text>
          </View>
        }
      />

      {/* New Order Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place New Load Order</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            {isOwner && (
              <CustomInput
                label="Party Name *"
                value={form.partyName}
                onChangeText={(t) => setForm((prev) => ({ ...prev, partyName: t }))}
                placeholder="Party Name"
              />
            )}

            <View style={{ flexDirection: "row" }}>
              <CustomInput
                label="From Location *"
                value={form.fromLocation}
                onChangeText={(t) => setForm((prev) => ({ ...prev, fromLocation: t }))}
                placeholder="Origin"
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomInput
                label="To Location *"
                value={form.toLocation}
                onChangeText={(t) => setForm((prev) => ({ ...prev, toLocation: t }))}
                placeholder="Destination"
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>

            <View style={{ flexDirection: "row" }}>
              <CustomInput
                label="Material Type"
                value={form.materialType}
                onChangeText={(t) => setForm((prev) => ({ ...prev, materialType: t }))}
                placeholder="e.g. Steel / Tiles"
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomInput
                label="Weight (MT)"
                value={form.weightMT}
                onChangeText={(t) => setForm((prev) => ({ ...prev, weightMT: t }))}
                placeholder="MT"
                keyboardType="numeric"
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <CustomButton
                title="Submit Order"
                variant="primary"
                onPress={handleCreateOrder}
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageSubtitle: {
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
  partyName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  val: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
  subText: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  dateText: {
    fontSize: 10,
    color: "#64748b",
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
  modalActions: {
    flexDirection: "row",
    marginTop: 14,
  },
});
