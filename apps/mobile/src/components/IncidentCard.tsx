import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import GlassCard from './GlassCard';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ShieldAlert,
  Activity
} from 'lucide-react-native';

interface Props {
  incident: {
    id: string;
    created_at: string;
    resolved: boolean;
    risk_level: string;
    trigger_type: string;
    threat_score: number;
    track_token?: string;
  };
}

const IncidentCard = ({ incident }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getStatusColor = () => {
    if (!incident.resolved) return COLORS.error;
    if (incident.risk_level === 'CRITICAL') return '#F59E0B';
    return COLORS.accent;
  };

  return (
    <GlassCard style={[styles.card, !incident.resolved && styles.activeCard]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor()}20` }]}>
            {incident.resolved ? 
              <CheckCircle2 size={20} color={COLORS.accent} /> : 
              <ShieldAlert size={20} color={COLORS.error} />
            }
          </View>
          
          <View style={styles.mainInfo}>
            <Text style={styles.idText}>INCIDENT #{incident.id.substring(0, 8).toUpperCase()}</Text>
            <View style={styles.timeRow}>
              <Clock size={12} color={COLORS.textMuted} />
              <Text style={styles.timeText}>{new Date(incident.created_at).toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {incident.resolved ? 'RESOLVED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TRIGGER</Text>
            <Text style={styles.summaryValue}>{incident.trigger_type.toUpperCase()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>THREAT</Text>
            <Text style={[styles.summaryValue, { color: incident.threat_score > 80 ? COLORS.error : COLORS.text }]}>
                {incident.threat_score}%
            </Text>
          </View>
          <View style={styles.summaryItem}>
             {expanded ? <ChevronUp size={20} color={COLORS.textMuted} /> : <ChevronDown size={20} color={COLORS.textMuted} />}
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          
          <View style={styles.timeline}>
             <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: COLORS.error }]} />
                <View style={styles.timelineTextContainer}>
                    <Text style={styles.timelineTitle}>Incident Triggered</Text>
                    <Text style={styles.timelineSub}>{new Date(incident.created_at).toLocaleTimeString()}</Text>
                </View>
             </View>
             
             {!incident.resolved ? (
                <View style={styles.timelineItem}>
                    <Activity size={16} color={COLORS.primary} style={styles.pulseIcon} />
                    <View style={styles.timelineTextContainer}>
                        <Text style={styles.timelineTitle}>Emergency Services Alerted</Text>
                        <Text style={styles.timelineSub}>Monitoring live coordinates...</Text>
                    </View>
                </View>
             ) : (
                <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: COLORS.accent }]} />
                    <View style={styles.timelineTextContainer}>
                        <Text style={styles.timelineTitle}>Incident Resolved</Text>
                        <Text style={styles.timelineSub}>Secured by user</Text>
                    </View>
                </View>
             )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.mapBtn}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.mapBtnText}>View Location History</Text>
            </TouchableOpacity>
            {incident.track_token && (
                <View style={styles.tokenBadge}>
                    <Text style={styles.tokenText}>TOKEN: {incident.track_token}</Text>
                </View>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  activeCard: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  idText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    marginLeft: 6,
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  expandedContent: {
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
  },
  timeline: {
    marginLeft: 5,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 20,
    marginBottom: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineDot: {
    position: 'absolute',
    left: -24,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineTextContainer: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  timelineSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  mapBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tokenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tokenText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textMuted,
  },
  pulseIcon: {
    position: 'absolute',
    left: -28,
  }
});

export default IncidentCard;
