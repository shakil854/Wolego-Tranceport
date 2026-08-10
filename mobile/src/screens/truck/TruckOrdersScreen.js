import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Truck, CheckCircle2, Clock, MapPin } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchTruckOrdersApi, updateTruckOrderStatusApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay } from '../../utils/dateUtils';

export default function TruckOrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const data = await fetchTruckOrdersApi(user?.username);
      setOrders(data || []);
    } catch (e) {
      console.error("Fetch truck orders error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateTruckOrderStatusApi(orderId, newStatus, `Status updated to ${newStatus}`);
      loadOrders();
      Alert.alert("Status Updated", `Trip status changed to ${newStatus}`);
    } catch (e) {
      Alert.alert("Update Error", "Could not update order status.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Truck Trip Orders" />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const status = item.status || 'ASSIGNED';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.routeText}>{item.fromPlace || 'WANKANER'} → {item.toPlace}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                <Text style={styles.subText}>Truck No: {item.truckNo || user?.username}</Text>
                <Text style={styles.subText}>Material: {item.goodsDescription || 'TILES'}</Text>
                <Text style={styles.subText}>Date: {formatDateDisplay(item.requiredDate || item.createdAt)}</Text>

                {/* Status Update Buttons */}
                <View style={styles.actionRow}>
                  {status !== 'IN TRANSIT' && status !== 'DELIVERED' && (
                    <TouchableOpacity style={styles.transitBtn} onPress={() => handleUpdateStatus(item.id, 'IN TRANSIT')}>
                      <Text style={styles.btnText}>Start Trip (In Transit)</Text>
                    </TouchableOpacity>
                  )}
                  {status !== 'DELIVERED' && (
                    <TouchableOpacity style={styles.deliverBtn} onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}>
                      <Text style={styles.btnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No assigned trip orders found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  statusBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#38bdf8' },
  subText: { fontSize: 11, color: '#cbd5e1', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  transitBtn: { flex: 1, height: 38, backgroundColor: '#3b82f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  deliverBtn: { flex: 1, height: 38, backgroundColor: '#009a44', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
