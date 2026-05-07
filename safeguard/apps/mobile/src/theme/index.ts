export const COLORS = {
  primary: '#8B5CF6', // Electric Purple
  secondary: '#3B82F6', // Bright Blue
  accent: '#10B981', // Emerald Green for success
  error: '#EF4444', // Red for errors
  background: '#0F172A', // Deep Space Blue/Black
  surface: 'rgba(30, 41, 59, 0.7)', // Glass surface
  text: '#F8FAFC', // Slate White
  textMuted: '#94A3B8', // Muted Slate
  border: 'rgba(255, 255, 255, 0.1)',
  glow: 'rgba(139, 92, 246, 0.3)',
};

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.secondary],
  dark: [COLORS.background, '#1E293B'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  h2: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 16, fontWeight: '400', color: COLORS.text },
  caption: { fontSize: 12, fontWeight: '400', color: COLORS.textMuted },
};
