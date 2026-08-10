import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DollarSign, FileText, ShoppingBag } from 'lucide-react-native';

import PartyAccountingScreen from '../screens/party/PartyAccountingScreen';
import PartyLRRecordsScreen from '../screens/party/PartyLRRecordsScreen';
import PartyOrdersScreen from '../screens/party/PartyOrdersScreen';

const Tab = createBottomTabNavigator();

export default function PartyTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="PartyAccounting"
        component={PartyAccountingScreen}
        options={{
          tabBarLabel: 'Statement',
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PartyLRRecords"
        component={PartyLRRecordsScreen}
        options={{
          tabBarLabel: 'LR Records',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PartyOrders"
        component={PartyOrdersScreen}
        options={{
          tabBarLabel: 'My Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
