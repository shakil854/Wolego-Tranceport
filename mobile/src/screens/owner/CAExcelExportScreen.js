import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { FileSpreadsheet, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi } from '../../api/endpoints';
import { formatDateDisplay, getFinancialYear, formatCurrency } from '../../utils/dateUtils';
import { shareFileNative } from '../../utils/shareUtils';

export default function CAExcelExportScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [lrs, setLrs] = useState([]);
  const [selectedFY, setSelectedFY] = useState('ALL');

  useEffect(() => {
    fetchLREntriesApi().then((data) => {
      setLrs(data || []);
      setLoading(false);
    });
  }, []);

  const filteredLrs = lrs.filter((lr) => {
    if (selectedFY === 'ALL') return true;
    if (!lr.dateTime) return false;
    return getFinancialYear(lr.dateTime).label === selectedFY;
  });

  const handleExportCSV = async () => {
    try {
      const headers = "LR Number,Date,Truck Number,From,To,Consignor Name,Consignor GST,Consignee Name,Consignee GST,Freight Amount,SGST (2.5%),CGST (2.5%),IGST (5%),Total With GST,Net Total,Payment Status\n";
      const rows = filteredLrs.map((lr) => {
        const cleanStr = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
        return [
          cleanStr(lr.lrNumber),
          cleanStr(formatDateDisplay(lr.dateTime)),
          cleanStr(lr.truckNo),
          cleanStr(lr.fromPlace),
          cleanStr(lr.toPlace),
          cleanStr(lr.consignorName),
          cleanStr(lr.consignorGst),
          cleanStr(lr.consigneeName),
          cleanStr(lr.consigneeGst),
          lr.freightAmount || 0,
          lr.sgstAmount || 0,
          lr.cgstAmount || 0,
          lr.igstAmount || 0,
          lr.totalWithGst || lr.freightAmount || 0,
          lr.netTotalAmount || lr.freightAmount || 0,
          cleanStr(lr.partyPaymentStatus || 'PENDING'),
        ].join(',');
      }).join('\n');

      const csvContent = headers + rows;
      const filename = `Wolego_CA_Export_${selectedFY}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await shareFileNative(fileUri, "Export CA CSV Statement");
    } catch (e) {
      Alert.alert("Export Error", "Failed to generate CSV file for CA.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="CA Excel / CSV Statement" />

      <View style={styles.topBar}>
        <Text style={styles.label}>Financial Year Filter:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fyRow}>
          {['ALL', '2026-27', '2025-26', '2024-25'].map((fy) => (
            <TouchableOpacity
              key={fy}
              style={[styles.fyChip, selectedFY === fy && styles.fyChipActive]}
              onPress={() => setSelectedFY(fy)}
            >
              <Text style={[styles.fyChipText, selectedFY === fy && styles.fyChipTextActive]}>{fy}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <FileSpreadsheet size={48} color="#22c55e" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.cardTitle}>CA Accounting & GST Export</Text>
            <Text style={styles.cardSubtitle}>
              Export all LR consignment records, GST breakdowns (SGST, CGST, IGST), Consignor & Consignee GSTIN details formatted for CA software import (Excel/CSV).
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Total Records: <Text style={styles.bold}>{filteredLrs.length} LRs</Text></Text>
              <Text style={styles.infoText}>Period: <Text style={styles.bold}>{selectedFY === 'ALL' ? 'All Financial Years' : `FY ${selectedFY}`}</Text></Text>
            </View>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <Download size={18} color="#ffffff" />
              <Text style={styles.exportBtnText}>Generate & Share CSV File</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 6 },
  fyRow: { gap: 6 },
  fyChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  fyChipActive: { backgroundColor: '#009a44', borderColor: '#009a44' },
  fyChipText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  fyChipTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 20, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  infoBox: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 12, width: '100%', marginBottom: 20 },
  infoText: { fontSize: 13, color: '#cbd5e1', marginBottom: 4 },
  bold: { color: '#4ade80', fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#009a44', borderRadius: 10, height: 48, width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  exportBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
