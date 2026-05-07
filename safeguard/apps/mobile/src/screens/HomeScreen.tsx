import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../theme';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { 
  ShieldAlert, 
  MapPin, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Bell,
  Navigation
} from 'lucide-react-native';

const HomeScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: signOut, style: 'destructive' },
    ]);
  };

  const ActionButton = ({ title, icon: Icon, onPress, color }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.actionButtonWrapper}>
      <GlassCard style={styles.actionCard}>
        <View style={[styles.actionIconContainer, { backgroundColor: `${color}20` }]}>
          <Icon size={24} color={color} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileIcon}>
            <LogOut color={COLORS.textMuted} size={24} />
          </TouchableOpacity>
        </View>

        {/* Role ID Card */}
        <GlassCard style={styles.idCard}>
          <View style={styles.idRow}>
            <View>
              <Text style={styles.roleLabel}>{user?.role?.toUpperCase()} ACCOUNT</Text>
              <Text style={styles.uniqueId}>{user?.uniqueId || 'VERIFIED IDENTITY'}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </GlassCard>

        {/* Main Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          <View style={styles.actionGrid}>
            <ActionButton 
              title="Trigger SOS" 
              icon={ShieldAlert} 
              onPress={() => navigation.navigate('SOS')}
              color={COLORS.error}
            />
            <ActionButton 
              title="Safe Journey" 
              icon={Navigation} 
              onPress={() => navigation.navigate('Journey')}
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* secondary Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tools</Text>
          <View style={styles.actionGrid}>
            <ActionButton 
              title="Live Tracking" 
              icon={MapPin} 
              onPress={() => navigation.navigate('Tracking')}
              color={COLORS.secondary}
            />
            <ActionButton 
              title="Alert History" 
              icon={Bell} 
              onPress={() => Alert.alert('History', 'No recent alerts found.')}
              color={COLORS.accent}
            />
          </View>
        </View>

        {/* Quick Settings */}
        <TouchableOpacity style={styles.settingsItem}>
          <GlassCard style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsIconContainer}>
                <Settings size={20} color={COLORS.text} />
              </View>
              <Text style={styles.settingsText}>Account & Security Settings</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  userName: {
    ...TYPOGRAPHY.h1,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  idCard: {
    marginBottom: 30,
    padding: SPACING.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleLabel: {
    ...TYPOGRAPHY.caption,
    letterSpacing: 1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  uniqueId: {
    ...TYPOGRAPHY.h2,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: 16,
    marginLeft: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonWrapper: {
    width: '48%',
  },
  actionCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsItem: {
    marginTop: 10,
    marginBottom: 40,
  },
  settingsCard: {
    padding: SPACING.md,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconContainer: {
    marginRight: 15,
  },
  settingsText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
  },
});

export default HomeScreen;
