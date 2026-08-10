import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Printer, Download } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi } from '../../api/endpoints';
import { generateLRHtmlForMobile, printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function BulkLRPrintScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [lrs, setLrs] = useState([]);
  const [startLr, setStartLr] = useState('');
  const [endLr, setEndLr] = useState('');

  useEffect(() => {
    fetchLREntriesApi().then((data) => {
      setLrs(data || []);
      if (data && data.length > 0) {
        setStartLr(String(data[data.length - 1]?.lrNumber || '0001'));
        setEndLr(String(data[0]?.lrNumber || '0001'));
      }
      setLoading(false);
    });
  }, []);

  const getSelectedLrs = () => {
    const s = parseInt(startLr, 10);
    const e = parseInt(endLr, 10);
    if (isNaN(s) || isNaN(e)) return [];
    const min = Math.min(s, e);
    const max = Math.max(s, e);

    return lrs.filter((lr) => {
      const num = parseInt(lr.lrNumber, 10);
      return !isNaN(num) && num >= min && num <= max;
    });
  };

  const generateBulkHtml = () => {
    const selected = getSelectedLrs();
    if (selected.length === 0) return '';
    return selected.map((lr) => generateLRHtmlForMobile(lr, null, ["CONSIGNOR"])).join('<div style="page-break-before: always;"></div>');
  };

  const handlePrint = async () => {
    const html = generateBulkHtml();
    if (!html) {
      Alert.alert("No LRs Selected", "Please enter a valid start and end LR range.");
      return;
    }
    try {
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Print Error", "Failed to print bulk LRs.");
    }
  };

  const handleExportPDF = async () => {
    const html = generateBulkHtml();
    if (!html) {
      Alert.alert("No LRs Selected", "Please enter a valid start and end LR range.");
      return;
    }
    try {
      const fileUri = await generateAndSavePdfNative(html, `Bulk_LR_Print_${startLr}_to_${endLr}.pdf`);
      await shareFileNative(fileUri, "Bulk LRs PDF");
    } catch (e) {
      Alert.alert("Export Error", "Failed to export bulk PDF.");
    }
  };

  const selectedCount = getSelectedLrs().length;

  return (
    <View style={styles.container}>
      <HeaderBar title="Range / Bulk LR Printing" />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Batch LR Range Printing</Text>
            <Text style={styles.cardSubtitle}>
              Select a range of LR numbers (e.g. 0001 to 0010) to print or export as a single multi-page PDF document.
            </Text>

            <View style={styles.rowTwo}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Start LR Number</Text>
                <TextInput style={styles.inputBold} value={startLr} onChangeText={setStartLr} keyboardType="numeric" />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>End LR Number</Text>
                <TextInput style={styles.inputBold} value={endLr} onChangeText={setEndLr} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Matched LRs in Range: <Text style={styles.bold}>{selectedCount} Documents</Text></Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Printer size={16} color="#0f172a" />
                <Text style={[styles.btnText, { color: '#0f172a' }]}>Print Range A4</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
                <Download size={16} color="#0f172a" />
                <Text style={[styles.btnText, { color: '#0f172a' }]}>Export Range PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  fieldHalf: { flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 6 },
  inputBold: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6', paddingHorizontal: 12, height: 44, color: '#60a5fa', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  infoBox: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155', padding: 12, marginBottom: 20, alignItems: 'center' },
  infoText: { fontSize: 13, color: '#cbd5e1' },
  bold: { color: '#4ade80', fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', gap: 10 },
  printBtn: { flex: 1, height: 46, backgroundColor: '#f59e0b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 46, backgroundColor: '#10b981', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
});
