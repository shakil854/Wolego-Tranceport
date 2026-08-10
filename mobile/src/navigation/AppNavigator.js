import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import OwnerTabNavigator from './OwnerTabNavigator';
import PartyTabNavigator from './PartyTabNavigator';
import TruckTabNavigator from './TruckTabNavigator';

import FreightReceiptScreen from '../screens/owner/FreightReceiptScreen';
import PartyStatementScreen from '../screens/owner/PartyStatementScreen';
import DailyReportScreen from '../screens/owner/DailyReportScreen';
import CAExcelExportScreen from '../screens/owner/CAExcelExportScreen';
import BulkLRPrintScreen from '../screens/owner/BulkLRPrintScreen';
import LetterPadScreen from '../screens/owner/LetterPadScreen';
import TruckPaymentsScreen from '../screens/owner/TruckPaymentsScreen';
import PaymentAlertsScreen from '../screens/owner/PaymentAlertsScreen';
import TruckComingScreen from '../screens/owner/TruckComingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, isOwner, isParty, isTruck } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#009a44" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : isOwner ? (
        <>
          <Stack.Screen name="OwnerMain" component={OwnerTabNavigator} />
          <Stack.Screen name="FreightReceipt" component={FreightReceiptScreen} />
          <Stack.Screen name="PartyStatement" component={PartyStatementScreen} />
          <Stack.Screen name="DailyReport" component={DailyReportScreen} />
          <Stack.Screen name="CAExcelExport" component={CAExcelExportScreen} />
          <Stack.Screen name="BulkLRPrint" component={BulkLRPrintScreen} />
          <Stack.Screen name="LetterPad" component={LetterPadScreen} />
          <Stack.Screen name="TruckPayments" component={TruckPaymentsScreen} />
          <Stack.Screen name="PaymentAlerts" component={PaymentAlertsScreen} />
          <Stack.Screen name="TruckComing" component={TruckComingScreen} />
        </>
      ) : isParty ? (
        <Stack.Screen name="PartyMain" component={PartyTabNavigator} />
      ) : isTruck ? (
        <Stack.Screen name="TruckMain" component={TruckTabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
