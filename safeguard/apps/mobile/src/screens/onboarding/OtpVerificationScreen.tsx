import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { KeyRound } from 'lucide-react-native';

const OtpVerificationScreen = ({ navigation, route }: any) => {
  const { signupData, aadhaarNumber } = route.params;
  const { signIn } = useAuth();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyOtp(otp);
      if (response.success) {
        // Complete the signup process
        const signupResponse = await authService.signup({ ...signupData, role: 'woman' });
        if (signupResponse.success) {
          await signIn(signupResponse.user as any);
          navigation.navigate('Home');
        }
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (err) {
      Alert.alert('Error', 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirm OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your Aadhaar-linked mobile number ending in ****
          </Text>
        </View>

        <FormInput
          label="Verification Code"
          placeholder="123456"
          keyboardType="numeric"
          maxLength={6}
          icon={<KeyRound size={20} color={COLORS.primary} />}
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            if (error) setError(null);
          }}
          error={error || undefined}
        />

        <TouchableOpacity onPress={() => Alert.alert('OTP Resent', 'A new code has been sent to your mobile.')}>
          <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Resend</Text></Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <PrimaryButton 
            title="Verify & Complete" 
            onPress={handleVerify}
            isLoading={isLoading}
          />
          <Text style={styles.hintText}>Demo OTP: 123456</Text>
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
  resendText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    color: COLORS.primary,
  }
});

export default OtpVerificationScreen;
