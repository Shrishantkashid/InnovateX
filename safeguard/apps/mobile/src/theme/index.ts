export const COLORS = {
  primary: '#8B5CF6', // Electric Purple
  secondary: '#3B82F6', // Bright Blue
  accent: '#10B981', // Emerald Green for success
  error: '#EF4444', // Red for errors
  background: '#0F172A', // Deep Space Blue/Black
  surface: 'rgba(30, 41, 59, 0.7)', // Glass surface
  primary: '#3B82F6', // Vibrant Blue
  secondary: '#8B5CF6', // Purple
  accent: '#10B981', // Emerald Green
  error: '#EF4444', // Red
  warning: '#F59E0B', // Amber
  background: '#0F172A', // Slate 900
  card: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
  text: '#F8FAFC', // Slate 50
  textMuted: '#94A3B8', // Slate 400
  border: 'rgba(255, 255, 255, 0.1)',
  glow: 'rgba(59, 130, 246, 0.5)',
};

export const GRADIENTS = {
  primary: ['#3B82F6', '#2563EB'],
  secondary: ['#8B5CF6', '#7C3AED'],
  danger: ['#EF4444', '#B91C1C'],
  safe: ['#10B981', '#059669'],
  dark: ['#0F172A', '#1E293B'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.03)'],
  cinematic: ['#0F172A', '#1E293B', '#0F172A'],
  emergency: ['#7F1D1D', '#0F172A'],
};

export const SHADOWS = {
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  errorGlow: {
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  dashboard: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  }
};
