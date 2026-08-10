import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Printer, Download, Share2, Search } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import SearchableSelect from '../../components/SearchableSelect';
import { fetchLREntriesApi } from '../../api/endpoints';
import { formatDateDisplay, formatCurrency } from '../../utils/dateUtils';
import { printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function FreightReceiptScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [lrs, setLrs] = useState([]);
  const [selectedLr, setSelectedLr] = useState(null);
  const [lrModal, setLrModal] = useState(false);

  const [receiptNo, setReceiptNo] = useState(`FR-${Date.now().toString().slice(-4)}`);
  const [receivedFrom, setReceivedFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CHEQUE');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    fetchLREntriesApi().then((data) => {
      setLrs(data || []);
      if (data && data.length > 0) {
        handleSelectLr(data[0]);
      }
      setLoading(false);
    });
  }, []);

  const handleSelectLr = (lr) => {
    setSelectedLr(lr);
    setReceivedFrom(lr.consignorName || lr.consigneeName || '');
    setAmount(String(lr.netTotalAmount || lr.freightAmount || ''));
  };

  const generateReceiptHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; color: #000; }
          .box { border: 2px solid #000; padding: 12px; }
          .title { text-align: center; font-size: 20px; font-weight: bold; color: #009a44; margin: 2px 0; }
          .subtitle { text-align: center; font-weight: bold; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="box">
          <div style="text-align:center; font-size:9px; font-weight:bold;">SUBJECT TO WANKANER JURISDICTION</div>
          <div class="title">WOLEGO TRANSPORT</div>
          <div class="subtitle">FREIGHT RECEIPT</div>

          <div class="row">
            <div>Receipt No: <strong>${receiptNo}</strong></div>
            <div>Date: <strong>${formatDateDisplay(new Date())}</strong></div>
          </div>
          <div class="row">
            <div>LR No: <strong>${selectedLr?.lrNumber || '-'}</strong></div>
            <div>Truck No: <strong>${selectedLr?.truckNo || '-'}</strong></div>
          </div>
          <div style="margin: 10px 0; border-top:1px solid #000; border-bottom:1px solid #000; padding:8px 0;">
            <div>Received with thanks from: <strong>${receivedFrom}</strong></div>
            <div>Amounting to Rupees: <strong>₹ ${formatCurrency(amount)}</strong></div>
            <div>Payment Mode: <strong>${paymentMode}</strong> ${chequeNo ? `(Cheque/Txn: ${chequeNo})` : ''}</div>
          </div>

          <div style="text-align:right; margin-top:30px; font-weight:bold;">
            FOR, WOLEGO TRANSPORT<br/><br/>
            (AUTHORISED SIGNATORY)
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateReceiptHtml();
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Error", "Failed to print receipt.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const html = generateReceiptHtml();
      const fileUri = await generateAndSavePdfNative(html, `Freight_Receipt_${receiptNo}.pdf`);
      await shareFileNative(fileUri, "Freight Receipt PDF");
    } catch (e) {
      Alert.alert("Error", "Failed to export PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Freight Receipt Generator" />

      {loading ? (
        <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.label}>Select LR Entry *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setLrModal(true)}>
              <Text style={styles.selectText} numberOfLines={1}>
                {selectedLr ? `LR No. ${selectedLr.lrNumber} (${selectedLr.truckNo})` : "Select LR"}
              </Text>
              <Search size={16} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.label}>Receipt Number</Text>
            <TextInput style={styles.input} value={receiptNo} onChangeText={setReceiptNo} />

            <Text style={styles.label}>Received From (Party)</Text>
            <TextInput style={styles.input} value={receivedFrom} onChangeText={setReceivedFrom} />

            <Text style={styles.label}>Amount Received (₹)</Text>
            <TextInput style={styles.inputBold} value={amount} onChangeText={setAmount} keyboardType="numeric" />

            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.modeRow}>
              {['CHEQUE', 'ONLINE/NEFT', 'CASH'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text style={[styles.modeText, paymentMode === mode && styles.modeTextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cheque / Transaction No</Text>
            <TextInput style={styles.input} placeholder="e.g. 000123 / UTR" placeholderTextColor="#64748b" value={chequeNo} onChangeText={setChequeNo} />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Printer size={16} color="#0f172a" />
                <Text style={[styles.btnText, { color: '#0f172a' }]}>Print Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
                <Download size={16} color="#0f172a" />
                <Text style={[styles.btnText, { color: '#0f172a' }]}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      <SearchableSelect
        visible={lrModal}
        title="Select LR Entry"
        items={lrs}
        labelKey="lrNumber"
        valueKey="id"
        subtitleKey="truckNo"
        selectedValue={selectedLr?.id}
        onSelect={handleSelectLr}
        onClose={() => setLrModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, color: '#f8fafc', fontSize: 13 },
  inputBold: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#009a44', paddingHorizontal: 12, height: 44, color: '#4ade80', fontWeight: 'bold', fontSize: 15 },
  selectBtn: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: '#f8fafc', fontSize: 13, flex: 1, fontWeight: 'bold' },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modeChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  modeChipActive: { backgroundColor: '#009a44', borderColor: '#009a44' },
  modeText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  modeTextActive: { color: '#ffffff' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  printBtn: { flex: 1, height: 46, backgroundColor: '#f59e0b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 46, backgroundColor: '#10b981', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
});
