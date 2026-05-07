import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Mail, Lock } from 'lucide-react-native';

const LoginScreen = ({ navigation }: any) => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);
      if (response.success) {
        await signIn(response.user as any, response.token);
        navigation.navigate('Home');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your credentials to access your account.</Text>
          </View>

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
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            icon={<Lock size={20} color={COLORS.textMuted} />}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            error={errors.password}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <PrimaryButton 
              title="Login" 
              onPress={handleLogin}
              isLoading={isLoading}
            />
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('RoleSelection')}
              style={styles.signupLink}
            >
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
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
    paddingTop: 100,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 10,
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
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

export default LoginScreen;
