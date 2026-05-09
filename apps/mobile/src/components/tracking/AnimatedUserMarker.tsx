import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Marker, AnimatedRegion } from 'react-native-maps';
import { COLORS } from '../../theme';

interface Props {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  heading?: number | null;
  isEmergency?: boolean;
}

const AnimatedUserMarker = ({ coordinate, heading, isEmergency }: Props) => {
  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Interpolate to new coordinate
    animatedCoordinate.timing({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [coordinate]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <Marker.Animated
      coordinate={animatedCoordinate as any}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={heading || 0}
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.pulse, 
            { 
              transform: [{ scale: pulseScale }], 
              opacity: pulseOpacity,
              backgroundColor: isEmergency ? COLORS.error : COLORS.primary 
            }
          ]} 
        />
        <View style={[styles.dot, isEmergency && styles.emergencyDot]}>
            <View style={styles.innerDot} />
        </View>
      </View>
    </Marker.Animated>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emergencyDot: {
    backgroundColor: COLORS.error,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  }
});

export default AnimatedUserMarker;
