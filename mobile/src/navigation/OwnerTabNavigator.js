import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, FilePlus, FileText, Users, Truck } from 'lucide-react-native';

import DashboardScreen from '../screens/owner/DashboardScreen';
import LREntryScreen from '../screens/owner/LREntryScreen';
import LRListScreen from '../screens/owner/LRListScreen';
import PartyMasterScreen from '../screens/owner/PartyMasterScreen';
import TruckMasterScreen from '../screens/owner/TruckMasterScreen';

const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator() {
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
        tabBarActiveTintColor: '#009a44',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LREntry"
        component={LREntryScreen}
        options={{
          tabBarLabel: 'New LR',
          tabBarIcon: ({ color, size }) => <FilePlus color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LRList"
        component={LRListScreen}
        options={{
          tabBarLabel: 'LR Records',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PartyMaster"
        component={PartyMasterScreen}
        options={{
          tabBarLabel: 'Parties',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TruckMaster"
        component={TruckMasterScreen}
        options={{
          tabBarLabel: 'Trucks',
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
