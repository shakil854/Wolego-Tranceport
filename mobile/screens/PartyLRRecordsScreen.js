import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { apiService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { FileText, Building2 } from "lucide-react-native";

export default function PartyLRRecordsScreen() {
  const { user } = useAuth();
  const [lrs, setLrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPartyLRs = async () => {
    try {
      const data = await apiService.getLREntries();
      let list = Array.isArray(data) ? data : [];
      if (user?.partyName) {
        list = list.filter(
          (lr) =>
            (lr.consignorName && lr.consignorName.toLowerCase() === user.partyName.toLowerCase()) ||
            (lr.consigneeName && lr.consigneeName.toLowerCase() === user.partyName.toLowerCase())
        );
      }
      setLrs(list);
    } catch (err) {
      console.error("Fetch party LRs error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartyLRs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPartyLRs();
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString("en-IN")}`;

  return (
    <View style={styles.screen}>
      <Header title={`${user?.partyName || "Party"} LR Records`} />

      <FlatList
        data={lrs}
        keyExtractor={(item) => String(item.id || item.lrNumber)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <FileText size={16} color="#38bdf8" />
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

            <View style={styles.row}>
              <Text style={styles.label}>Route:</Text>
              <Text style={styles.val}>
                {item.fromLocation || "?"} ➔ {item.toLocation || "?"}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.amount}>{formatCurrency(item.netTotalAmount)}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No LR Records Found for Party</Text>
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
    color: "#38bdf8",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    width: 80,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  date: {
    fontSize: 10,
    color: "#64748b",
  },
  amount: {
    fontSize: 14,
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
