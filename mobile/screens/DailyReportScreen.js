import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import { FileText, TrendingUp, DollarSign, Calendar, Truck, Users } from "lucide-react-native";

export default function DailyReportScreen() {
  const [lrs, setLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      const data = await apiService.getLREntries();
      setLrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch daily report error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  const today = new Date().toISOString().split("T")[0];
  const todayLrs = lrs.filter((item) => item.date === today);

  const totalBilled = lrs.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalAdvance = lrs.reduce((sum, item) => sum + (Number(item.advanceAmount) || 0), 0);
  const todayBilled = todayLrs.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);

  return (
    <View style={styles.screen}>
      <Header title="Daily Summary Report" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Today's Business ({today})</Text>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>LRs Generated</Text>
              <Text style={styles.metricVal}>{todayLrs.length}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Today's Freight</Text>
              <Text style={[styles.metricVal, { color: "#34d399" }]}>{formatCurrency(todayBilled)}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Overall Financial Totals</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Total Freight Billed:</Text>
            <Text style={styles.val}>{formatCurrency(totalBilled)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total Advances Received:</Text>
            <Text style={[styles.val, { color: "#34d399" }]}>{formatCurrency(totalAdvance)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total Active LRs:</Text>
            <Text style={styles.val}>{lrs.length}</Text>
          </View>
        </Card>
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
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f59e0b",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  metricVal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  label: {
    fontSize: 12,
    color: "#cbd5e1",
  },
  val: {
    fontSize: 13,
    fontWeight: "800",
    color: "#f8fafc",
  },
});
