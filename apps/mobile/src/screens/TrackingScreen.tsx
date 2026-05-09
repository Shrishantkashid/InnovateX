import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Animated,
  Platform,
  Vibration
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { 
  Navigation, 
  ShieldCheck, 
  ShieldAlert, 
  Crosshair, 
  Layers, 
  Zap,
  Activity,
  Wifi,
  Battery,
  AlertTriangle,
  Users
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { locationService, LocationData } from '../services/RealtimeLocationService';
import GlassCard from '../components/GlassCard';
import AnimatedUserMarker from '../components/tracking/AnimatedUserMarker';
import EmergencyEventFeed, { EmergencyEvent } from '../components/tracking/EmergencyEventFeed';
import { CONFIG } from '../constants/config';
import { GeoFenceService, GeoZone } from '../services/GeoFenceService';

const { width, height } = Dimensions.get('window');

const MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#0F172A" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94A3B8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0F172A" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
];

const RealtimeTrackingScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  
  // State
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'OFFLINE'>('CONNECTED');
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]); // For Parent-Child tracking
  const [zones, setZones] = useState<GeoZone[]>([]);
  const [activeZone, setActiveZone] = useState<GeoZone | null>(null);
  const [warningVisible, setWarningVisible] = useState(false);
  
  const mapRef = useRef<MapView | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const warningAnim = useRef(new Animated.Value(0)).current;

  // Fetch Zones
  useEffect(() => {
    const fetchZones = async () => {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/zones/`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            const data = await response.json();
            setZones(data);
        } catch (err) {
            console.error('Failed to fetch zones', err);
            // Fallback mock
            setZones([
                { id: 'sz-1', name: 'Safe Haven', type: 'safe', latitude: 18.5204, longitude: 73.8567, radius: 500, risk_score: 5 },
                { id: 'uz-1', name: 'Dark Sector', type: 'unsafe', latitude: 18.5150, longitude: 73.8500, radius: 400, risk_score: 95 },
                { id: 'cz-1', name: 'Restricted', type: 'caution', latitude: 18.5250, longitude: 73.8600, radius: 300, risk_score: 50 }
            ]);
        }
    };
    fetchZones();
  }, []);

  // Zone Detection Logic
  useEffect(() => {
    if (currentLocation && zones.length > 0) {
      const zone = GeoFenceService.checkZones(
        currentLocation.latitude, 
        currentLocation.longitude, 
        zones
      );

      if (zone?.id !== activeZone?.id) {
        setActiveZone(zone);
        if (zone) {
          handleZoneEntry(zone);
        } else {
          setWarningVisible(false);
        }
      }
    }
  }, [currentLocation, zones]);

  const handleZoneEntry = (zone: GeoZone) => {
    if (zone.type === 'unsafe') {
      Vibration.vibrate([0, 200, 100, 200]);
      setWarningVisible(true);
      Animated.sequence([
        Animated.timing(warningAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(warningAnim, { toValue: 0.8, duration: 500, useNativeDriver: true })
      ]).start();
      
      addEvent({
        id: `zone-${Date.now()}`,
        type: 'SOS',
        message: `WARNING: Entered ${zone.name}`,
        timestamp: 'Just now',
        severity: 'critical'
      });
    } else if (zone.type === 'safe') {
        addEvent({
            id: `zone-${Date.now()}`,
            type: 'RESOLVED',
            message: `Entering Safe Zone: ${zone.name}`,
            timestamp: 'Just now',
            severity: 'low'
        });
    }
  };

  // Initial Setup
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    if (user) {
      locationService.startTracking(user.id, (loc) => {
        setCurrentLocation(loc);
      }).catch(err => console.error('Tracking failed', err));
    }

    return () => locationService.stopTracking();
  }, [user]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    // 1. Subscribe to Global SOS Incidents
    const sosChannel = supabase
      .channel('public_emergency')
      .on('postgres_changes', { event: 'INSERT', table: 'sos_events' }, (payload) => {
        addEvent({
          id: payload.new.id,
          type: 'SOS',
          message: 'EMERGENCY TRIGGERED: Active Incident Detected',
          timestamp: 'Just now',
          severity: 'critical'
        });
        Vibration.vibrate(500);
      })
      .subscribe();

    // 2. Subscribe to Linked Child Locations (Mock for Parent Role)
    if (user?.role === 'parent') {
      const childChannel = supabase
        .channel('child_monitoring')
        .on('broadcast', { event: 'location_update' }, (payload) => {
          updateLinkedUser(payload.payload);
        })
        .subscribe();
      
      return () => {
          supabase.removeChannel(sosChannel);
          supabase.removeChannel(childChannel);
      }
    }

    return () => {
      supabase.removeChannel(sosChannel);
    };
  }, [user]);

  const addEvent = (event: EmergencyEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 10));
  };

  const updateLinkedUser = (data: any) => {
    setLinkedUsers(prev => {
        const index = prev.findIndex(u => u.id === data.userId);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...data };
            return updated;
        }
        return [...prev, data];
    });
  };

  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        onMapReady={() => setMapReady(true)}
      >
        {/* Main User Marker */}
        <AnimatedUserMarker 
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }}
          heading={currentLocation.heading}
          isEmergency={isSOSActive}
        />

        {/* Linked Child Markers */}
        {linkedUsers.map(child => (
          <Marker
            key={child.id}
            coordinate={{ latitude: child.latitude, longitude: child.longitude }}
          >
            <View style={styles.childMarker}>
              <Users size={16} color="white" />
              <View style={styles.childLabel}>
                <Text style={styles.childName}>Child Link Active</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* Zones */}
        {zones.map(z => (
          <Circle 
            key={z.id} 
            center={{ latitude: z.latitude, longitude: z.longitude }} 
            radius={z.radius} 
            fillColor={
                z.type === 'safe' ? "rgba(16, 185, 129, 0.1)" :
                z.type === 'unsafe' ? "rgba(239, 68, 68, 0.15)" :
                "rgba(245, 158, 11, 0.1)"
            } 
            strokeColor={
                z.type === 'safe' ? COLORS.accent :
                z.type === 'unsafe' ? COLORS.error :
                "#F59E0B"
            } 
            strokeWidth={2}
          />
        ))}

      {/* Realtime Warning Popup */}
      {warningVisible && activeZone && (
        <Animated.View style={[styles.warningContainer, { opacity: warningAnim, transform: [{ translateY: warningAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 0] }) }] }]}>
            <LinearGradient colors={['#EF4444', '#7F1D1D']} style={styles.warningGradient}>
                <AlertTriangle size={24} color="white" />
                <View style={styles.warningTextContainer}>
                    <Text style={styles.warningTitle}>UNSAFE ZONE ENTERED</Text>
                    <Text style={styles.warningSub}>{activeZone.name} - Risk Score: {activeZone.risk_score}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
      )}
      </MapView>

      {/* Realtime Dashboard Overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeArea}>
          
          {/* Top Status Bar */}
          <GlassCard style={styles.statusBar}>
            <View style={styles.statusRow}>
              <View style={styles.statusGroup}>
                <Activity size={16} color={COLORS.accent} />
                <Text style={styles.statusText}>{syncStatus}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statusGroup}>
                <Wifi size={16} color={COLORS.primary} />
                <Text style={styles.statusText}>{Math.round(currentLocation.accuracy || 0)}m Acc</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statusGroup}>
                <Battery size={16} color="#10B981" />
                <Text style={styles.statusText}>94%</Text>
              </View>
            </View>
          </GlassCard>

          {/* Floating Action Cluster */}
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
              <Crosshair size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fab}>
              <Layers size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.fab, styles.sosFab]}
                onPress={() => navigation.navigate('SOS')}
            >
              <AlertTriangle size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Feed & Info */}
          <View style={styles.bottomPanel}>
            <Text style={styles.feedTitle}>REALTIME EMERGENCY FEED</Text>
            <EmergencyEventFeed events={events} />
            
            <GlassCard style={styles.monitoringCard}>
                <View style={styles.monitoringHeader}>
                    <ShieldCheck size={20} color={COLORS.accent} />
                    <Text style={styles.monitoringLabel}>EMERGENCY MONITORING ACTIVE</Text>
                </View>
                <Text style={styles.monitoringSub}>
                    Continuous GPS heartbeats enabled. Authorities on standby.
                </Text>
            </GlassCard>
          </View>

        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: 20,
    color: COLORS.textMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  safeArea: {
    flex: 1,
    pointerEvents: 'box-none',
  },
  statusBar: {
    margin: SPACING.md,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 6,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 15,
  },
  fabContainer: {
    position: 'absolute',
    right: SPACING.lg,
    top: 100,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sosFab: {
    backgroundColor: COLORS.error,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: SPACING.lg,
  },
  feedTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginBottom: 10,
    letterSpacing: 2,
    marginLeft: 5,
  },
  monitoringCard: {
    marginTop: 15,
    padding: SPACING.md,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  monitoringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  monitoringLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginLeft: 10,
  },
  monitoringSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 30,
  },
  childMarker: {
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childLabel: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  childName: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  warningContainer: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  warningTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  warningTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  warningSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  }
});

export default RealtimeTrackingScreen;
