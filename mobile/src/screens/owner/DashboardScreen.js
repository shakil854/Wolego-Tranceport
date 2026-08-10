import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { FilePlus, FileText, Users, Truck, DollarSign, AlertCircle, Calendar, Printer, FileSpreadsheet, FileCode, Bell, TruckIcon, Shield } from 'lucide-react-native';
import HeaderBar from '../../components/HeaderBar';
import { fetchLREntriesApi, fetchPartiesApi, fetchTrucksApi, fetchTruckPaymentsApi } from '../../api/endpoints';
import { formatCurrency, getFinancialYear } from '../../utils/dateUtils';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFY, setSelectedFY] = useState('ALL');

  const [lrs, setLrs] = useState([]);
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [truckPayments, setTruckPayments] = useState([]);

  const loadData = async () => {
    try {
      const [lrData, partyData, truckData, paymentData] = await Promise.all([
        fetchLREntriesApi(),
        fetchPartiesApi(),
        fetchTrucksApi(),
        fetchTruckPaymentsApi(),
      ]);
      setLrs(lrData || []);
      setParties(partyData || []);
      setTrucks(truckData || []);
      setTruckPayments(paymentData || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter LRs by selected FY
  const filteredLrs = lrs.filter((lr) => {
    if (selectedFY === 'ALL') return true;
    if (!lr.dateTime) return false;
    return getFinancialYear(lr.dateTime).label === selectedFY;
  });

  // Calculate KPIs
  let totalBilled = 0;
  let totalPaid = 0;
  filteredLrs.forEach((lr) => {
    const net = parseFloat(lr.netTotalAmount || lr.freightAmount) || 0;
    totalBilled += net;
    if (lr.partyPaymentStatus === 'PAID') {
      totalPaid += parseFloat(lr.partyPaidAmount || net) || 0;
    }
  });
  const totalRemaining = Math.max(0, totalBilled - totalPaid);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLrsCount = filteredLrs.filter((lr) => lr.dateTime && String(lr.dateTime).startsWith(todayStr)).length;

  return (
    <View style={styles.container}>
      <HeaderBar title="Owner Dashboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009a44" />}
      >
        {/* Top Financial Year Filter Bar */}
        <View style={styles.fyBar}>
          <Text style={styles.fyLabel}>Financial Year:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fyScroll}>
            {['ALL', '2026-27', '2025-26', '2024-25'].map((fy) => (
              <TouchableOpacity
                key={fy}
                style={[styles.fyBadge, selectedFY === fy && styles.fyBadgeActive]}
                onPress={() => setSelectedFY(fy)}
              >
                <Text style={[styles.fyText, selectedFY === fy && styles.fyTextActive]}>
                  {fy === 'ALL' ? 'All Years' : `FY ${fy}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color="#009a44" size="large" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                <Text style={styles.kpiTitle}>Total Freight Billed</Text>
                <Text style={styles.kpiValue}>₹ {formatCurrency(totalBilled)}</Text>
                <Text style={styles.kpiSub}>{filteredLrs.length} Total LR Entries</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                <Text style={styles.kpiTitle}>Received Payments</Text>
                <Text style={[styles.kpiValue, { color: '#34d399' }]}>₹ {formatCurrency(totalPaid)}</Text>
                <Text style={styles.kpiSub}>Party Collections</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <Text style={styles.kpiTitle}>Pending Balance</Text>
                <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>₹ {formatCurrency(totalRemaining)}</Text>
                <Text style={styles.kpiSub}>Party Outstanding</Text>
              </View>

              <View style={[styles.kpiCard, { borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
                <Text style={styles.kpiTitle}>Today's Dispatches</Text>
                <Text style={[styles.kpiValue, { color: '#c084fc' }]}>{todayLrsCount} LRs</Text>
                <Text style={styles.kpiSub}>Dispatched Today</Text>
              </View>
            </View>

            {/* Quick Action Navigation Grid */}
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.actionGrid}>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LREntry')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 154, 68, 0.15)' }]}>
                  <FilePlus size={24} color="#009a44" />
                </View>
                <Text style={styles.actionLabel}>New LR Entry</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LRList')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <FileText size={24} color="#3b82f6" />
                </View>
                <Text style={styles.actionLabel}>LR Records</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PartyMaster')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Users size={24} color="#a855f7" />
                </View>
                <Text style={styles.actionLabel}>Party Master ({parties.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TruckMaster')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Truck size={24} color="#ec4899" />
                </View>
                <Text style={styles.actionLabel}>Truck Master ({trucks.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PartyStatement')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <DollarSign size={24} color="#f59e0b" />
                </View>
                <Text style={styles.actionLabel}>Party Statement</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FreightReceipt')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                  <Printer size={24} color="#14b8a6" />
                </View>
                <Text style={styles.actionLabel}>Freight Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DailyReport')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Calendar size={24} color="#6366f1" />
                </View>
                <Text style={styles.actionLabel}>Daily Report</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CAExcelExport')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <FileSpreadsheet size={24} color="#22c55e" />
                </View>
                <Text style={styles.actionLabel}>CA Export</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BulkLRPrint')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                  <Printer size={24} color="#f97316" />
                </View>
                <Text style={styles.actionLabel}>Range Print</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LetterPad')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <FileCode size={24} color="#0ea5e9" />
                </View>
                <Text style={styles.actionLabel}>Letter Pad</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TruckPayments')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <DollarSign size={24} color="#eab308" />
                </View>
                <Text style={styles.actionLabel}>Truck Payments</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PaymentAlerts')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Bell size={24} color="#ef4444" />
                </View>
                <Text style={styles.actionLabel}>Payment Alerts</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TruckComing')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <TruckIcon size={24} color="#a855f7" />
                </View>
                <Text style={styles.actionLabel}>Arriving Trucks</Text>
              </TouchableOpacity>

            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  fyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginRight: 10,
  },
  fyScroll: {
    gap: 8,
  },
  fyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  fyBadgeActive: {
    backgroundColor: '#009a44',
    borderColor: '#009a44',
  },
  fyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  fyTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  kpiTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748b',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '31%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
    textAlign: 'center',
  },
});
