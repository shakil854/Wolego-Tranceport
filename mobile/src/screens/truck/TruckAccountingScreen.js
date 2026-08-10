import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { Printer, Download, Share2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchTruckPaymentsApi, fetchLREntriesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay, formatCurrency } from '../../utils/dateUtils';
import { printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function TruckAccountingScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [truckPayments, setTruckPayments] = useState([]);
  const [truckLrs, setTruckLrs] = useState([]);

  useEffect(() => {
    Promise.all([fetchTruckPaymentsApi(), fetchLREntriesApi()]).then(([payData, lrData]) => {
      const mobileNum = user?.username || user?.mobileNo;
      const filteredPayments = (payData || []).filter((p) => {
        if (!user) return false;
        return String(p.truckNo || '').toLowerCase() === String(user.username || '').toLowerCase() || p.mobileNo === mobileNum;
      });
      const filteredLrs = (lrData || []).filter((lr) => {
        if (!user) return false;
        return String(lr.truckNo || '').toLowerCase().includes(String(user.username || '').toLowerCase());
      });

      setTruckPayments(filteredPayments);
      setTruckLrs(filteredLrs);
      setLoading(false);
    });
  }, [user]);

  let totalReceived = 0;
  truckPayments.forEach((p) => {
    totalReceived += parseFloat(p.paidAmount) || 0;
  });

  const generateStatementHtml = () => {
    const rows = truckPayments.map((p) => `
      <tr>
        <td style="text-align:center;">${formatDateDisplay(p.paymentDate)}</td>
        <td>${p.truckNo}</td>
        <td>${p.lrNo || '-'}</td>
        <td>${p.paymentMode || 'ONLINE'}</td>
        <td style="text-align:right;">₹ ${formatCurrency(p.paidAmount)}</td>
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
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 10px; }
          th { background: #e2e8f0; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size:9px; font-weight:bold;">SUBJECT TO WANKANER JURISDICTION</div>
          <h1 class="title">WOLEGO TRANSPORT</h1>
          <div style="font-weight:bold; margin-top:4px;">TRUCK OWNER PAYMENT STATEMENT</div>
          <div>TRUCK / USER: <strong>${user?.username}</strong></div>
        </div>

        <div style="margin: 10px 0; font-weight:bold; font-size:12px;">
          Total Received Payments: ₹ ${formatCurrency(totalReceived)}
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Truck No</th>
              <th>LR No</th>
              <th>Mode</th>
              <th>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="text-align:center;">No truck payment records found.</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateStatementHtml();
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Error", "Failed to print statement.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const html = generateStatementHtml();
      const fileUri = await generateAndSavePdfNative(html, `Truck_Statement_${user?.username}.pdf`);
      await shareFileNative(fileUri, "Truck Statement PDF");
    } catch (e) {
      Alert.alert("Error", "Failed to export PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title={`Truck Portal (${user?.username})`} />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Total Received Payments</Text>
            <Text style={styles.kpiVal}>₹ {formatCurrency(totalReceived)}</Text>
            <Text style={styles.kpiSub}>{truckPayments.length} Payment Entries</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Printer size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Print Statement</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
              <Download size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Export PDF</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Payment Entries ({truckPayments.length})</Text>
          {truckPayments.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.truckNo}>Truck: {p.truckNo}</Text>
                <Text style={styles.amtText}>₹ {formatCurrency(p.paidAmount)}</Text>
              </View>
              {p.lrNo ? <Text style={styles.lrText}>LR No: {p.lrNo}</Text> : null}
              <Text style={styles.dateText}>Mode: {p.paymentMode || 'ONLINE'} • Date: {formatDateDisplay(p.paymentDate)}</Text>
              {p.remarks ? <Text style={styles.remText}>Notes: {p.remarks}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 14 },
  kpiCard: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#10b981', padding: 16, marginBottom: 14, alignItems: 'center' },
  kpiTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  kpiVal: { fontSize: 22, fontWeight: '900', color: '#34d399', marginVertical: 4 },
  kpiSub: { fontSize: 11, color: '#64748b' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  printBtn: { flex: 1, height: 42, backgroundColor: '#f59e0b', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 42, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
  card: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  truckNo: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  amtText: { fontSize: 15, fontWeight: '900', color: '#34d399' },
  lrText: { fontSize: 12, color: '#38bdf8', fontWeight: 'bold', marginVertical: 2 },
  dateText: { fontSize: 11, color: '#94a3b8' },
  remText: { fontSize: 11, color: '#cbd5e1', fontStyle: 'italic', marginTop: 2 },
});
