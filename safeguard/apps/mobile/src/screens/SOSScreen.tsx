import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { triggerSOS, resolveSOS } from '../services/sosApi';
import { startWatching, stopWatching } from '../services/locationTracker';
import { ShieldAlert, MapPin, XCircle, Share2 } from 'lucide-react-native';

const SOSScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sosDetails, setSosDetails] = useState<{ sosEventId: string; trackToken: string } | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [isEscalated, setIsEscalated] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const activateSOS = async () => {
      try {
        await startWatching((newCoords) => {
          setCoords(newCoords);
        });

        const response = await triggerSOS({
          userId: 'user_123',
          latitude: coords?.latitude || 0,
          longitude: coords?.longitude || 0,
          triggerType: 'manual',
          threatScore: 90,
        });

        if (response.success) {
          setSosDetails({
            sosEventId: response.sosEventId,
            trackToken: response.trackToken,
          });
          setIsLoading(false);
          startCountdown();
        }
      } catch (error) {
        Alert.alert('Activation Failed', 'Could not activate emergency protocol.');
        navigation.goBack();
      }
    };

    activateSOS();

    return () => {
      cleanup();
    };
  }, []);

  const startCountdown = () => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsEscalated(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopWatching();
  };

  const handleResolve = async () => {
    Alert.alert(
      'Resolve Incident',
      'Are you sure you want to mark this emergency as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            if (sosDetails) await resolveSOS(sosDetails.sosEventId);
            cleanup();
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.error} />
        <Text style={styles.loadingText}>Activating emergency protocol...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#7f1d1d', '#0F172A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ShieldAlert size={64} color={COLORS.error} />
          <Text style={styles.emergencyTitle}>EMERGENCY ACTIVE</Text>
          <Text style={styles.subtitle}>Alerts sent to contacts & authorities</Text>
        </View>

        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MapPin size={20} color={COLORS.textMuted} />
            <Text style={styles.coordsText}>
              {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'Fetching location...'}
            </Text>
          </View>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenLabel}>TRACKING TOKEN:</Text>
            <Text style={styles.tokenValue}>{sosDetails?.trackToken}</Text>
          </View>
        </GlassCard>

        <View style={[styles.statusCard, isEscalated && styles.escalatedCard]}>
          {isEscalated ? (
            <View style={styles.escalatedContent}>
              <Text style={styles.statusTitle}>ESCALATED</Text>
              <Text style={styles.statusSub}>Authorities are viewing your live feed.</Text>
            </View>
          ) : (
            <View style={styles.countdownContent}>
              <Text style={styles.countdownLabel}>ESCALATION IN</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownSecs}>SECONDS</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={20} color={COLORS.text} />
            <Text style={styles.shareButtonText}>Share Live Link</Text>
          </TouchableOpacity>
          
          <PrimaryButton 
            title="Resolve Emergency" 
            onPress={handleResolve}
            style={styles.resolveButton}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: 20,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  emergencyTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.error,
    marginTop: 15,
    letterSpacing: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  detailsCard: {
    padding: SPACING.md,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordsText: {
    ...TYPOGRAPHY.body,
    marginLeft: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tokenRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  tokenValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  statusCard: {
    height: 200,
    borderRadius: 100,
    width: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  escalatedCard: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  countdownContent: {
    alignItems: 'center',
  },
  countdownLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  countdownValue: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.error,
  },
  countdownSecs: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  escalatedContent: {
    alignItems: 'center',
  },
  statusTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error,
  },
  statusSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
    borderRadius: 16,
    marginBottom: 15,
  },
  shareButtonText: {
    ...TYPOGRAPHY.h3,
    marginLeft: 10,
  },
  resolveButton: {
    backgroundColor: COLORS.accent,
  }
});

export default SOSScreen;
