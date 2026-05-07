import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, TYPOGRAPHY } from '../../theme';
import { Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('RoleSelection');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Shield size={80} color={COLORS.primary} strokeWidth={1.5} />
          <View style={styles.glow} />
        </View>
        <Text style={styles.title}>SafeGuard</Text>
        <Text style={styles.subtitle}>Protect without being asked</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure • Reliable • Immediate</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 40,
    opacity: 0.2,
    transform: [{ scale: 1.5 }],
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 42,
    letterSpacing: 2,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
