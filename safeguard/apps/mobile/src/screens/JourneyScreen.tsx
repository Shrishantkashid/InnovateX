import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { startWatching, stopWatching } from '../services/locationTracker';
import { Navigation, Map as MapIcon, ShieldCheck, XCircle } from 'lucide-react-native';

const JourneyScreen = ({ navigation }: any) => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTracking = async () => {
      try {
        await startWatching((newCoords) => {
          setCoords(newCoords);
        });
      } catch (err: any) {
        setError(err.message);
        Alert.alert('Permission Denied', 'Please enable location permissions to use Journey Guardian.');
      }
    };

    initTracking();

    return () => {
      stopWatching();
    };
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Navigation size={48} color={COLORS.primary} />
          <Text style={styles.title}>Journey Guardian</Text>
          <Text style={styles.subtitle}>Real-time monitoring and threat detection active.</Text>
        </View>

        <GlassCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulse} />
            </View>
            <Text style={styles.statusText}>ENCRYPTED TRACKING ACTIVE</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.locationCard}>
          <View style={styles.iconRow}>
            <MapIcon size={20} color={COLORS.secondary} />
            <Text style={styles.locationTitle}>Live Coordinates</Text>
          </View>
          {coords ? (
            <View style={styles.coordsWrapper}>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>{coords.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordBox}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>{coords.longitude.toFixed(6)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>{error || 'Synchronizing with GPS satellites...'}</Text>
          )}
        </GlassCard>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <ShieldCheck size={20} color={COLORS.accent} />
            <Text style={styles.featureText}>Threat Fusion Engine Monitoring</Text>
          </View>
          <View style={styles.featureItem}>
            <ShieldCheck size={20} color={COLORS.accent} />
            <Text style={styles.featureText}>Emergency Contact Notified</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton 
            title="Trigger Emergency SOS" 
            onPress={() => navigation.navigate('SOS')} 
            style={styles.sosButton}
          />
          <View style={{ height: 15 }} />
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>End Journey</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginTop: 10,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: SPACING.md,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseContainer: {
    width: 12,
    height: 12,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  locationCard: {
    padding: SPACING.lg,
    marginBottom: 30,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationTitle: {
    ...TYPOGRAPHY.h3,
    marginLeft: 10,
  },
  coordsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordBox: {
    width: '48%',
  },
  coordLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  coordValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 12,
  },
  featureText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    marginLeft: 10,
    color: COLORS.text,
  },
  footer: {
    marginBottom: 40,
  },
  sosButton: {
    backgroundColor: COLORS.error,
  },
  cancelButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textMuted,
  },
});

export default JourneyScreen;
