import React, { useState, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { Truck, MapPin } from "lucide-react-native";

export default function TruckComingScreen() {
  const [truckOrders, setTruckOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComingTrucks = async () => {
    try {
      const data = await apiService.getTruckOrders();
      setTruckOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch coming trucks error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComingTrucks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComingTrucks();
  };

  return (
    <View style={styles.screen}>
      <Header title="Truck Coming Entries" />

      <FlatList
        data={truckOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Truck size={18} color="#fbbf24" />
                <Text style={styles.truckNo}>{item.truckNo}</Text>
              </View>
              <Badge status={item.status || "EXPECTED"} />
            </View>

            <View style={styles.row}>
              <MapPin size={14} color="#94a3b8" />
              <Text style={styles.val}>
                From: {item.fromLocation} ➔ To: {item.toLocation}
              </Text>
            </View>

            {item.driverName ? <Text style={styles.subText}>Driver: {item.driverName}</Text> : null}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No Incoming Trucks Logged</Text>
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
  truckNo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fbbf24",
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
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
});
