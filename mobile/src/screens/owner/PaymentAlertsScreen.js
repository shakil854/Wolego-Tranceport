import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Bell, Share2, DollarSign, Clock, CheckCircle2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi, fetchPartiesApi, updateLRPaymentStatusApi } from '../../api/endpoints';
import { formatDateDisplay, formatCurrency } from '../../utils/dateUtils';
import { shareToWhatsApp } from '../../utils/shareUtils';

export default function PaymentAlertsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLrs, setPendingLrs] = useState([]);
  const [parties, setParties] = useState([]);

  const loadAlerts = async () => {
    try {
      const [lrData, partyData] = await Promise.all([
        fetchLREntriesApi(),
        fetchPartiesApi(),
      ]);
      setParties(partyData || []);

      const pending = (lrData || []).filter((lr) => lr.partyPaymentStatus !== 'PAID');
      setPendingLrs(pending);
    } catch (e) {
      console.error("Fetch alerts error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getPartyMobile = (partyName) => {
    if (!partyName) return '';
    const found = parties.find(
      (p) => String(p.partyName).toLowerCase() === String(partyName).toLowerCase()
    );
    return found?.mobileNos || '';
  };

  const handleSendReminder = async (lr) => {
    const mobile = getPartyMobile(lr.consignorName) || getPartyMobile(lr.consigneeName);
    const amt = lr.netTotalAmount || lr.freightAmount;
    const msg = `Dear ${lr.consignorName || 'Customer'},\n\nThis is a gentle payment reminder from Wolego Transport regarding LR No. ${lr.lrNumber} dated ${formatDateDisplay(lr.dateTime)}.\n\nPending Amount: ₹ ${formatCurrency(amt)}\nTruck No: ${lr.truckNo}\nRoute: ${lr.fromPlace} to ${lr.toPlace}\n\nPlease settle payment at your earliest convenience.\nThank you,\nWolego Transport`;

    await shareToWhatsApp(mobile, msg);
  };

  const handleMarkPaid = async (lr) => {
    try {
      await updateLRPaymentStatusApi(lr.id, {
        partyPaymentStatus: 'PAID',
        partyPaidAmount: lr.netTotalAmount || lr.freightAmount,
        partyPaidDate: new Date().toISOString(),
      });
      loadAlerts();
      Alert.alert("Success", `LR No. ${lr.lrNumber} marked as PAID!`);
    } catch (e) {
      Alert.alert("Error", "Could not update payment status.");
    }
  };

  let totalPendingAmt = 0;
  pendingLrs.forEach((lr) => {
    totalPendingAmt += parseFloat(lr.netTotalAmount || lr.freightAmount) || 0;
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Payment Overdue Alerts" />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.kpiHeader}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiTitle}>Overdue LR Count</Text>
              <Text style={styles.kpiVal}>{pendingLrs.length} LRs</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiTitle}>Total Outstanding</Text>
              <Text style={[styles.kpiVal, { color: '#fbbf24' }]}>₹ {formatCurrency(totalPendingAmt)}</Text>
            </View>
          </View>

          <FlatList
            data={pendingLrs}
            keyExtractor={(item) => String(item.id || item.lrNumber)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const amt = item.netTotalAmount || item.freightAmount;
              const partyMobile = getPartyMobile(item.consignorName) || getPartyMobile(item.consigneeName);

              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.lrNoText}>LR No. {item.lrNumber}</Text>
                    <Text style={styles.amtText}>₹ {formatCurrency(amt)}</Text>
                  </View>

                  <Text style={styles.partyText}>Consignor: <Text style={styles.bold}>{item.consignorName}</Text></Text>
                  <Text style={styles.partyText}>Consignee: <Text style={styles.bold}>{item.consigneeName}</Text></Text>
                  <Text style={styles.subText}>Truck: {item.truckNo} • Date: {formatDateDisplay(item.dateTime)}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.waBtn} onPress={() => handleSendReminder(item)}>
                      <Share2 size={14} color="#ffffff" />
                      <Text style={styles.btnText}>WhatsApp Reminder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.paidBtn} onPress={() => handleMarkPaid(item)}>
                      <CheckCircle2 size={14} color="#0f172a" />
                      <Text style={[styles.btnText, { color: '#0f172a' }]}>Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No pending payment alerts!</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  kpiHeader: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  kpiBox: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#334155' },
  kpiTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  kpiVal: { fontSize: 16, fontWeight: '900', color: '#f8fafc', marginTop: 2 },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  lrNoText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  amtText: { fontSize: 15, fontWeight: '900', color: '#fbbf24' },
  partyText: { fontSize: 12, color: '#cbd5e1', marginBottom: 2 },
  bold: { fontWeight: 'bold', color: '#f8fafc' },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  waBtn: { flex: 1, height: 38, backgroundColor: '#16a34a', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  paidBtn: { flex: 1, height: 38, backgroundColor: '#4ade80', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
