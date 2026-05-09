import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { User, Mail, Phone, Lock, Heart } from 'lucide-react-native';

const SignupScreen = ({ navigation }: any) => {
  const { role, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emergencyContact: '',
  });

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (role === 'woman' && !formData.emergencyContact) {
      newErrors.emergencyContact = 'Emergency contact is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    if (role === 'woman') {
      navigation.navigate('AadhaarVerification', { signupData: formData });
    } else {
      setIsLoading(true);
      try {
        const response = await authService.signup({ ...formData, role });
        if (response.success) {
          await signIn(response.user as any, response.token);
          navigation.navigate('Home');
        }
      } catch (error: any) {
        Alert.alert('Signup Failed', error.message || 'An error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up as a <Text style={styles.roleText}>{role?.toUpperCase()}</Text> to get started.
            </Text>
          </View>

          <FormInput
            label="Full Name"
            placeholder="Jane Doe"
            icon={<User size={20} color={COLORS.textMuted} />}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            error={errors.name}
          />

          <FormInput
            label="Email Address"
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={20} color={COLORS.textMuted} />}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            error={errors.email}
          />

          <FormInput
            label="Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            icon={<Phone size={20} color={COLORS.textMuted} />}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            error={errors.phone}
          />

          {role === 'woman' && (
            <FormInput
              label="Emergency Contact (SOS)"
              placeholder="+91 90000 00000"
              keyboardType="phone-pad"
              icon={<Heart size={20} color={COLORS.primary} />}
              value={formData.emergencyContact}
              onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
              error={errors.emergencyContact}
            />
          )}

          <FormInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            icon={<Lock size={20} color={COLORS.textMuted} />}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            error={errors.password}
          />

          <FormInput
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
            icon={<Lock size={20} color={COLORS.textMuted} />}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            error={errors.confirmPassword}
          />

          <View style={styles.footer}>
            <PrimaryButton 
              title={role === 'woman' ? "Verify Aadhaar" : "Complete Registration"} 
              onPress={handleSignup}
              isLoading={isLoading}
            />
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.linkText}>Log In</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  roleText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    paddingBottom: 40,
  },
  disclaimer: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
