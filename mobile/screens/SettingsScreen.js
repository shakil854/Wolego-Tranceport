import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, DEFAULT_API_URL } from "../config/api";
import Header from "../components/Header";
import Card from "../components/Card";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Server, RotateCcw, Check } from "lucide-react-native";

export default function SettingsScreen({ navigation }) {
  const [apiUrl, setApiUrl] = useState("");
  const [currentSaved, setCurrentSaved] = useState("");

  useEffect(() => {
    loadUrl();
  }, []);

  const loadUrl = async () => {
    const active = await getApiBaseUrl();
    setApiUrl(active);
    setCurrentSaved(active);
  };

  const handleSave = async () => {
    if (!apiUrl || !apiUrl.trim()) {
      Alert.alert("Error", "API Base URL cannot be empty.");
      return;
    }
    await setApiBaseUrl(apiUrl);
    await loadUrl();
    Alert.alert("Saved", "API Server URL updated successfully!");
  };

  const handleReset = async () => {
    await resetApiBaseUrl();
    await loadUrl();
    Alert.alert("Reset", "API Base URL reset to default!");
  };

  return (
    <View style={styles.screen}>
      <Header title="Server Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.cardHeader}>
            <Server size={20} color="#f59e0b" />
            <Text style={styles.cardTitle}>Backend API Server Configuration</Text>
          </View>

          <Text style={styles.description}>
            Default live server is <Text style={styles.highlight}>https://wolegotransport.com/api</Text>.
            For local testing, you can change this to your local backend server (e.g. <Text style={styles.highlight}>http://10.0.2.2:8002/api</Text> or <Text style={styles.highlight}>http://192.168.x.x:8002/api</Text>).
          </Text>

          <View style={styles.currentBox}>
            <Text style={styles.currentLabel}>Current Active Server URL:</Text>
            <Text style={styles.currentVal}>{currentSaved}</Text>
          </View>

          <CustomInput
            label="API Base URL"
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.100:8002/api"
            icon={Server}
          />

          <View style={styles.actions}>
            <CustomButton
              title="Reset Default"
              variant="secondary"
              icon={RotateCcw}
              onPress={handleReset}
              style={{ flex: 1, marginRight: 6 }}
            />
            <CustomButton
              title="Save URL"
              variant="primary"
              icon={Check}
              onPress={handleSave}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        </Card>
      </ScrollView>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#f8fafc",
  },
  description: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 16,
  },
  highlight: {
    color: "#f59e0b",
    fontWeight: "700",
  },
  currentBox: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  currentVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#34d399",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
});
