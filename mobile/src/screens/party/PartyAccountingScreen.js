import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { Printer, Download, Share2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay, formatCurrency, getFinancialYear } from '../../utils/dateUtils';
import { printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function PartyAccountingScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partyLrs, setPartyLrs] = useState([]);
  const [selectedFY, setSelectedFY] = useState('ALL');

  useEffect(() => {
    fetchLREntriesApi().then((data) => {
      const filtered = (data || []).filter((lr) => {
        if (!user) return false;
        return (
          lr.consignorId === user.partyId ||
          lr.consigneeId === user.partyId ||
          String(lr.consignorName || '').toLowerCase() === String(user.partyName || '').toLowerCase() ||
          String(lr.consigneeName || '').toLowerCase() === String(user.partyName || '').toLowerCase()
        );
      });
      setPartyLrs(filtered);
      setLoading(false);
    });
  }, [user]);

  const fyLrs = partyLrs.filter((lr) => {
    if (selectedFY === 'ALL') return true;
    if (!lr.dateTime) return false;
    return getFinancialYear(lr.dateTime).label === selectedFY;
  });

  let totalBilled = 0;
  let totalPaid = 0;
  fyLrs.forEach((lr) => {
    const net = parseFloat(lr.netTotalAmount || lr.freightAmount) || 0;
    totalBilled += net;
    if (lr.partyPaymentStatus === 'PAID') {
      totalPaid += parseFloat(lr.partyPaidAmount || net) || 0;
    }
  });
  const totalRemaining = Math.max(0, totalBilled - totalPaid);

  const generateStatementHtml = () => {
    const rows = fyLrs.map((lr) => `
      <tr>
        <td style="text-align:center;">${lr.lrNumber || '-'}</td>
        <td style="text-align:center;">${formatDateDisplay(lr.dateTime)}</td>
        <td>${lr.truckNo || '-'}</td>
        <td>${lr.fromPlace} &rarr; ${lr.toPlace}</td>
        <td style="text-align:right;">₹ ${formatCurrency(lr.netTotalAmount || lr.freightAmount)}</td>
        <td style="text-align:center; font-weight:bold; color: ${lr.partyPaymentStatus === 'PAID' ? '#009a44' : '#d97706'};">
          ${lr.partyPaymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
        </td>
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
          <div style="font-weight:bold; margin-top:4px;">PARTY PORTAL STATEMENT</div>
          <div>PARTY: <strong>${user?.partyName || user?.username}</strong> | PERIOD: ${selectedFY}</div>
        </div>

        <div class="summary">
          <div><strong>Total Billed:</strong> ₹ ${formatCurrency(totalBilled)}</div>
          <div><strong>Total Paid:</strong> ₹ ${formatCurrency(totalPaid)}</div>
          <div><strong>Outstanding:</strong> ₹ ${formatCurrency(totalRemaining)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>LR No</th>
              <th>Date</th>
              <th>Truck No</th>
              <th>Route</th>
              <th>Net Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" style="text-align:center;">No statement records found.</td></tr>'}
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
      const fileUri = await generateAndSavePdfNative(html, `Party_Statement_${user?.username}.pdf`);
      await shareFileNative(fileUri, "Party Statement PDF");
    } catch (e) {
      Alert.alert("Error", "Failed to export PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title={`Party Portal (${user?.partyName || user?.username})`} />

      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fyRow}>
          {['ALL', '2026-27', '2025-26'].map((fy) => (
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
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderColor: '#3b82f6' }]}>
              <Text style={styles.kpiTitle}>Total Billed</Text>
              <Text style={styles.kpiVal}>₹ {formatCurrency(totalBilled)}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#10b981' }]}>
              <Text style={styles.kpiTitle}>Paid Amount</Text>
              <Text style={[styles.kpiVal, { color: '#34d399' }]}>₹ {formatCurrency(totalPaid)}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#f59e0b' }]}>
              <Text style={styles.kpiTitle}>Pending Balance</Text>
              <Text style={[styles.kpiVal, { color: '#fbbf24' }]}>₹ {formatCurrency(totalRemaining)}</Text>
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

          <Text style={styles.sectionTitle}>LR Statements ({fyLrs.length})</Text>
          {fyLrs.map((lr) => (
            <View key={lr.id || lr.lrNumber} style={styles.lrCard}>
              <View style={styles.cardRow}>
                <Text style={styles.lrNo}>LR No. {lr.lrNumber}</Text>
                <Text style={styles.lrDate}>{formatDateDisplay(lr.dateTime)}</Text>
              </View>
              <Text style={styles.lrRoute}>{lr.truckNo} • {lr.fromPlace} → {lr.toPlace}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.lrNet}>₹ {formatCurrency(lr.netTotalAmount || lr.freightAmount)}</Text>
                <Text style={[styles.lrStatus, lr.partyPaymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending]}>
                  {lr.partyPaymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', padding: 12 },
  fyRow: { gap: 6 },
  fyChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  fyChipActive: { backgroundColor: '#009a44', borderColor: '#009a44' },
  fyChipText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  fyChipTextActive: { color: '#ffffff' },
  scrollContent: { padding: 12 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  kpiCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, padding: 10 },
  kpiTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  kpiVal: { fontSize: 14, fontWeight: '900', color: '#f8fafc', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  printBtn: { flex: 1, height: 42, backgroundColor: '#f59e0b', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 42, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
  lrCard: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lrNo: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  lrDate: { fontSize: 11, color: '#94a3b8' },
  lrRoute: { fontSize: 12, color: '#cbd5e1', marginVertical: 4 },
  lrNet: { fontSize: 14, fontWeight: '900', color: '#4ade80' },
  lrStatus: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusPaid: { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' },
  statusPending: { backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#facc15' },
});
