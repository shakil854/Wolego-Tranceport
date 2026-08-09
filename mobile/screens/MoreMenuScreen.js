import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Header from "../components/Header";
import Card from "../components/Card";
import {
  FileText,
  Truck,
  Users,
  Receipt,
  PackagePlus,
  Bell,
  Settings,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  CreditCard,
} from "lucide-react-native";

export default function MoreMenuScreen({ navigation }) {
  const menuItems = [
    { title: "New LR Entry", screen: "LREntry", icon: PlusCircle, color: "#f59e0b" },
    { title: "LR Records List", screen: "LRList", icon: FileText, color: "#38bdf8" },
    { title: "Freight Receipts", screen: "FreightReceipt", icon: Receipt, color: "#009a44" },
    { title: "Party Ledger", screen: "Accounting", icon: Receipt, color: "#34d399" },
    { title: "Truck Ledger", screen: "TruckAccounting", icon: Truck, color: "#f87171" },
    { title: "Party Master", screen: "PartyMaster", icon: Users, color: "#a78bfa" },
    { title: "Truck Master", screen: "TruckMaster", icon: Truck, color: "#fbbf24" },
    { title: "Party Orders", screen: "PartyOrders", icon: PackagePlus, color: "#c084fc" },
    { title: "Truck Orders", screen: "TruckOrders", icon: Truck, color: "#38bdf8" },
    { title: "Truck Debit / Payment", screen: "TruckPayment", icon: CreditCard, color: "#f87171" },
    { title: "Daily Summary Report", screen: "DailyReport", icon: TrendingUp, color: "#009a44" },
    { title: "Payment Alerts", screen: "PaymentAlerts", icon: AlertTriangle, color: "#f87171" },
    { title: "Truck Coming", screen: "TruckComing", icon: Truck, color: "#fbbf24" },
    { title: "Server Settings", screen: "Settings", icon: Settings, color: "#94a3b8" },
  ];

  return (
    <View style={styles.screen}>
      <Header title="All Modules & Menu" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>Full Feature Menu</Text>
        <View style={styles.grid}>
          {menuItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <Pressable key={idx} style={styles.cardBtn} onPress={() => navigation.navigate(item.screen)}>
                <Card style={styles.innerCard}>
                  <IconComp size={26} color={item.color} />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f59e0b",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cardBtn: {
    width: "48%",
  },
  innerCard: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f8fafc",
    marginTop: 8,
    textAlign: "center",
  },
});
