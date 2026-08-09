import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Bell, AlertTriangle } from "lucide-react-native";

export default function PaymentAlertsScreen() {
  const [unpaidLrs, setUnpaidLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const data = await apiService.getLREntries();
      const list = Array.isArray(data) ? data : [];
      const pending = list.filter((item) => item.partyPaymentStatus !== "PAID");
      setUnpaidLrs(pending);
    } catch (err) {
      console.error("Fetch payment alerts error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  return (
    <View style={styles.screen}>
      <Header title="Payment Alerts" />

      <FlatList
        data={unpaidLrs}
        keyExtractor={(item) => String(item.id || item.lrNumber)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={18} color="#f87171" />
                <Text style={styles.lrNo}>LR #{item.lrNumber}</Text>
              </View>
              <Badge status={item.partyPaymentStatus || "UNPAID"} />
            </View>

            <Text style={styles.partyText}>{item.consignorName || item.consigneeName}</Text>
            <Text style={styles.dateText}>Date: {item.date || "-"}</Text>

            <View style={styles.footer}>
              <Text style={styles.label}>Pending Amount:</Text>
              <Text style={styles.amount}>{formatCurrency(item.netTotalAmount - (item.advanceAmount || 0))}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Overdue Payment Alerts 🎉</Text>
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
    borderColor: "#7f1d1d",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  lrNo: {
    fontSize: 15,
    fontWeight: "900",
    color: "#f87171",
  },
  partyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
  dateText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
  },
  amount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f87171",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "700",
  },
});
