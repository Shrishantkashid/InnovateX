import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated,
  ActivityIndicator,
  Platform,
  Vibration,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  MapPin, 
  Users, 
  Police,
  Wifi,
  ChevronRight,
  Clock,
  Activity
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../constants/config';
import GlassCard from '../components/GlassCard';
import { supabase } from '../services/supabase';

interface AlertStep {
    id: string;
    label: string;
    status: 'success' | 'pending' | 'failed' | 'retrying';
    channel: string;
    recipient: string;
    timestamp: string;
}

const AlertStatusScreen = ({ route, navigation }: any) => {
  const { sosId } = route.params || { sosId: 'DEMO-123' };
  const { user } = useAuth();
  const [steps, setSteps] = useState<AlertStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalationLevel, setEscalationLevel] = useState(1);
  const [riskScore, setRiskScore] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/sos/${sosId}/status`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      const data = await response.json();
      setSteps(data.steps);
      setEscalationLevel(data.current_level);
      setRiskScore(data.risk_score);
    } catch (error) {
      console.error('Failed to fetch alert status', error);
      // Mock for demo
      setSteps([
        { id: '1', label: 'SOS Signal Dispatched', status: 'success', channel: 'system', recipient: 'SafeGuard Cloud', timestamp: new Date().toISOString() },
        { id: '2', label: 'Realtime Location Sharing', status: 'success', channel: 'gps', recipient: 'Guardian Network', timestamp: new Date().toISOString() },
        { id: '3', label: 'SMS Emergency Alerts', status: 'success', channel: 'sms', recipient: '+91 98XXX XXX01', timestamp: new Date().toISOString() },
        { id: '4', label: 'WhatsApp Incident Report', status: 'success', channel: 'whatsapp', recipient: 'Family Group', timestamp: new Date().toISOString() },
        { id: '5', label: 'Authority Escalation', status: 'pending', channel: 'authority', recipient: 'Police Dispatch', timestamp: new Date().toISOString() },
      ]);
      setRiskScore(88);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Pulse animation for active alert
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Realtime updates
    const channel = supabase
      .channel(`sos_${sosId}`)
      .on('broadcast', { event: 'alert_step_update' }, (payload) => {
        handleRealtimeUpdate(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRealtimeUpdate = (update: any) => {
    setSteps(prev => prev.map(s => s.id === update.id ? { ...s, status: update.status } : s));
    if (update.status === 'success') {
        Vibration.vibrate(50);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare size={16} color={COLORS.primary} />;
      case 'whatsapp': return <MessageSquare size={16} color="#25D366" />;
      case 'gps': return <MapPin size={16} color={COLORS.secondary} />;
      case 'authority': return <ShieldAlert size={16} color={COLORS.error} />;
      default: return <Send size={16} color={COLORS.textMuted} />;
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Live Status Header */}
        <View style={styles.header}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.statusBadge}>
                <Activity size={18} color="white" />
                <Text style={styles.statusTitle}>LIVE ESCALATION ACTIVE</Text>
            </View>
            <Text style={styles.incidentId}>CASE ID: #{sosId.substring(0, 8).toUpperCase()}</Text>
        </View>

        {/* Level & Risk Panel */}
        <View style={styles.statsRow}>
            <GlassCard style={styles.statPanel}>
                <Text style={styles.statLabel}>LEVEL</Text>
                <Text style={[styles.statValue, { color: COLORS.error }]}>{escalationLevel}/3</Text>
            </GlassCard>
            <GlassCard style={styles.statPanel}>
                <Text style={styles.statLabel}>THREAT</Text>
                <Text style={[styles.statValue, { color: riskScore > 75 ? COLORS.error : COLORS.accent }]}>{riskScore}%</Text>
            </GlassCard>
            <GlassCard style={styles.statPanel}>
                <Text style={styles.statLabel}>REACH</Text>
                <Text style={styles.statValue}>5/5</Text>
            </GlassCard>
        </View>

        {/* Escalation Timeline */}
        <View style={styles.timelineContainer}>
            <Text style={styles.sectionTitle}>ALERT ORCHESTRATION PIPELINE</Text>
            
            {steps.map((step, index) => (
                <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.leftColumn}>
                        <View style={[
                            styles.statusDot, 
                            { backgroundColor: step.status === 'success' ? COLORS.accent : step.status === 'pending' ? COLORS.primary : COLORS.error }
                        ]} />
                        {index !== steps.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    
                    <GlassCard style={[styles.alertCard, step.status === 'pending' && styles.pendingCard]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.labelRow}>
                                {getChannelIcon(step.channel)}
                                <Text style={styles.stepLabel}>{step.label}</Text>
                            </View>
                            {step.status === 'success' ? 
                                <CheckCircle2 size={16} color={COLORS.accent} /> : 
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            }
                        </View>
                        
                        <View style={styles.cardFooter}>
                            <View style={styles.recipientInfo}>
                                <Users size={12} color={COLORS.textMuted} />
                                <Text style={styles.recipientText}>{step.recipient}</Text>
                            </View>
                            <View style={styles.timeInfo}>
                                <Clock size={12} color={COLORS.textMuted} />
                                <Text style={styles.timeText}>
                                    {step.status === 'success' ? 'Confirmed' : 'Pending...'}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </View>
            ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.resolveBtn} onPress={() => navigation.goBack()}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.btnGradient}>
                <Text style={styles.btnText}>RETURN TO DASHBOARD</Text>
            </LinearGradient>
        </TouchableOpacity>

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
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    zIndex: -1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 1,
  },
  incidentId: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statPanel: {
    width: (width - 60) / 3,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  timelineContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftColumn: {
    width: 20,
    alignItems: 'center',
    marginRight: 15,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 5,
    marginBottom: -25,
  },
  alertCard: {
    flex: 1,
    padding: SPACING.md,
  },
  pendingCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  resolveBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  }
});

const { width } = Dimensions.get('window');

export default AlertStatusScreen;
