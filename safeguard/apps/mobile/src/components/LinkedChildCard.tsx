import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import GlassCard from './GlassCard';
import { 
  User, 
  Battery, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight,
  Wifi
} from 'lucide-react-native';

interface Props {
  child: {
    id: string;
    name: string;
    unique_id: string;
    status: 'secure' | 'warning' | 'emergency';
    battery_level: number;
    is_online: boolean;
    last_seen: string;
  };
  onPress: () => void;
}

const LinkedChildCard = ({ child, onPress }: Props) => {
  const getStatusColor = () => {
    switch (child.status) {
      case 'emergency': return COLORS.error;
      case 'warning': return '#F59E0B';
      default: return COLORS.accent;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <GlassCard style={[styles.card, child.status === 'emergency' && styles.emergencyCard]}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={24} color="white" />
            <View style={[styles.onlineDot, { backgroundColor: child.is_online ? COLORS.accent : COLORS.textMuted }]} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{child.name}</Text>
            <Text style={styles.uniqueId}>ID: {child.unique_id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {child.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.stat}>
            <MapPin size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>Sector 7, Pune</Text>
          </View>
          <View style={styles.stat}>
            <Battery size={14} color={child.battery_level < 20 ? COLORS.error : COLORS.textMuted} />
            <Text style={styles.statText}>{child.battery_level}%</Text>
          </View>
          <View style={styles.stat}>
            <Wifi size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>LTE</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textMuted} />
        </View>

        {child.status === 'emergency' && (
          <View style={styles.emergencyFooter}>
            <ShieldAlert size={16} color="white" />
            <Text style={styles.emergencyMsg}>ACTIVE SOS INCIDENT - RESPOND NOW</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  emergencyCard: {
    borderColor: COLORS.error,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  uniqueId: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 6,
    fontSize: 11,
  },
  emergencyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    padding: 8,
    borderRadius: 8,
    marginTop: 15,
    justifyContent: 'center',
  },
  emergencyMsg: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  }
});

export default LinkedChildCard;
