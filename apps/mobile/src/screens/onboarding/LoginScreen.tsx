import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { CONFIG } from '../../constants/config';
import { Mail, Lock, Server } from 'lucide-react-native';

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

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Strip /api if present to hit the root health endpoint
      const rootUrl = CONFIG.API_URL.endsWith('/api') 
        ? CONFIG.API_URL.slice(0, -4) 
        : CONFIG.API_URL;
        
      const response = await fetch(rootUrl);
      const data = await response.json().catch(() => ({}));
      
      Alert.alert(
        '✅ Connection Success', 
        `Backend is online and reachable!\n\nURL: ${rootUrl}\nResponse: ${JSON.stringify(data)}`
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Connection Failed', 
        `Cannot reach the backend.\n\nURL: ${CONFIG.API_URL}\nError: ${error.message}\n\nIf you see 'Network request failed', your Railway server is completely down or the URL is wrong.`
      );
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

            <TouchableOpacity 
              onPress={testConnection}
              style={styles.testButton}
              disabled={isLoading}
            >
              <Server size={14} color={COLORS.textMuted} style={{marginRight: 6}} />
              <Text style={styles.testButtonText}>Test Server Connection</Text>
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
  testButton: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  testButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  }
});

export default LoginScreen;
