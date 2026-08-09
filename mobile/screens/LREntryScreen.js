import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Card from "../components/Card";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import SearchablePickerModal from "../components/SearchablePickerModal";
import { Building2, Truck, Save, RotateCcw, ChevronDown } from "lucide-react-native";

export default function LREntryScreen({ route, navigation }) {
  const editItem = route?.params?.editItem || null;

  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showConsignorModal, setShowConsignorModal] = useState(false);
  const [showConsigneeModal, setShowConsigneeModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);

  const [formData, setFormData] = useState({
    lrNumber: "",
    date: new Date().toISOString().split("T")[0],
    consignorName: "",
    consigneeName: "",
    truckNo: "",
    fromLocation: "",
    toLocation: "",
    weightMT: "",
    ratePerMT: "",
    freightAmount: "",
    advanceAmount: "",
    balanceAmount: "",
    deliveryCharges: "",
    netTotalAmount: "",
    remarks: "",
    paymentStatus: "PENDING",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [partyList, truckList, lrs] = await Promise.all([
        apiService.getParties().catch(() => []),
        apiService.getTrucks().catch(() => []),
        apiService.getLREntries().catch(() => []),
      ]);
      setParties(Array.isArray(partyList) ? partyList : []);
      setTrucks(Array.isArray(truckList) ? truckList : []);

      if (editItem) {
        setFormData({
          id: editItem.id,
          lrNumber: String(editItem.lrNumber || ""),
          date: editItem.date || new Date().toISOString().split("T")[0],
          consignorName: editItem.consignorName || "",
          consigneeName: editItem.consigneeName || "",
          truckNo: editItem.truckNo || "",
          fromLocation: editItem.fromLocation || "",
          toLocation: editItem.toLocation || "",
          weightMT: String(editItem.weightMT || ""),
          ratePerMT: String(editItem.ratePerMT || ""),
          freightAmount: String(editItem.freightAmount || ""),
          advanceAmount: String(editItem.advanceAmount || ""),
          balanceAmount: String(editItem.balanceAmount || ""),
          deliveryCharges: String(editItem.deliveryCharges || ""),
          netTotalAmount: String(editItem.netTotalAmount || ""),
          remarks: editItem.remarks || "",
          paymentStatus: editItem.partyPaymentStatus || "PENDING",
        });
      } else if (Array.isArray(lrs) && lrs.length > 0) {
        // Find highest numeric LR number
        const maxNo = lrs.reduce((max, item) => {
          const num = parseInt(item.lrNumber, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        setFormData((prev) => ({ ...prev, lrNumber: String(maxNo + 1) }));
      } else {
        setFormData((prev) => ({ ...prev, lrNumber: "1" }));
      }
    } catch (err) {
      console.error("LR Entry fetch error:", err);
    }
  };

  // Auto Calculations when Weight, Rate, Advance change
  const handleChange = (field, val) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };

      if (field === "weightMT" || field === "ratePerMT") {
        const weight = parseFloat(field === "weightMT" ? val : updated.weightMT) || 0;
        const rate = parseFloat(field === "ratePerMT" ? val : updated.ratePerMT) || 0;
        const freight = weight * rate;
        updated.freightAmount = freight > 0 ? String(freight) : updated.freightAmount;
      }

      const freight = parseFloat(updated.freightAmount) || 0;
      const delivery = parseFloat(updated.deliveryCharges) || 0;
      const netTotal = freight + delivery;
      const advance = parseFloat(updated.advanceAmount) || 0;
      const balance = netTotal - advance;

      updated.netTotalAmount = String(netTotal);
      updated.balanceAmount = String(balance >= 0 ? balance : 0);

      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.lrNumber || !formData.lrNumber.trim()) {
      Alert.alert("Error", "LR Number is required!");
      return;
    }
    if (!formData.consignorName) {
      Alert.alert("Error", "Please select Consignor!");
      return;
    }

    setLoading(true);
    try {
      await apiService.saveLREntry({
        ...formData,
        weightMT: Number(formData.weightMT) || 0,
        ratePerMT: Number(formData.ratePerMT) || 0,
        freightAmount: Number(formData.freightAmount) || 0,
        advanceAmount: Number(formData.advanceAmount) || 0,
        balanceAmount: Number(formData.balanceAmount) || 0,
        deliveryCharges: Number(formData.deliveryCharges) || 0,
        netTotalAmount: Number(formData.netTotalAmount) || 0,
        partyPaymentStatus: formData.paymentStatus,
      });

      Alert.alert("Success", `LR #${formData.lrNumber} saved successfully!`, [
        {
          text: "OK",
          onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save LR entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={editItem ? "Edit LR Entry" : "New LR Entry"} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>LR Information</Text>

          <View style={styles.row}>
            <CustomInput
              label="LR Number"
              value={formData.lrNumber}
              onChangeText={(val) => handleChange("lrNumber", val)}
              placeholder="e.g. 101"
              keyboardType="number-pad"
              style={{ flex: 1, marginRight: 6 }}
              required
            />
            <CustomInput
              label="Date"
              value={formData.date}
              onChangeText={(val) => handleChange("date", val)}
              placeholder="YYYY-MM-DD"
              style={{ flex: 1, marginLeft: 6 }}
              required
            />
          </View>

          {/* Consignor Picker */}
          <Text style={styles.label}>
            Consignor (Shipper) <Text style={styles.required}>*</Text>
          </Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowConsignorModal(true)}>
            <Building2 size={18} color="#f59e0b" />
            <Text style={styles.pickerText}>
              {formData.consignorName || "Select Consignor Party"}
            </Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>

          {/* Consignee Picker */}
          <Text style={styles.label}>Consignee (Receiver)</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowConsigneeModal(true)}>
            <Building2 size={18} color="#38bdf8" />
            <Text style={styles.pickerText}>
              {formData.consigneeName || "Select Consignee Party"}
            </Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>

          {/* Truck Picker */}
          <Text style={styles.label}>Truck Number</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowTruckModal(true)}>
            <Truck size={18} color="#fbbf24" />
            <Text style={styles.pickerText}>{formData.truckNo || "Select Truck"}</Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>

          {/* Route details */}
          <View style={styles.row}>
            <CustomInput
              label="From Location"
              value={formData.fromLocation}
              onChangeText={(val) => handleChange("fromLocation", val)}
              placeholder="From City"
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomInput
              label="To Location"
              value={formData.toLocation}
              onChangeText={(val) => handleChange("toLocation", val)}
              placeholder="To City"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        </Card>

        {/* Freight & Math */}
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>Freight Calculations</Text>

          <View style={styles.row}>
            <CustomInput
              label="Weight (MT)"
              value={formData.weightMT}
              onChangeText={(val) => handleChange("weightMT", val)}
              placeholder="0.00"
              keyboardType="numeric"
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomInput
              label="Rate (Per MT)"
              value={formData.ratePerMT}
              onChangeText={(val) => handleChange("ratePerMT", val)}
              placeholder="0.00"
              keyboardType="numeric"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <View style={styles.row}>
            <CustomInput
              label="Freight (₹)"
              value={formData.freightAmount}
              onChangeText={(val) => handleChange("freightAmount", val)}
              placeholder="0"
              keyboardType="numeric"
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomInput
              label="Delivery (₹)"
              value={formData.deliveryCharges}
              onChangeText={(val) => handleChange("deliveryCharges", val)}
              placeholder="0"
              keyboardType="numeric"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <View style={styles.row}>
            <CustomInput
              label="Advance Paid (₹)"
              value={formData.advanceAmount}
              onChangeText={(val) => handleChange("advanceAmount", val)}
              placeholder="0"
              keyboardType="numeric"
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomInput
              label="Net Total (₹)"
              value={formData.netTotalAmount}
              onChangeText={(val) => handleChange("netTotalAmount", val)}
              placeholder="0"
              keyboardType="numeric"
              editable={false}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          <CustomInput
            label="Balance Payable (₹)"
            value={formData.balanceAmount}
            onChangeText={(val) => handleChange("balanceAmount", val)}
            placeholder="0"
            keyboardType="numeric"
            editable={false}
          />

          <CustomInput
            label="Remarks / Memo"
            value={formData.remarks}
            onChangeText={(val) => handleChange("remarks", val)}
            placeholder="Add optional notes"
          />
        </Card>

        <CustomButton
          title={editItem ? "UPDATE LR ENTRY" : "SAVE LR ENTRY"}
          onPress={handleSave}
          loading={loading}
          icon={Save}
          variant="primary"
          style={{ marginTop: 10, marginBottom: 30 }}
        />
      </ScrollView>

      {/* Consignor Search Modal */}
      <SearchablePickerModal
        visible={showConsignorModal}
        onClose={() => setShowConsignorModal(false)}
        items={parties}
        title="Select Consignor Party"
        selectedValue={formData.consignorName}
        onSelect={(party) => setFormData((prev) => ({ ...prev, consignorName: party.partyName }))}
      />

      {/* Consignee Search Modal */}
      <SearchablePickerModal
        visible={showConsigneeModal}
        onClose={() => setShowConsigneeModal(false)}
        items={parties}
        title="Select Consignee Party"
        selectedValue={formData.consigneeName}
        onSelect={(party) => setFormData((prev) => ({ ...prev, consigneeName: party.partyName }))}
      />

      {/* Truck Search Modal */}
      <SearchablePickerModal
        visible={showTruckModal}
        onClose={() => setShowTruckModal(false)}
        items={trucks}
        title="Select Truck Number"
        selectedValue={formData.truckNo}
        onSelect={(t) => setFormData((prev) => ({ ...prev, truckNo: t.truckNo }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f59e0b",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  required: {
    color: "#f59e0b",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 8,
  },
  pickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
});
