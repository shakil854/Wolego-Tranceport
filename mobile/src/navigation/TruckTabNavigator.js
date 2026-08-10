import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DollarSign, Truck } from 'lucide-react-native';

import TruckAccountingScreen from '../screens/truck/TruckAccountingScreen';
import TruckOrdersScreen from '../screens/truck/TruckOrdersScreen';

const Tab = createBottomTabNavigator();

export default function TruckTabNavigator() {
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
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="TruckAccounting"
        component={TruckAccountingScreen}
        options={{
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TruckOrders"
        component={TruckOrdersScreen}
        options={{
          tabBarLabel: 'Trip Orders',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
