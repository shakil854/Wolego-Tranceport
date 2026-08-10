import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Printer, Download, Share2 } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { formatDateDisplay } from '../../utils/dateUtils';
import { printDocumentNative, generateAndSavePdfNative } from '../../utils/pdfGenerator';
import { shareFileNative } from '../../utils/shareUtils';

export default function LetterPadScreen({ navigation }) {
  const [subject, setSubject] = useState('TO WHOMSOEVER IT MAY CONCERN');
  const [bodyText, setBodyText] = useState('This is to certify that Wolego Transport has provided transport services...');
  const [letterDate, setLetterDate] = useState(formatDateDisplay(new Date()));

  const generateLetterHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
          .title { font-size: 24px; font-weight: bold; color: #009a44; margin: 0; }
          .tagline { font-size: 11px; font-weight: bold; color: #78350f; font-style: italic; }
          .addr { font-size: 9px; font-weight: bold; color: #7f1d1d; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
          .subject { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; text-transform: uppercase; }
          .body { font-size: 12px; line-height: 1.6; min-height: 350px; white-space: pre-line; }
          .sign { text-align: right; margin-top: 50px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size:9px; font-weight:bold;">SUBJECT TO WANKANER JURISDICTION</div>
          <h1 class="title">WOLEGO TRANSPORT</h1>
          <div class="tagline">EVERYTHING IS FAST</div>
          <div class="addr">SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY, CHANDRAPUR, WANKANER-363621 MORBI (GUJARAT)</div>
        </div>

        <div class="meta">
          <div>REF NO: WT/LP/${Date.now().toString().slice(-4)}</div>
          <div>DATE: ${letterDate}</div>
        </div>

        <div class="subject">${subject}</div>

        <div class="body">${bodyText}</div>

        <div class="sign">
          FOR, WOLEGO TRANSPORT<br/><br/><br/>
          (AUTHORISED SIGNATORY)
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      const html = generateLetterHtml();
      await printDocumentNative(html);
    } catch (e) {
      Alert.alert("Error", "Failed to print letter.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const html = generateLetterHtml();
      const fileUri = await generateAndSavePdfNative(html, "Wolego_Letterhead.pdf");
      await shareFileNative(fileUri, "Letterhead PDF");
    } catch (e) {
      Alert.alert("Error", "Failed to export letterhead PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Letter Pad Generator" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Letter Date</Text>
          <TextInput style={styles.input} value={letterDate} onChangeText={setLetterDate} />

          <Text style={styles.label}>Subject / Title *</Text>
          <TextInput style={styles.inputBold} value={subject} onChangeText={setSubject} />

          <Text style={styles.label}>Letter Content / Body *</Text>
          <TextInput
            style={[styles.input, { height: 220, textAlignVertical: 'top' }]}
            value={bodyText}
            onChangeText={setBodyText}
            multiline
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Printer size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Print Letterhead</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
              <Download size={16} color="#0f172a" />
              <Text style={[styles.btnText, { color: '#0f172a' }]}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, height: 44, color: '#f8fafc', fontSize: 13 },
  inputBold: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#0ea5e9', paddingHorizontal: 12, height: 44, color: '#38bdf8', fontWeight: 'bold', fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  printBtn: { flex: 1, height: 46, backgroundColor: '#f59e0b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 46, backgroundColor: '#10b981', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontWeight: 'bold', fontSize: 13 },
});
