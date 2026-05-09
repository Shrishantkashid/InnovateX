import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import GlassCard from '../../components/GlassCard';
import { authService } from '../../services/authService';
import { Fingerprint, Landmark } from 'lucide-react-native';

const AadhaarVerificationScreen = ({ navigation, route }: any) => {
  const { signupData } = route.params;
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (aadhaarNumber.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyAadhaar(aadhaarNumber);
      if (response.success) {
        navigation.navigate('OtpVerification', { 
          signupData, 
          aadhaarNumber,
          referenceId: response.referenceId
        });
      } else {
        setError(response.message || 'Verification failed');
        Alert.alert('Verification Failed', response.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            SafeGuard requires Aadhaar verification to ensure a secure environment for all female users.
          </Text>
        </View>

        <GlassCard style={styles.infoCard}>
          <View style={styles.iconRow}>
            <Landmark color={COLORS.primary} size={24} />
            <Text style={styles.infoTitle}>Government Verified</Text>
          </View>
          <Text style={styles.infoText}>
            Your data is encrypted and used only for identity validation. We do not store your Aadhaar number.
          </Text>
        </GlassCard>

        <FormInput
          label="Aadhaar Number"
          placeholder="1234 5678 9012"
          keyboardType="numeric"
          maxLength={12}
          icon={<Fingerprint size={20} color={COLORS.textMuted} />}
          value={aadhaarNumber}
          onChangeText={(text) => {
            setAadhaarNumber(text);
            if (error) setError(null);
          }}
          error={error || undefined}
        />

        <View style={styles.footer}>
          <PrimaryButton 
            title="Send Verification OTP" 
            onPress={handleVerify}
            isLoading={isLoading}
          />
          <Text style={styles.secureText}>
            🛡️ Secure sandbox environment active
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  infoCard: {
    marginBottom: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginLeft: 10,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    lineHeight: 18,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  secureText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 16,
    color: COLORS.textMuted,
  },
});

export default AadhaarVerificationScreen;
