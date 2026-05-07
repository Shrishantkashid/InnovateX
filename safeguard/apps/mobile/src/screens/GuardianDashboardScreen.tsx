import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { 
  ShieldCheck, 
  Users, 
  History, 
  Bell, 
  ShieldAlert,
  Search,
  Plus
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import GlassCard from '../components/GlassCard';
import LinkedChildCard from '../components/LinkedChildCard';
import EmergencyEventFeed, { EmergencyEvent } from '../components/tracking/EmergencyEventFeed';
import { CONFIG } from '../constants/config';

const { width } = Dimensions.get('window');

const GuardianDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/guardian/children`, {
        headers: {
            'Authorization': `Bearer ${user?.token}`, // This depends on how token is stored
            'Bypass-Tunnel-Reminder': 'true'
        }
      });
      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error('Failed to fetch guardian data', error);
      // Mock data if API fails
      setChildren([
        { id: '1', name: 'Ishani Kashid', unique_id: 'SG-8B2A', status: 'secure', battery_level: 82, is_online: true },
        { id: '2', name: 'Arjun Kashid', unique_id: 'SG-4F91', status: 'warning', battery_level: 18, is_online: true },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to child status updates
    const channel = supabase
      .channel('guardian_updates')
      .on('postgres_changes', { event: '*', table: 'sos_events' }, (payload) => {
        handleRealtimeEvent(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRealtimeEvent = (payload: any) => {
    const newEvent: EmergencyEvent = {
        id: payload.new.id,
        type: 'SOS',
        message: 'Child SOS Alert Triggered!',
        timestamp: 'Just now',
        severity: 'critical'
    };
    setEvents(prev => [newEvent, ...prev]);
    // Also update specific child status in state
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Guardian Portal</Text>
            <Text style={styles.title}>Safety Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={24} color={COLORS.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Global Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>{children.length}</Text>
            <Text style={styles.statLabel}>Linked Kids</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>Secure</Text>
            <Text style={styles.statLabel}>Network Health</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>0</Text>
            <Text style={styles.statLabel}>Active SOS</Text>
          </GlassCard>
        </View>

        {/* Active Monitoring Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REAL-TIME MONITORING</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tracking')}>
                <Text style={styles.seeAll}>LIVE MAP</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            children.map(child => (
              <LinkedChildCard 
                key={child.id} 
                child={child} 
                onPress={() => navigation.navigate('Tracking', { childId: child.id })}
              />
            ))
          )}
        </View>

        {/* Realtime Alert Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCIDENT CENTER</Text>
          <EmergencyEventFeed events={events.length > 0 ? events : [
            { id: 'm1', type: 'RESOLVED', message: 'Arjun reached Safe Shelter', timestamp: '10m ago', severity: 'low' },
            { id: 'm2', type: 'ZONE', message: 'Ishani entered School Zone', timestamp: '25m ago', severity: 'medium' }
          ]} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GUARDIAN TOOLS</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolBtn}>
              <GlassCard style={styles.toolCard}>
                <Plus size={20} color={COLORS.primary} />
                <Text style={styles.toolText}>Link Child</Text>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn}>
              <GlassCard style={styles.toolCard}>
                <History size={20} color={COLORS.secondary} />
                <Text style={styles.toolText}>History</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 3,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  seeAll: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolBtn: {
    width: '48%',
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    justifyContent: 'center',
  },
  toolText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  }
});

export default GuardianDashboardScreen;
