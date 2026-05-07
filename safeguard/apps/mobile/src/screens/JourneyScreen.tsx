import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { startWatching, stopWatching } from '../services/locationTracker';

type JourneyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Journey'>;
};

const JourneyScreen = ({ navigation }: JourneyScreenProps) => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Journey Guardian</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Live Coordinates:</Text>
        {coords ? (
          <>
            <Text style={styles.coord}>Lat: {coords.latitude.toFixed(6)}</Text>
            <Text style={styles.coord}>Lng: {coords.longitude.toFixed(6)}</Text>
          </>
        ) : (
          <Text style={styles.status}>{error || 'Initializing GPS...'}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Start SOS (Emergency)" 
          onPress={() => navigation.navigate('SOS')} 
          color="#ff4444"
        />
        <View style={{ height: 10 }} />
        <Button 
          title="Cancel Journey" 
          onPress={() => navigation.goBack()} 
          color="#666"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#f8f9fa' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    textAlign: 'center',
    color: '#333'
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
    alignItems: 'center'
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  coord: {
    fontSize: 22,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'System'
  },
  status: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic'
  },
  buttonContainer: {
    width: '100%'
  }
});

export default JourneyScreen;
