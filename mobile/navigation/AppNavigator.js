import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";

// Screens
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LREntryScreen from "../screens/LREntryScreen";
import LRListScreen from "../screens/LRListScreen";
import PartyMasterScreen from "../screens/PartyMasterScreen";
import TruckMasterScreen from "../screens/TruckMasterScreen";
import AccountingScreen from "../screens/AccountingScreen";
import TruckAccountingScreen from "../screens/TruckAccountingScreen";
import PartyOrdersScreen from "../screens/PartyOrdersScreen";
import TruckOrdersScreen from "../screens/TruckOrdersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import FreightReceiptScreen from "../screens/FreightReceiptScreen";
import DailyReportScreen from "../screens/DailyReportScreen";
import PaymentAlertsScreen from "../screens/PaymentAlertsScreen";
import TruckComingScreen from "../screens/TruckComingScreen";
import PartyLRRecordsScreen from "../screens/PartyLRRecordsScreen";
import TruckPaymentScreen from "../screens/TruckPaymentScreen";
import MoreMenuScreen from "../screens/MoreMenuScreen";

// Icons
import {
  LayoutDashboard,
  FileText,
  Users,
  Truck,
  Receipt,
  PackagePlus,
  Menu,
} from "lucide-react-native";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Owner Tabs
function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="LRList"
        component={LRListScreen}
        options={{
          tabBarLabel: "LR Records",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PartyMaster"
        component={PartyMasterScreen}
        options={{
          tabBarLabel: "Parties",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TruckMaster"
        component={TruckMasterScreen}
        options={{
          tabBarLabel: "Trucks",
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{
          tabBarLabel: "All Menu",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Party Tabs
function PartyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tab.Screen
        name="Accounting"
        component={AccountingScreen}
        options={{
          tabBarLabel: "My Ledger",
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PartyLRRecords"
        component={PartyLRRecordsScreen}
        options={{
          tabBarLabel: "My LR Records",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PartyOrders"
        component={PartyOrdersScreen}
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color, size }) => <PackagePlus size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Truck Tabs
function TruckTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tab.Screen
        name="TruckAccounting"
        component={TruckAccountingScreen}
        options={{
          tabBarLabel: "Freight Ledger",
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TruckOrders"
        component={TruckOrdersScreen}
        options={{
          tabBarLabel: "Trips & Availability",
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, isOwner, isParty, isTruck } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const getRoleTabs = () => {
    if (isParty) return PartyTabs;
    if (isTruck) return TruckTabs;
    return OwnerTabs;
  };

  return (
    <NavigationContainer theme={{ dark: true, colors: { primary: "#f59e0b", background: "#0f172a", card: "#0f172a", text: "#f8fafc", border: "#1e293b", notification: "#f59e0b" } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={getRoleTabs()} />
            <Stack.Screen name="LREntry" component={LREntryScreen} />
            <Stack.Screen name="LRList" component={LRListScreen} />
            <Stack.Screen name="FreightReceipt" component={FreightReceiptScreen} />
            <Stack.Screen name="Accounting" component={AccountingScreen} />
            <Stack.Screen name="TruckAccounting" component={TruckAccountingScreen} />
            <Stack.Screen name="PartyMaster" component={PartyMasterScreen} />
            <Stack.Screen name="TruckMaster" component={TruckMasterScreen} />
            <Stack.Screen name="PartyOrders" component={PartyOrdersScreen} />
            <Stack.Screen name="TruckOrders" component={TruckOrdersScreen} />
            <Stack.Screen name="PartyLRRecords" component={PartyLRRecordsScreen} />
            <Stack.Screen name="TruckPayment" component={TruckPaymentScreen} />
            <Stack.Screen name="DailyReport" component={DailyReportScreen} />
            <Stack.Screen name="PaymentAlerts" component={PaymentAlertsScreen} />
            <Stack.Screen name="TruckComing" component={TruckComingScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
