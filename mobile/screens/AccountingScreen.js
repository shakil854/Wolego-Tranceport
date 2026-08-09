import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Receipt, DollarSign, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";

export default function AccountingScreen({ navigation }) {
  const { user, isParty } = useAuth();

  const [lrs, setLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccountingData = async () => {
    try {
      const data = await apiService.getLREntries();
      let list = Array.isArray(data) ? data : [];

      if (isParty && user?.partyName) {
        list = list.filter(
          (lr) =>
            (lr.consignorName && lr.consignorName.toLowerCase() === user.partyName.toLowerCase()) ||
            (lr.consigneeName && lr.consigneeName.toLowerCase() === user.partyName.toLowerCase())
        );
      }
      setLrs(list);
    } catch (err) {
      console.error("Fetch accounting error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccountingData();
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  const totalBilled = lrs.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalReceived = lrs.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const totalPending = totalBilled - totalReceived;

  return (
    <View style={styles.screen}>
      <Header title={isParty ? `${user?.partyName || "Party"} Ledger` : "Party Accounting"} />

      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Billed</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBilled)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Received</Text>
          <Text style={[styles.summaryValue, { color: "#34d399" }]}>{formatCurrency(totalReceived)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pending</Text>
          <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>{formatCurrency(totalPending)}</Text>
        </Card>
      </View>

      <FlatList
        data={lrs}
        keyExtractor={(item) => String(item.id || item.lrNumber)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Receipt size={16} color="#38bdf8" />
                <Text style={styles.lrNo}>LR #{item.lrNumber}</Text>
              </View>
              <Badge status={item.partyPaymentStatus} />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Consignor:</Text>
              <Text style={styles.val}>{item.consignorName || "-"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Consignee:</Text>
              <Text style={styles.val}>{item.consigneeName || "-"}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.amountLabel}>Net Total</Text>
                <Text style={styles.amountVal}>{formatCurrency(item.netTotalAmount)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.amountLabel}>Advance Paid</Text>
                <Text style={[styles.amountVal, { color: "#34d399" }]}>
                  {formatCurrency(item.advanceAmount)}
                </Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Accounting Statements Found</Text>
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
  summaryContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    marginBottom: 0,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#f8fafc",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  lrNo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f59e0b",
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    width: 80,
  },
  val: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f8fafc",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  amountLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  amountVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#009a44",
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
