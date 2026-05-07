import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions, 
  Animated, 
  Vibration,
  Platform,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  Navigation, 
  LogOut,
  Clock,
  Radio
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { sosService } from '../services/sosService';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const SOSScreen = ({ navigation }: any) => {
  // SOS State
  const [status, setStatus] = useState<'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'RESOLVED'>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [sosData, setSosData] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sirenAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Location Fetch
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  // Pulse Animation Loop
  useEffect(() => {
    if (status === 'IDLE' || status === 'ACTIVE') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [status]);

  // Siren Animation Loop
  useEffect(() => {
    if (status === 'ACTIVE') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(sirenAnim, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(sirenAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [status]);

  const triggerEmergency = async () => {
    setStatus('ACTIVE');
    Vibration.vibrate([0, 500, 200, 500]); // Intense pattern
    
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const result = await sosService.createSOS({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        risk_level: 'CRITICAL',
        trigger_type: 'manual'
      });

      if (result.success) {
        setSosData(result);
        // Navigate to Alert Status to see the escalation pipeline
        navigation.navigate('AlertStatus', { sosId: result.sos_event_id });
      }
    } catch (error) {
      Alert.alert('Network Error', 'Failed to reach emergency servers. SOS still active locally.');
    }
  };

  const handleSOSPress = () => {
    if (status === 'IDLE') {
      setStatus('COUNTDOWN');
      setCountdown(3);
      
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            triggerEmergency();
            return 0;
          }
          Vibration.vibrate(50);
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('IDLE');
    setCountdown(3);
  };

  const handleResolve = async () => {
    if (!sosData?.sos_event_id) {
        setStatus('RESOLVED');
        return;
    }

    const resolved = await sosService.resolveSOS(sosData.sos_event_id);
    if (resolved) {
      setStatus('RESOLVED');
      setTimeout(() => navigation.goBack(), 2000);
    }
  };

  const renderIdle = () => (
    <View style={styles.content}>
      <View style={styles.heroContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
        <TouchableOpacity 
          style={styles.sosButton} 
          activeOpacity={0.8}
          onPress={handleSOSPress}
        >
          <LinearGradient
            colors={['#EF4444', '#7F1D1D']}
            style={styles.sosButtonGradient}
          >
            <ShieldAlert size={64} color="white" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instructionText}>TAP FOR EMERGENCY HELP</Text>
      <Text style={styles.subInstruction}>Instant notification to contacts & police</Text>

      <GlassCard style={styles.locationInfo}>
        <MapPin size={20} color={COLORS.primary} />
        <Text style={styles.locationText}>
          {location ? `Ready: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Detecting live location...'}
        </Text>
      </GlassCard>
    </View>
  );

  const renderCountdown = () => (
    <View style={styles.content}>
      <Text style={styles.countdownTitle}>ACTIVATING SOS</Text>
      <View style={styles.countdownCircle}>
        <Text style={styles.countdownNumber}>{countdown}</Text>
      </View>
      <Text style={styles.countdownSub}>Release to cancel immediately</Text>
      
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>CANCEL</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActive = () => (
    <View style={styles.content}>
      <Animated.View style={[styles.sirenOverlay, { opacity: sirenAnim }]} />
      
      <View style={styles.activeHeader}>
        <Radio size={32} color={COLORS.error} />
        <Text style={styles.activeTitle}>EMERGENCY ACTIVE</Text>
        <Text style={styles.incidentId}>ID: {sosData?.sos_event_id?.substring(0, 8) || 'INITIALIZING...'}</Text>
      </View>

      <GlassCard style={styles.incidentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>LIVE TRACKING</Text>
          </View>
          <Text style={styles.riskLevel}>LEVEL: CRITICAL</Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <CheckCircle2 size={20} color={COLORS.accent} />
            <Text style={styles.timelineText}>Emergency Contacts Notified</Text>
          </View>
          <View style={styles.timelineItem}>
            <Activity size={20} color={COLORS.primary} />
            <Text style={styles.timelineText}>Local Authorities Alerted</Text>
          </View>
          <View style={styles.timelineItem}>
            <Navigation size={20} color={COLORS.secondary} />
            <Text style={styles.timelineText}>Location Sharing Enabled</Text>
          </View>
        </View>

        <View style={styles.locationDetail}>
            <Clock size={16} color={COLORS.textMuted} />
            <Text style={styles.timeText}>Started: {new Date().toLocaleTimeString()}</Text>
        </View>
      </GlassCard>

      <View style={styles.footer}>
        <PrimaryButton 
          title="RESOLVE EMERGENCY" 
          onPress={handleResolve}
          style={styles.resolveButton}
          textStyle={styles.resolveButtonText}
        />
        <Text style={styles.footerHelp}>Only resolve if you are safely secured.</Text>
      </View>
    </View>
  );

  const renderResolved = () => (
    <View style={styles.content}>
      <CheckCircle2 size={120} color={COLORS.accent} />
      <Text style={styles.resolvedTitle}>INCIDENT RESOLVED</Text>
      <Text style={styles.resolvedSub}>Glad you're safe. Returning home...</Text>
    </View>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {status === 'IDLE' && renderIdle()}
        {status === 'COUNTDOWN' && renderCountdown()}
        {status === 'ACTIVE' && renderActive()}
        {status === 'RESOLVED' && renderResolved()}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  heroContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    elevation: 20,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  sosButtonGradient: {
    flex: 1,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },
  instructionText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    letterSpacing: 2,
  },
  subInstruction: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: 60,
    width: '90%',
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginLeft: 10,
  },
  // Countdown
  countdownTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.error,
    marginBottom: 40,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  countdownNumber: {
    fontSize: 100,
    fontWeight: '900',
    color: COLORS.error,
  },
  countdownSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 40,
  },
  cancelButton: {
    marginTop: 80,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  // Active State
  sirenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EF4444',
  },
  activeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  activeTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.error,
    marginTop: 10,
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  incidentId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 5,
    letterSpacing: 2,
  },
  incidentCard: {
    width: '100%',
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  riskLevel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.error,
  },
  timeline: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineText: {
    ...TYPOGRAPHY.body,
    marginLeft: 15,
    fontSize: 14,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  footer: {
    marginTop: 60,
    width: '100%',
    alignItems: 'center',
  },
  resolveButton: {
    backgroundColor: 'white',
    width: '100%',
    height: 64,
    borderRadius: 32,
  },
  resolveButtonText: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerHelp: {
    ...TYPOGRAPHY.caption,
    marginTop: 15,
    color: COLORS.textMuted,
  },
  // Resolved
  resolvedTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.accent,
    marginTop: 30,
  },
  resolvedSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 10,
  }
});

export default SOSScreen;
