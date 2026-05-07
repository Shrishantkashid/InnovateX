import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { triggerSOS, resolveSOS } from '../services/sosApi';
import { startWatching, stopWatching } from '../services/locationTracker';

type SOSScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SOS'>;
};

const SOSScreen = ({ navigation }: SOSScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sosDetails, setSosDetails] = useState<{ sosEventId: string; trackToken: string } | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [isEscalated, setIsEscalated] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const activateSOS = async () => {
      try {
        // 1. Get initial location
        await startWatching((newCoords) => {
          setCoords(newCoords);
        });

        // 2. Trigger SOS (using placeholder coordinates if location not yet ready)
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
    if (!sosDetails) return;
    
    Alert.alert(
      'Resolve Incident',
      'Are you sure you want to mark this emergency as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            await resolveSOS(sosDetails.sosEventId);
            cleanup();
            navigation.navigate('Home');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ff4444" />
        <Text style={styles.loadingText}>Activating emergency protocol...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emergencyTitle}>🚨 EMERGENCY ACTIVE</Text>
          <Text style={styles.subtitle}>Sending alerts to contacts & authorities</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Incident Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Event ID:</Text>
            <Text style={styles.value}>{sosDetails?.sosEventId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tracking Token:</Text>
            <Text style={styles.token}>{sosDetails?.trackToken}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Live Coords:</Text>
            <Text style={styles.value}>
              {coords ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Detecting...'}
            </Text>
          </View>
        </View>

        <View style={[styles.escalationCard, isEscalated && styles.escalatedBg]}>
          {isEscalated ? (
            <>
              <Text style={styles.escalationTitle}>⚠️ ESCALATION ACTIVATED</Text>
              <Text style={styles.escalationSub}>Authorities have been notified with your live location.</Text>
            </>
          ) : (
            <>
              <Text style={styles.countdownLabel}>Alert escalation in:</Text>
              <Text style={styles.countdownValue}>{countdown}s</Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Button 
            title="Share Live Location" 
            onPress={() => Alert.alert('Location Shared', 'A live tracking link has been sent to your emergency contacts.')} 
            color="#333"
          />
          <View style={{ height: 12 }} />
          <Button 
            title="Resolve SOS" 
            onPress={handleResolve} 
            color="#4CAF50"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ff4444' },
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontSize: 18, fontWeight: '600', color: '#ff4444' },
  header: { alignItems: 'center', marginVertical: 30 },
  emergencyTitle: { fontSize: 32, fontWeight: '900', color: '#ff4444', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center' },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#333' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#666', fontWeight: '500' },
  value: { fontWeight: '600', color: '#333' },
  token: { fontWeight: 'bold', color: '#007AFF', letterSpacing: 1 },
  escalationCard: {
    backgroundColor: '#fff3cd',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffeeba'
  },
  escalatedBg: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
  countdownLabel: { fontSize: 16, color: '#856404', fontWeight: '600' },
  countdownValue: { fontSize: 48, fontWeight: '900', color: '#856404' },
  escalationTitle: { fontSize: 22, fontWeight: '900', color: '#721c24', marginBottom: 8 },
  escalationSub: { fontSize: 14, color: '#721c24', textAlign: 'center', lineHeight: 20 },
  footer: { marginTop: 'auto', paddingBottom: 20 }
});

export default SOSScreen;
