import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Image, Switch } from 'react-native';
import { Save, Printer, Download, Share2, Plus, Trash2, Search, FileSignature, CheckSquare, Square } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../../components/HeaderBar';
import SearchableSelect from '../../components/SearchableSelect';
import { fetchPartiesApi, fetchTrucksApi, fetchLREntriesApi, saveLREntryApi } from '../../api/endpoints';
import { formatDateForInput, getNextLRNumber, formatCurrency } from '../../utils/dateUtils';
import { saveDigitalSignature, getDigitalSignature } from '../../utils/storage';
import { generateLRHtmlForMobile, printDocumentNative, fetchAndSaveBackendLRPdf } from '../../utils/pdfGenerator';
import { shareFileNative, shareToWhatsApp } from '../../utils/shareUtils';

export default function LREntryScreen({ navigation, route }) {
  const editLRData = route?.params?.editLR;

  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [allLrs, setAllLrs] = useState([]);

  // Select Modals
  const [consignorModal, setConsignorModal] = useState(false);
  const [consigneeModal, setConsigneeModal] = useState(false);
  const [truckModal, setTruckModal] = useState(false);

  // Form Fields
  const [lrNumber, setLrNumber] = useState('');
  const [dateTime, setDateTime] = useState(formatDateForInput(new Date()));
  const [fromPlace, setFromPlace] = useState('WANKANER');
  const [toPlace, setToPlace] = useState('');
  const [deliveryAt, setDeliveryAt] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [driverMobile, setDriverMobile] = useState('');

  // Consignor
  const [consignorId, setConsignorId] = useState('');
  const [consignorName, setConsignorName] = useState('');
  const [consignorAddress, setConsignorAddress] = useState('');
  const [consignorGst, setConsignorGst] = useState('');

  // Consignee
  const [consigneeId, setConsigneeId] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneeGst, setConsigneeGst] = useState('');

  // Goods
  const [noOfArticles, setNoOfArticles] = useState('');
  const [bundles, setBundles] = useState('BOX');
  const [descriptionOfGoods, setDescriptionOfGoods] = useState('TILES');
  const [weightKgs, setWeightKgs] = useState('');
  const [ratePerTon, setRatePerTon] = useState('');
  const [rateType, setRateType] = useState('PER TON');

  const [noOfArticles2, setNoOfArticles2] = useState('');
  const [bundles2, setBundles2] = useState('BUNDLE');
  const [descriptionOfGoods2, setDescriptionOfGoods2] = useState('SANITARYWARE');

  // Charges
  const [toPayOrPaid, setToPayOrPaid] = useState('TBB');
  const [freightAmount, setFreightAmount] = useState('');
  const [gstPayableBy, setGstPayableBy] = useState('CONSIGNEE');

  const [sgstAmount, setSgstAmount] = useState('0.00');
  const [cgstAmount, setCgstAmount] = useState('0.00');
  const [igstAmount, setIgstAmount] = useState('0.00');
  const [totalWithGst, setTotalWithGst] = useState('0.00');
  const [otherCharges, setOtherCharges] = useState('0');
  const [lessAdvancePaid, setLessAdvancePaid] = useState('0');
  const [netTotalAmount, setNetTotalAmount] = useState('0.00');

  // Extra Details
  const [consignorEwayBill, setConsignorEwayBill] = useState('');
  const [consigneeEwayBill, setConsigneeEwayBill] = useState('');
  const [billNumbers, setBillNumbers] = useState('');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [remarks, setRemarks] = useState('WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.');

  // Copies Toggles
  const [selectedCopies, setSelectedCopies] = useState(["CONSIGNOR"]);
  const [signatureImg, setSignatureImg] = useState(null);

  useEffect(() => {
    loadMasters();
    getDigitalSignature().then(setSignatureImg);
  }, []);

  const loadMasters = async () => {
    try {
      const [partyRes, truckRes, lrRes] = await Promise.all([
        fetchPartiesApi(),
        fetchTrucksApi(),
        fetchLREntriesApi(),
      ]);
      setParties(partyRes || []);
      setTrucks(truckRes || []);
      setAllLrs(lrRes || []);

      if (editLRData) {
        populateForm(editLRData);
      } else {
        const nextLr = getNextLRNumber(new Date(), lrRes || []);
        setLrNumber(nextLr);
      }
    } catch (e) {
      console.error("Load masters error:", e);
    }
  };

  const populateForm = (data) => {
    setLrNumber(data.lrNumber || '');
    setDateTime(formatDateForInput(data.dateTime || new Date()));
    setFromPlace(data.fromPlace || 'WANKANER');
    setToPlace(data.toPlace || '');
    setDeliveryAt(data.deliveryAt || '');
    setTruckNo(data.truckNo || '');
    setDriverMobile(data.driverMobile || '');

    setConsignorId(data.consignorId || '');
    setConsignorName(data.consignorName || '');
    setConsignorAddress(data.consignorAddress || '');
    setConsignorGst(data.consignorGst || '');

    setConsigneeId(data.consigneeId || '');
    setConsigneeName(data.consigneeName || '');
    setConsigneeAddress(data.consigneeAddress || '');
    setConsigneeGst(data.consigneeGst || '');

    setNoOfArticles(String(data.noOfArticles || ''));
    setBundles(data.bundles || 'BOX');
    setDescriptionOfGoods(data.descriptionOfGoods || 'TILES');
    setWeightKgs(String(data.weightKgs || ''));
    setRatePerTon(String(data.ratePerTon || ''));
    setRateType(data.rateType || 'PER TON');

    setNoOfArticles2(String(data.noOfArticles2 || ''));
    setBundles2(data.bundles2 || 'BUNDLE');
    setDescriptionOfGoods2(data.descriptionOfGoods2 || 'SANITARYWARE');

    setToPayOrPaid(data.toPayOrPaid || 'TBB');
    setFreightAmount(String(data.freightAmount || ''));
    setGstPayableBy(data.gstPayableBy || 'CONSIGNEE');

    setSgstAmount(String(data.sgstAmount || '0.00'));
    setCgstAmount(String(data.cgstAmount || '0.00'));
    setIgstAmount(String(data.igstAmount || '0.00'));
    setTotalWithGst(String(data.totalWithGst || '0.00'));
    setOtherCharges(String(data.otherCharges || '0'));
    setLessAdvancePaid(String(data.lessAdvancePaid || '0'));
    setNetTotalAmount(String(data.netTotalAmount || '0.00'));

    setConsignorEwayBill(data.consignorEwayBill || '');
    setConsigneeEwayBill(data.consigneeEwayBill || '');
    setBillNumbers(data.billNumbers || '');
    setInvoiceValue(String(data.invoiceValue || ''));
    setRemarks(data.remarks || '');
  };

  // Auto calculate freight & GST when weight/rate/freight changes
  useEffect(() => {
    let baseFreight = parseFloat(freightAmount) || 0;
    const wt = parseFloat(weightKgs) || 0;
    const rt = parseFloat(ratePerTon) || 0;

    if (rt > 0 && wt > 0 && rateType === 'PER TON') {
      baseFreight = Math.round((wt / 1000) * rt);
      setFreightAmount(String(baseFreight));
    }

    const sgst = (baseFreight * 0.025).toFixed(2);
    const cgst = (baseFreight * 0.025).toFixed(2);
    const igst = (baseFreight * 0.05).toFixed(2);
    const totalGst = baseFreight + parseFloat(sgst) + parseFloat(cgst);

    setSgstAmount(sgst);
    setCgstAmount(cgst);
    setIgstAmount(igst);
    setTotalWithGst(totalGst.toFixed(2));

    const other = parseFloat(otherCharges) || 0;
    const advance = parseFloat(lessAdvancePaid) || 0;
    const net = Math.max(0, baseFreight + other - advance);
    setNetTotalAmount(net.toFixed(2));
  }, [weightKgs, ratePerTon, rateType, freightAmount, otherCharges, lessAdvancePaid]);

  const handlePickSignature = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/png;base64,${result.assets[0].base64}`;
      setSignatureImg(base64);
      await saveDigitalSignature(base64);
    }
  };

  const toggleCopy = (type) => {
    setSelectedCopies((prev) =>
      prev.includes(type) ? (prev.length > 1 ? prev.filter((c) => c !== type) : prev) : [...prev, type]
    );
  };

  const buildFormData = () => {
    return {
      id: editLRData?.id || `LR-${lrNumber}`,
      lrNumber,
      dateTime,
      fromPlace,
      toPlace,
      deliveryAt,
      truckNo,
      driverMobile,
      consignorId,
      consignorName,
      consignorAddress,
      consignorGst,
      consigneeId,
      consigneeName,
      consigneeAddress,
      consigneeGst,
      noOfArticles,
      bundles,
      descriptionOfGoods,
      weightKgs,
      ratePerTon,
      rateType,
      noOfArticles2,
      bundles2,
      descriptionOfGoods2,
      toPayOrPaid,
      freightAmount,
      gstPayableBy,
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalWithGst,
      otherCharges,
      lessAdvancePaid,
      netTotalAmount,
      consignorEwayBill,
      consigneeEwayBill,
      billNumbers,
      invoiceValue,
      remarks,
    };
  };

  const handleSave = async () => {
    if (!lrNumber || !truckNo || !consignorName || !consigneeName) {
      Alert.alert("Required Fields Missing", "LR Number, Truck Number, Consignor and Consignee are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildFormData();
      await saveLREntryApi(payload);
      Alert.alert("Success", `LR No. ${lrNumber} saved successfully to MySQL DB!`);
      navigation.navigate("LRList");
    } catch (err) {
      Alert.alert("Save Error", err?.response?.data?.error || err?.message || "Failed to save LR entry.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const payload = buildFormData();
      const html = generateLRHtmlForMobile(payload, signatureImg, selectedCopies);
      await printDocumentNative(html);
    } catch (err) {
      Alert.alert("Print Error", "Failed to print LR document.");
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const payload = buildFormData();
      const fileUri = await fetchAndSaveBackendLRPdf(payload, signatureImg, selectedCopies);
      await shareFileNative(fileUri, "Export LR PDF");
    } catch (err) {
      Alert.alert("PDF Error", "Failed to export PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    setLoading(true);
    try {
      const payload = buildFormData();
      const fileUri = await fetchAndSaveBackendLRPdf(payload, signatureImg, selectedCopies);
      const msg = `Wolego Transport LR No: ${payload.lrNumber}\nTruck No: ${payload.truckNo}\nFrom: ${payload.fromPlace} -> To: ${payload.toPlace}\nConsignor: ${payload.consignorName}\nConsignee: ${payload.consigneeName}`;
      await shareToWhatsApp('', msg, fileUri);
    } catch (err) {
      Alert.alert("WhatsApp Error", "Failed to share via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title={editLRData ? `Edit LR ${editLRData.lrNumber}` : "New LR Entry"} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Copy Selection Checkboxes */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Select Copies</Text>
          <View style={styles.copyRow}>
            {['CONSIGNOR', 'CONSIGNEE', 'TRUCK', 'OFFICE'].map((type) => (
              <TouchableOpacity key={type} style={styles.checkboxItem} onPress={() => toggleCopy(type)}>
                {selectedCopies.includes(type) ? <CheckSquare size={18} color="#009a44" /> : <Square size={18} color="#64748b" />}
                <Text style={styles.checkboxLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Header Grid: LR No, Date, From, To, Truck */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>LR Details</Text>
          
          <View style={styles.rowTwo}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>L.R. Number *</Text>
              <TextInput style={styles.inputBold} value={lrNumber} onChangeText={setLrNumber} keyboardType="numeric" />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={dateTime} onChangeText={setDateTime} />
            </View>
          </View>

          <View style={styles.rowTwo}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>From Place</Text>
              <TextInput style={styles.input} value={fromPlace} onChangeText={setFromPlace} />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>To Place</Text>
              <TextInput style={styles.input} value={toPlace} onChangeText={setToPlace} placeholder="e.g. AHMEDABAD" placeholderTextColor="#64748b" />
            </View>
          </View>

          <View style={styles.rowTwo}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Truck Number *</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setTruckModal(true)}>
                <Text style={styles.selectBtnText} numberOfLines={1}>{truckNo || "Select Truck"}</Text>
                <Search size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Driver Mobile</Text>
              <TextInput style={styles.input} value={driverMobile} onChangeText={setDriverMobile} keyboardType="phone-pad" />
            </View>
          </View>
        </View>

        {/* Consignor Details Box */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Consignor (Sender)</Text>
            <TouchableOpacity onPress={() => setConsignorModal(true)}>
              <Text style={styles.searchLink}>Select Party</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Consignor Name *" placeholderTextColor="#64748b" value={consignorName} onChangeText={setConsignorName} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Address" placeholderTextColor="#64748b" value={consignorAddress} onChangeText={setConsignorAddress} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="GSTIN No" placeholderTextColor="#64748b" value={consignorGst} onChangeText={setConsignorGst} />
        </View>

        {/* Consignee Details Box */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Consignee (Receiver)</Text>
            <TouchableOpacity onPress={() => setConsigneeModal(true)}>
              <Text style={styles.searchLink}>Select Party</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Consignee Name *" placeholderTextColor="#64748b" value={consigneeName} onChangeText={setConsigneeName} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Address" placeholderTextColor="#64748b" value={consigneeAddress} onChangeText={setConsigneeAddress} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="GSTIN No" placeholderTextColor="#64748b" value={consigneeGst} onChangeText={setConsigneeGst} />
        </View>

        {/* Goods Description */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Goods & Rate Details</Text>

          <View style={styles.rowThree}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Articles</Text>
              <TextInput style={styles.input} value={noOfArticles} onChangeText={setNoOfArticles} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Unit</Text>
              <TextInput style={styles.input} value={bundles} onChangeText={setBundles} />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Goods Description</Text>
              <TextInput style={styles.input} value={descriptionOfGoods} onChangeText={setDescriptionOfGoods} />
            </View>
          </View>

          <View style={styles.rowThree} style={{ marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Weight (K.G.)</Text>
              <TextInput style={styles.input} value={weightKgs} onChangeText={setWeightKgs} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Rate</Text>
              <TextInput style={styles.input} value={ratePerTon} onChangeText={setRatePerTon} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Freight Amount</Text>
              <TextInput style={styles.inputBold} value={freightAmount} onChangeText={setFreightAmount} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Financial Totals & Charges */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Calculations & Net Total</Text>

          <View style={styles.rowTwo}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Other Charges (₹)</Text>
              <TextInput style={styles.input} value={otherCharges} onChangeText={setOtherCharges} keyboardType="numeric" />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Less Advance (₹)</Text>
              <TextInput style={styles.input} value={lessAdvancePaid} onChangeText={setLessAdvancePaid} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.netBox}>
            <Text style={styles.netLabel}>NET TOTAL AMOUNT:</Text>
            <Text style={styles.netValue}>₹ {formatCurrency(netTotalAmount)}</Text>
          </View>
        </View>

        {/* E-Way & Remarks */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>E-Way Bill & Invoice Details</Text>
          <TextInput style={styles.input} placeholder="Consignor E-Way Bill" placeholderTextColor="#64748b" value={consignorEwayBill} onChangeText={setConsignorEwayBill} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Consignee E-Way Bill" placeholderTextColor="#64748b" value={consigneeEwayBill} onChangeText={setConsigneeEwayBill} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Bill Numbers" placeholderTextColor="#64748b" value={billNumbers} onChangeText={setBillNumbers} />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Invoice Value (₹)" placeholderTextColor="#64748b" value={invoiceValue} onChangeText={setInvoiceValue} keyboardType="numeric" />
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Remarks" placeholderTextColor="#64748b" value={remarks} onChangeText={setRemarks} multiline />
        </View>

        {/* Digital Signature */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Digital Signature</Text>
            <TouchableOpacity onPress={handlePickSignature}>
              <Text style={styles.searchLink}>Upload Sign</Text>
            </TouchableOpacity>
          </View>
          {signatureImg ? (
            <Image source={{ uri: signatureImg }} style={styles.signaturePreview} resizeMode="contain" />
          ) : (
            <Text style={{ color: '#64748b', fontSize: 12 }}>No signature attached.</Text>
          )}
        </View>

        {/* Action Buttons Bar */}
        <View style={styles.btnBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <><Save size={18} color="#fff" /><Text style={styles.btnText}>Save LR</Text></>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
            <Printer size={18} color="#0f172a" />
            <Text style={[styles.btnText, { color: '#0f172a' }]}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
            <Download size={18} color="#0f172a" />
            <Text style={[styles.btnText, { color: '#0f172a' }]}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.waBtn} onPress={handleShareWhatsApp}>
            <Share2 size={18} color="#fff" />
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Party Select Modals */}
      <SearchableSelect
        visible={consignorModal}
        title="Select Consignor Party"
        items={parties}
        labelKey="partyName"
        valueKey="id"
        subtitleKey="city"
        selectedValue={consignorId}
        onSelect={(p) => {
          setConsignorId(p.id);
          setConsignorName(p.partyName || '');
          setConsignorAddress(p.address || '');
          setConsignorGst(p.gstNo || '');
        }}
        onClose={() => setConsignorModal(false)}
      />

      <SearchableSelect
        visible={consigneeModal}
        title="Select Consignee Party"
        items={parties}
        labelKey="partyName"
        valueKey="id"
        subtitleKey="city"
        selectedValue={consigneeId}
        onSelect={(p) => {
          setConsigneeId(p.id);
          setConsigneeName(p.partyName || '');
          setConsigneeAddress(p.address || '');
          setConsigneeGst(p.gstNo || '');
        }}
        onClose={() => setConsigneeModal(false)}
      />

      <SearchableSelect
        visible={truckModal}
        title="Select Truck"
        items={trucks}
        labelKey="truckNo"
        valueKey="id"
        subtitleKey="driverMobile"
        selectedValue={truckNo}
        onSelect={(t) => {
          setTruckNo(t.truckNo || '');
          setDriverMobile(t.driverMobile || t.mobileNo || '');
        }}
        onClose={() => setTruckModal(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 14 },
  sectionBox: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 14, marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  searchLink: { fontSize: 12, fontWeight: 'bold', color: '#38bdf8' },
  copyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkboxLabel: { fontSize: 12, color: '#cbd5e1', fontWeight: 'bold' },
  rowTwo: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  rowThree: { flexDirection: 'row', gap: 8 },
  fieldHalf: { flex: 1 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, height: 42, color: '#f8fafc', fontSize: 13 },
  inputBold: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#009a44', paddingHorizontal: 10, height: 42, color: '#4ade80', fontWeight: 'bold', fontSize: 14 },
  selectBtn: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectBtnText: { color: '#f8fafc', fontSize: 13, flex: 1 },
  netBox: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#eab308', padding: 12, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel: { fontSize: 12, fontWeight: 'bold', color: '#eab308' },
  netValue: { fontSize: 18, fontWeight: '900', color: '#facc15' },
  signaturePreview: { height: 50, width: 140, marginTop: 6 },
  btnBar: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  saveBtn: { flex: 1, height: 48, backgroundColor: '#009a44', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  printBtn: { flex: 1, height: 48, backgroundColor: '#f59e0b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtn: { flex: 1, height: 48, backgroundColor: '#10b981', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  waBtn: { flex: 1, height: 48, backgroundColor: '#16a34a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
