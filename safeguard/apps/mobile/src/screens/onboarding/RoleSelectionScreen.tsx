import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, TYPOGRAPHY } from '../../theme';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { User, Baby, ShieldCheck } from 'lucide-react-native';

const RoleSelectionScreen = ({ navigation }: any) => {
  const { setRole } = useAuth();

  const handleRoleSelect = (role: 'woman' | 'child' | 'parent') => {
    setRole(role);
    navigation.navigate('Signup');
  };

  const RoleCard = ({ title, description, icon: Icon, role, color }: any) => (
    <TouchableOpacity onPress={() => handleRoleSelect(role)} style={styles.cardWrapper}>
      <GlassCard style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon size={32} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>Select your role to personalize your safety experience</Text>
        </View>

        <RoleCard
          title="Women"
          description="Emergency tracking, threat fusion, and verified safety for women."
          icon={User}
          role="woman"
          color="#EC4899" // Pink accent
        />

        <RoleCard
          title="Child"
          description="Stay connected with your parents and get help immediately."
          icon={Baby}
          role="child"
          color="#3B82F6" // Blue accent
        />

        <RoleCard
          title="Parent"
          description="Monitor your child's safety and manage emergency contacts."
          icon={ShieldCheck}
          role="parent"
          color="#10B981" // Emerald accent
        />
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
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: 4,
  },
  cardDescription: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
});

export default RoleSelectionScreen;
