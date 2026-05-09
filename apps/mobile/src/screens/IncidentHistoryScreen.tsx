import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { 
  ShieldAlert, 
  Filter, 
  Search, 
  History,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/config';
import GlassCard from '../components/GlassCard';
import IncidentCard from '../components/IncidentCard';

const { width } = Dimensions.get('window');

const IncidentHistoryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/sos/history`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error('Failed to fetch history', error);
      // Mock data
      setIncidents([
        { id: '1a2b3c4d', created_at: new Date().toISOString(), resolved: false, risk_level: 'CRITICAL', trigger_type: 'manual', threat_score: 95, track_token: 'XYZ789' },
        { id: '5e6f7g8h', created_at: new Date(Date.now() - 86400000).toISOString(), resolved: true, risk_level: 'HIGH', trigger_type: 'motion', threat_score: 78 },
        { id: '9i0j1k2l', created_at: new Date(Date.now() - 172800000).toISOString(), resolved: true, risk_level: 'LOW', trigger_type: 'manual', threat_score: 45 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'active') return !inc.resolved;
    if (filter === 'resolved') return inc.resolved;
    return true;
  });

  const stats = {
    total: incidents.length,
    active: incidents.filter(i => !i.resolved).length,
    resolved: incidents.filter(i => i.resolved).length,
    avgScore: Math.round(incidents.reduce((acc, i) => acc + i.threat_score, 0) / (incidents.length || 1))
  };

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <GlassCard style={styles.analyticsPanel}>
        <View style={styles.analyticsHeader}>
            <TrendingUp size={16} color={COLORS.primary} />
            <Text style={styles.analyticsTitle}>OPERATIONAL AUDIT</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>AVG RISK</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <TouchableOpacity 
        style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>ALL</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
        onPress={() => setFilter('active')}
      >
        <Text style={[styles.filterBtnText, filter === 'active' && styles.filterBtnTextActive]}>ACTIVE</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterBtn, filter === 'resolved' && styles.filterBtnActive]}
        onPress={() => setFilter('resolved')}
      >
        <Text style={[styles.filterBtnText, filter === 'resolved' && styles.filterBtnTextActive]}>RESOLVED</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <History size={24} color={COLORS.primary} />
            <Text style={styles.title}>Incident Intelligence</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <Search size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {renderAnalytics()}
        {renderFilterBar()}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Synchronizing Audit Logs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredIncidents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <IncidentCard incident={item} />}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShieldAlert size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No incidents found for this filter.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h2,
    marginLeft: 12,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 20,
  },
  analyticsPanel: {
    padding: SPACING.md,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  analyticsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    marginLeft: 10,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  filterBtnTextActive: {
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    marginTop: 15,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: 20,
    color: COLORS.textMuted,
    textAlign: 'center',
  }
});

export default IncidentHistoryScreen;
