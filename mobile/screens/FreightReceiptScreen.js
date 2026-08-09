import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet, Pressable } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Receipt, DollarSign, Calendar, Building2 } from "lucide-react-native";

export default function FreightReceiptScreen({ navigation }) {
  const [lrs, setLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipts = async () => {
    try {
      const data = await apiService.getLREntries();
      setLrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch freight receipts error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  return (
    <View style={styles.screen}>
      <Header title="Freight Receipts" />

      <FlatList
        data={lrs}
        keyExtractor={(item) => String(item.id || item.lrNumber)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Receipt size={18} color="#009a44" />
                <Text style={styles.lrNo}>Receipt LR #{item.lrNumber}</Text>
              </View>
              <Badge status={item.partyPaymentStatus} />
            </View>

            <View style={styles.row}>
              <Building2 size={14} color="#94a3b8" />
              <Text style={styles.partyText}>{item.consignorName || item.consigneeName || "Party N/A"}</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View>
                <Text style={styles.label}>Net Freight</Text>
                <Text style={styles.value}>{formatCurrency(item.netTotalAmount)}</Text>
              </View>
              <View>
                <Text style={styles.label}>Advance Received</Text>
                <Text style={[styles.value, { color: "#34d399" }]}>{formatCurrency(item.advanceAmount)}</Text>
              </View>
              <View>
                <Text style={styles.label}>Balance Due</Text>
                <Text style={[styles.value, { color: "#f59e0b" }]}>{formatCurrency(item.balanceAmount)}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Freight Receipts Found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  listContent: {
    padding: 16,
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
  lrNo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#009a44",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  partyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  label: {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f8fafc",
    marginTop: 2,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
});
