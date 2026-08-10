import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Calendar, Printer, Download, Share2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi } from '../../api/endpoints';
import { formatDateDisplay, formatDateForInput, formatCurrency } from '../../utils/dateUtils';
import { printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function DailyReportScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [lrs, setLrs] = useState([]);

  useEffect(() => {
    fetchLREntriesApi().then((data) => {
      setLrs(data || []);
      setLoading(false);
    });
  }, []);

  const dailyLrs = lrs.filter((lr) => lr.dateTime && String(lr.dateTime).startsWith(selectedDate));

  let totalFreight = 0;
  let totalWeight = 0;
  dailyLrs.forEach((lr) => {
    totalFreight += parseFloat(lr.netTotalAmount || lr.freightAmount) || 0;
    totalWeight += parseFloat(lr.weightKgs) || 0;
  });

  const generateReportHtml = () => {
    const rows = dailyLrs.map((lr) => `
      <tr>
        <td style="text-align:center;">${lr.lrNumber}</td>
        <td>${lr.truckNo}</td>
        <td>${lr.consignorName}</td>
        <td>${lr.consigneeName}</td>
        <td style="text-align:center;">${lr.fromPlace} &rarr; ${lr.toPlace}</td>
        <td style="text-align:right;">${lr.weightKgs || 0} KG</td>
        <td style="text-align:right;">₹ ${formatCurrency(lr.netTotalAmount || lr.freightAmount)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 10px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .title { font-size: 20px; font-weight: bold; color: #009a44; margin: 0; }
          .summary { display: flex; justify-content: space-between; margin: 10px 0; border: 1px solid #000; padding: 8px; background: #f8fafc; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 10px; }
          th { background: #e2e8f0; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size:9px; font-weight:bold;">SUBJECT TO WANKANER JURISDICTION</div>
          <h1 class="title">WOLEGO TRANSPORT</h1>
          <div style="font-weight:bold; margin-top:4px;">DAILY DISPATCH REPORT</div>
          <div>DATE: <strong>${formatDateDisplay(selectedDate)}</strong></div>
        </div>

        <div class="summary">
          <div><strong>Total Dispatches:</strong> ${dailyLrs.length} LRs</div>
          <div><strong>Total Weight:</strong> ${totalWeight} KG</div>
          <div><strong>Total Freight:</strong> ₹ ${formatCurrency(totalFreight)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>LR No</th>
              <th>Truck No</th>
              <th>Consignor</th>
              <th>Consignee</th>
              <th>Route</th>
              <th>Weight</th>
              <th>Freight</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7" style="text-align:center;">No dispatches on this date.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateReportHtml();
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Error", "Failed to print daily report.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const html = generateReportHtml();
      const fileUri = await generateAndSavePdfNative(html, `Daily_Report_${selectedDate}.pdf`);
      await shareFileNative(fileUri, "Daily Dispatch Report PDF");
    } catch (e) {
      Alert.alert("Error", "Failed to export PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Daily Dispatch Report" />

      <View style={styles.topBar}>
        <Text style={styles.label}>Select Date (YYYY-MM-DD):</Text>
        <TextInput style={styles.dateInput} value={selectedDate} onChangeText={setSelectedDate} />
      </View>

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <View style={styles.content}>
          <View style={styles.summaryBar}>
            <View style={styles.sumCard}>
              <Text style={styles.sumTitle}>Total Dispatches</Text>
              <Text style={styles.sumVal}>{dailyLrs.length} LRs</Text>
            </View>
            <View style={styles.sumCard}>
              <Text style={styles.sumTitle}>Total Weight</Text>
              <Text style={styles.sumVal}>{totalWeight} KG</Text>
            </View>
            <View style={styles.sumCard}>
              <Text style={styles.sumTitle}>Total Freight</Text>
              <Text style={[styles.sumVal, { color: '#4ade80' }]}>₹ {formatCurrency(totalFreight)}</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Printer size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Print A4</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
              <Download size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Export PDF</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={dailyLrs}
            keyExtractor={(item) => String(item.id || item.lrNumber)}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.lrCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.lrNo}>LR No. {item.lrNumber}</Text>
                  <Text style={styles.truckText}>{item.truckNo}</Text>
                </View>
                <Text style={styles.partyText}>{item.consignorName} → {item.consigneeName}</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.wtText}>{item.weightKgs ? `${item.weightKgs} KG` : ''}</Text>
                  <Text style={styles.amtText}>₹ {formatCurrency(item.netTotalAmount || item.freightAmount)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No LR dispatches found for {selectedDate}.</Text>
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
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#cbd5e1' },
  dateInput: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 40, color: '#f8fafc', fontSize: 13, width: 140, textAlign: 'center' },
  content: { flex: 1, padding: 12 },
  summaryBar: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sumCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 10 },
  sumTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  sumVal: { fontSize: 14, fontWeight: '900', color: '#f8fafc', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  printBtn: { flex: 1, height: 42, backgroundColor: '#f59e0b', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 42, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
  lrCard: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lrNo: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  truckText: { fontSize: 12, fontWeight: 'bold', color: '#38bdf8' },
  partyText: { fontSize: 12, color: '#cbd5e1', marginVertical: 4 },
  wtText: { fontSize: 11, color: '#94a3b8' },
  amtText: { fontSize: 14, fontWeight: '900', color: '#4ade80' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
