import React from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import GlassCard from '../GlassCard';
import { AlertTriangle, ShieldCheck, Zap, BatteryLow, Users } from 'lucide-react-native';

export interface EmergencyEvent {
  id: string;
  type: 'SOS' | 'ZONE' | 'BATTERY' | 'OFFLINE' | 'RESOLVED' | 'GUARDIAN';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  events: EmergencyEvent[];
}

const EmergencyEventFeed = ({ events }: Props) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SOS': return <AlertTriangle size={18} color={COLORS.error} />;
      case 'ZONE': return <Zap size={18} color={COLORS.primary} />;
      case 'BATTERY': return <BatteryLow size={18} color={COLORS.error} />;
      case 'RESOLVED': return <ShieldCheck size={18} color={COLORS.accent} />;
      case 'GUARDIAN': return <Users size={18} color={COLORS.secondary} />;
      default: return <Zap size={18} color={COLORS.text} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return COLORS.error;
      case 'high': return '#F59E0B';
      case 'medium': return COLORS.primary;
      default: return COLORS.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                {getIcon(item.type)}
              </View>
              <View style={styles.content}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.timestamp}</Text>
              </View>
              <View style={[styles.indicator, { backgroundColor: getSeverityColor(item.severity) }]} />
            </View>
          </GlassCard>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 250,
    width: '100%',
  },
  list: {
    paddingBottom: SPACING.md,
  },
  card: {
    marginBottom: 10,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginLeft: 10,
  }
});

export default EmergencyEventFeed;
