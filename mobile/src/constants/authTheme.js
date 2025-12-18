// Auth Screens - Modern Design System

export const COLORS = {
  // Primary (Brand)
  primary: '#007AFF',
  primaryLight: '#E3F2FF',
  primaryDark: '#0056B3',

  // Role Colors
  customer: '#007AFF',
  owner: '#FF9500',
  courier: '#34C759',

  // Neutrals
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  border: '#E1E4E8',
  borderFocus: '#007AFF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textPlaceholder: '#999999',
  textDisabled: '#CCCCCC',

  // Functional
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const getRoleColor = (role) => {
  switch (role) {
    case 'user':
      return { main: COLORS.customer, light: COLORS.primaryLight };
    case 'owner':
      return { main: COLORS.owner, light: '#FFF3E0' };
    case 'courier':
      return { main: COLORS.courier, light: '#E8F5E9' };
    default:
      return { main: COLORS.customer, light: COLORS.primaryLight };
  }
};

export const getRoleName = (role) => {
  switch (role) {
    case 'user':
      return 'Müşteri';
    case 'owner':
      return 'İşletme Sahibi';
    case 'courier':
      return 'Kurye';
    default:
      return 'Müşteri';
  }
};
