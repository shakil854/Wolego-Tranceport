import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import CustomInput from "../components/CustomInput";
import ActionPasswordModal from "../components/ActionPasswordModal";
import { Search, Edit3, Trash2, Plus, FileText, Printer, Share2 } from "lucide-react-native";
import { printLRDocument, shareLRPDF } from "../utils/pdfGenerator";

export default function LRListScreen({ navigation }) {
  const [lrs, setLrs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Security password state
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'edit'|'delete', item }

  const fetchLRs = async () => {
    try {
      const data = await apiService.getLREntries();
      setLrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch LRs error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLRs();
    const unsubscribe = navigation.addListener("focus", fetchLRs);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLRs();
  };

  const handleEditPress = (item) => {
    setPendingAction({ type: "edit", item });
    setSecurityModalVisible(true);
  };

  const handleDeletePress = (item) => {
    setPendingAction({ type: "delete", item });
    setSecurityModalVisible(true);
  };

  const handleSecuritySuccess = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "edit") {
      navigation.navigate("LREntry", { editItem: pendingAction.item });
    } else if (pendingAction.type === "delete") {
      try {
        await apiService.deleteLREntry(pendingAction.item.id);
        Alert.alert("Deleted", `LR #${pendingAction.item.lrNumber} has been deleted.`);
        fetchLRs();
      } catch (err) {
        Alert.alert("Error", err.message || "Failed to delete LR.");
      }
    }
    setPendingAction(null);
  };

  const filteredLrs = lrs.filter((lr) => {
    const q = searchQuery.toLowerCase();
    const lrNo = String(lr.lrNumber || "").toLowerCase();
    const consignor = String(lr.consignorName || "").toLowerCase();
    const consignee = String(lr.consigneeName || "").toLowerCase();
    const truck = String(lr.truckNo || "").toLowerCase();
    return lrNo.includes(q) || consignor.includes(q) || consignee.includes(q) || truck.includes(q);
  });

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  return (
    <View style={styles.screen}>
      <Header title="LR Records" />

      <View style={styles.searchContainer}>
        <CustomInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by LR No, Party, or Truck..."
          icon={Search}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate("LREntry")}>
          <Plus size={20} color="#0f172a" />
        </Pressable>
      </View>

      <FlatList
        data={filteredLrs}
        keyExtractor={(item) => String(item.id || item.lrNumber)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <FileText size={18} color="#f59e0b" />
                <Text style={styles.lrNumber}>LR #{item.lrNumber}</Text>
              </View>
              <Badge status={item.partyPaymentStatus} />
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Consignor:</Text>
              <Text style={styles.val}>{item.consignorName || "-"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Consignee:</Text>
              <Text style={styles.val}>{item.consigneeName || "-"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Truck & Route:</Text>
              <Text style={styles.val}>
                {item.truckNo || "-"} ({item.fromLocation || "?"} ➔ {item.toLocation || "?"})
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.amountText}>{formatCurrency(item.netTotalAmount)}</Text>
                <Text style={styles.dateText}>{item.date || ""}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={[styles.actionIconBtn, { borderColor: "#009a44" }]} onPress={() => printLRDocument(item)}>
                  <Printer size={16} color="#34d399" />
                </Pressable>
                <Pressable style={[styles.actionIconBtn, { borderColor: "#f59e0b" }]} onPress={() => shareLRPDF(item)}>
                  <Share2 size={16} color="#f59e0b" />
                </Pressable>
                <Pressable style={styles.actionIconBtn} onPress={() => handleEditPress(item)}>
                  <Edit3 size={16} color="#38bdf8" />
                </Pressable>
                <Pressable style={[styles.actionIconBtn, { borderColor: "#ef4444" }]} onPress={() => handleDeletePress(item)}>
                  <Trash2 size={16} color="#f87171" />
                </Pressable>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No LR Entries Found</Text>
          </View>
        }
      />

      <ActionPasswordModal
        visible={securityModalVisible}
        onClose={() => setSecurityModalVisible(false)}
        onSuccess={handleSecuritySuccess}
        title={pendingAction?.type === "edit" ? "Verify Security to Edit LR" : "Verify Security to Delete LR"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    alignItems: "center",
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
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  lrNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f59e0b",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    width: 90,
  },
  val: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#009a44",
  },
  dateText: {
    fontSize: 10,
    color: "#64748b",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    padding: 8,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
});
