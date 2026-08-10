import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Truck, CheckCircle2, Phone, MapPin } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi, dismissTruckComingApi } from '../../api/endpoints';
import { formatDateDisplay } from '../../utils/dateUtils';

export default function TruckComingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [arrivingLrs, setArrivingLrs] = useState([]);

  const loadData = async () => {
    try {
      const lrData = await fetchLREntriesApi();
      const arriving = (lrData || []).filter((lr) => !lr.truckComingDismissed);
      setArrivingLrs(arriving);
    } catch (e) {
      console.error("Fetch arriving trucks error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDismiss = async (lr) => {
    try {
      await dismissTruckComingApi(lr.id);
      loadData();
      Alert.alert("Dismissed", `Arrival alert for Truck ${lr.truckNo} dismissed.`);
    } catch (e) {
      Alert.alert("Error", "Could not dismiss alert.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Arriving Trucks Alert" />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={arrivingLrs}
          keyExtractor={(item) => String(item.id || item.lrNumber)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Truck size={18} color="#a855f7" />
                  <Text style={styles.truckNoText}>{item.truckNo}</Text>
                </View>
                <Text style={styles.lrNoText}>LR: {item.lrNumber}</Text>
              </View>

              <Text style={styles.routeText}>{item.fromPlace} → {item.toPlace}</Text>
              <Text style={styles.subText}>Consignee: {item.consigneeName}</Text>
              {item.driverMobile ? <Text style={styles.subText}>Driver: {item.driverMobile}</Text> : null}

              <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(item)}>
                <CheckCircle2 size={16} color="#ffffff" />
                <Text style={styles.dismissBtnText}>Dismiss Arrival Alert</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No pending truck arrival alerts!</Text>
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
  truckNoText: { fontSize: 16, fontWeight: '900', color: '#c084fc' },
  lrNoText: { fontSize: 13, fontWeight: 'bold', color: '#f8fafc' },
  routeText: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginVertical: 2 },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  dismissBtn: { backgroundColor: '#009a44', height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 10 },
  dismissBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
