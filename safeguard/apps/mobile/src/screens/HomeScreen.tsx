import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import GlowingButton from '../components/GlowingButton';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  Users, 
  Bell, 
  User as UserIcon,
  ChevronRight,
  Settings
} from 'lucide-react-native';

const HomeScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: signOut, style: 'destructive' },
    ]);
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cinematic Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Command Center</Text>
            <Text style={styles.username}>{user?.name || 'SafeGuard User'}</Text>
          </View>
          <TouchableOpacity style={[styles.profileBtn, SHADOWS.glow]}>
            <UserIcon size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Realtime Safety Score Card */}
        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <ShieldCheck size={20} color={COLORS.accent} />
            <Text style={styles.scoreTitle}>SYSTEM STATUS: SECURE</Text>
          </View>
          <View style={styles.scoreContent}>
            <View>
              <Text style={styles.scoreLabel}>Safety Score</Text>
              <Text style={styles.scoreValue}>98.4</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>OPTIMAL</Text>
            </View>
          </View>
        </GlassCard>

        {/* Main Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE DEPLOYMENT</Text>
          <View style={styles.actionGrid}>
            <GlowingButton 
              title="EMERGENCY SOS" 
              variant="danger"
              icon={<ShieldAlert size={20} color="white" />}
              onPress={() => navigation.navigate('SOS')}
              style={styles.sosBtn}
            />
          </View>
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('Tracking')}
            >
              <GlassCard style={styles.actionCard}>
                <MapPin size={24} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Live Tracking</Text>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('Journey')}
            >
              <GlassCard style={styles.actionCard}>
                <Navigation size={24} color={COLORS.secondary} />
                <Text style={styles.actionLabel}>Safe Journey</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.journeyShortcut}
            onPress={() => navigation.navigate('Journey')}
          >
            <Text style={styles.journeyShortcutText}>Safe Journey Home</Text>
          </TouchableOpacity>
        </View>

        {/* Parent Portal */}
        {user?.role === 'parent' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GUARDIAN PROTOCOL</Text>
            <GlowingButton 
              title="OPEN GUARDIAN DASHBOARD" 
              variant="secondary"
              icon={<Users size={20} color="white" />}
              onPress={() => navigation.navigate('GuardianDashboard')}
            />
          </View>
        )}

        <TouchableOpacity onPress={handleLogout}>
          <GlassCard style={styles.intelCard}>
            <View style={styles.intelHeader}>
              <Settings size={20} color={COLORS.textMuted} />
              <Text style={styles.intelTitle}>Account & Security Settings</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
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
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
  },
  username: {
    ...TYPOGRAPHY.h2,
    marginTop: 4,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreCard: {
    padding: SPACING.md,
    marginBottom: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    ...TYPOGRAPHY.dashboard,
    color: COLORS.accent,
    marginLeft: 10,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  scoreLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: 4,
  },
  scoreValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 42,
    lineHeight: 42,
  },
  scoreBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    ...TYPOGRAPHY.dashboard,
    marginBottom: 15,
  },
  actionGrid: {
    marginBottom: 15,
  },
  sosBtn: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
  },
  actionCard: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  actionLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  intelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intelTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  journeyShortcut: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  journeyShortcutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
