import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from "react-native";
import { apiService } from "../services/apiService";
import Card from "../components/Card";
import Header from "../components/Header";
import Badge from "../components/Badge";
import {
  FileText,
  CreditCard,
  Truck,
  Users,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  PackagePlus,
  RefreshCw,
  Receipt,
  FileSpreadsheet,
} from "lucide-react-native";

export default function DashboardScreen({ navigation }) {
  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [lrs, partyList] = await Promise.all([
        apiService.getLREntries().catch(() => []),
        apiService.getParties().catch(() => []),
      ]);
      setLrEntries(Array.isArray(lrs) ? lrs : []);
      setParties(Array.isArray(partyList) ? partyList : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Metric Calculations
  const totalLrs = lrEntries.length;
  const totalPartyBilled = lrEntries.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalPartyReceived = lrEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const partyPendingAmount = totalPartyBilled - totalPartyReceived;

  const totalTruckPayable = lrEntries.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalTruckPaid = lrEntries.reduce((sum, item) => {
    if (item.truckPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.truckPaidAmount) || 0);
  }, 0);
  const truckPendingAmount = totalTruckPayable - totalTruckPaid;

  return (
    <View style={styles.screen}>
      <Header title="Owner Dashboard" onSettingsPress={() => navigation.navigate("Settings")} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {/* Metric Cards Row */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Total LRs</Text>
              <FileText size={18} color="#38bdf8" />
            </View>
            <Text style={styles.metricValue}>{totalLrs}</Text>
            <Text style={styles.metricSub}>Entries Recorded</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Party Pending</Text>
              <CreditCard size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.metricValue, { color: "#f59e0b" }]}>
              {formatCurrency(partyPendingAmount)}
            </Text>
            <Text style={styles.metricSub}>Receivable Amount</Text>
          </Card>
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Truck Pending</Text>
              <Truck size={18} color="#f87171" />
            </View>
            <Text style={[styles.metricValue, { color: "#f87171" }]}>
              {formatCurrency(truckPendingAmount)}
            </Text>
            <Text style={styles.metricSub}>Payable Freight</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Parties</Text>
              <Users size={18} color="#34d399" />
            </View>
            <Text style={styles.metricValue}>{parties.length}</Text>
            <Text style={styles.metricSub}>Active Masters</Text>
          </Card>
        </View>

        {/* Quick Action Shortcuts */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("LREntry")}>
            <PlusCircle size={22} color="#f59e0b" />
            <Text style={styles.actionText}>New LR Entry</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("LRList")}>
            <FileText size={22} color="#38bdf8" />
            <Text style={styles.actionText}>LR Records</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("Accounting")}>
            <Receipt size={22} color="#34d399" />
            <Text style={styles.actionText}>Party Ledger</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("TruckAccounting")}>
            <Truck size={22} color="#f87171" />
            <Text style={styles.actionText}>Truck Ledger</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("PartyMaster")}>
            <Users size={22} color="#a78bfa" />
            <Text style={styles.actionText}>Parties</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("TruckMaster")}>
            <Truck size={22} color="#fbbf24" />
            <Text style={styles.actionText}>Trucks</Text>
          </Pressable>
        </View>

        {/* Recent LRs Section */}
        <Text style={styles.sectionTitle}>Recent LR Entries</Text>
        {lrEntries.slice(0, 5).map((lr) => (
          <Card key={lr.id || lr.lrNumber} style={styles.lrCard}>
            <View style={styles.lrHeader}>
              <Text style={styles.lrNumber}>LR #{lr.lrNumber}</Text>
              <Badge status={lr.partyPaymentStatus} />
            </View>
            <View style={styles.lrRow}>
              <Text style={styles.lrLabel}>Consignor:</Text>
              <Text style={styles.lrValue}>{lr.consignorName || "-"}</Text>
            </View>
            <View style={styles.lrRow}>
              <Text style={styles.lrLabel}>Consignee:</Text>
              <Text style={styles.lrValue}>{lr.consigneeName || "-"}</Text>
            </View>
            <View style={styles.lrFooter}>
              <Text style={styles.lrAmount}>Freight: {formatCurrency(lr.netTotalAmount)}</Text>
              <Text style={styles.lrDate}>{lr.date || ""}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  metricCard: {
    flex: 1,
    padding: 14,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
  },
  metricSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f8fafc",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    width: "31%",
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 6,
    textAlign: "center",
  },
  lrCard: {
    padding: 12,
    marginBottom: 8,
  },
  lrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  lrNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f59e0b",
  },
  lrRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  lrLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  lrValue: {
    fontSize: 11,
    color: "#f8fafc",
    fontWeight: "600",
  },
  lrFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  lrAmount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#009a44",
  },
  lrDate: {
    fontSize: 10,
    color: "#64748b",
  },
});
