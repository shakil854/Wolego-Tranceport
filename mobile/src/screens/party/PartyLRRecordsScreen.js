import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Search, Printer, Download, Share2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay, formatCurrency } from '../../utils/dateUtils';
import { generateLRHtmlForMobile, printDocumentNative, fetchAndSaveBackendLRPdf } from '../../utils/pdfGenerator';
import { shareFileNative, shareToWhatsApp } from '../../utils/shareUtils';

export default function PartyLRRecordsScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lrs, setLrs] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const data = await fetchLREntriesApi();
      const filtered = (data || []).filter((lr) => {
        if (!user) return false;
        return (
          lr.consignorId === user.partyId ||
          lr.consigneeId === user.partyId ||
          String(lr.consignorName || '').toLowerCase() === String(user.partyName || '').toLowerCase() ||
          String(lr.consigneeName || '').toLowerCase() === String(user.partyName || '').toLowerCase()
        );
      });
      setLrs(filtered);
    } catch (e) {
      console.error("Fetch party LRs error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredLrs = lrs.filter((lr) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const lrNo = String(lr.lrNumber || '').toLowerCase();
    const truck = String(lr.truckNo || '').toLowerCase();
    const route = `${lr.fromPlace} ${lr.toPlace}`.toLowerCase();
    return lrNo.includes(q) || truck.includes(q) || route.includes(q);
  });

  const handlePrint = async (lr) => {
    try {
      const html = generateLRHtmlForMobile(lr, null, ["CONSIGNOR"]);
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Print Error", "Could not print LR.");
    }
  };

  const handleExportPDF = async (lr) => {
    try {
      const fileUri = await fetchAndSaveBackendLRPdf(lr, null, ["CONSIGNOR"]);
      await shareFileNative(fileUri, "Export LR PDF");
    } catch (e) {
      Alert.alert("PDF Error", "Could not export PDF.");
    }
  };

  const handleShareWhatsApp = async (lr) => {
    try {
      const fileUri = await fetchAndSaveBackendLRPdf(lr, null, ["CONSIGNOR"]);
      const msg = `Wolego Transport LR No: ${lr.lrNumber}\nTruck No: ${lr.truckNo}\nFrom: ${lr.fromPlace} -> To: ${lr.toPlace}`;
      await shareToWhatsApp('', msg, fileUri);
    } catch (e) {
      Alert.alert("Share Error", "Could not share via WhatsApp.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="My Consignment Records" />

      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search LR No, Truck No, Station..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <FlatList
          data={filteredLrs}
          keyExtractor={(item) => String(item.id || item.lrNumber)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const netAmt = parseFloat(item.netTotalAmount || item.freightAmount) || 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.lrNoText}>LR No. {item.lrNumber}</Text>
                  <Text style={styles.dateText}>{formatDateDisplay(item.dateTime)}</Text>
                </View>

                <Text style={styles.truckText}>TRUCK: {item.truckNo}</Text>
                <Text style={styles.routeText}>{item.fromPlace} → {item.toPlace}</Text>

                <View style={styles.cardRow}>
                  <Text style={styles.amtText}>₹ {formatCurrency(netAmt)}</Text>
                  <View style={styles.btnGroup}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handlePrint(item)}>
                      <Printer size={16} color="#f59e0b" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleExportPDF(item)}>
                      <Download size={16} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleShareWhatsApp(item)}>
                      <Share2 size={16} color="#22c55e" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No consignment records found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, height: 42 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 13 },
  listContainer: { padding: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  lrNoText: { fontSize: 15, fontWeight: '900', color: '#f8fafc' },
  dateText: { fontSize: 11, color: '#94a3b8' },
  truckText: { fontSize: 12, fontWeight: 'bold', color: '#38bdf8', marginTop: 2 },
  routeText: { fontSize: 12, color: '#cbd5e1', marginVertical: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#334155' },
  amtText: { fontSize: 15, fontWeight: '900', color: '#4ade80' },
  btnGroup: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
