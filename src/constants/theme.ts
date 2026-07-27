export const theme = {
  colors: {
    // Emerald Green Palette (Primary)
    primary: '#10B981',              // Main emerald
    primaryLight: '#D1FAE5',          // Light emerald for backgrounds
    primaryDark: '#047857',           // Dark emerald
    secondary: '#059669',             // Dark emerald variant
    
    // Backgrounds & Surfaces
    background: '#F4F3F6',            // Light grey
    surface: '#FFFFFF',               // White
    surfaceAlt: '#F9FAFB',            // Off-white
    
    // Text Colors
    text: '#1A1625',                  // Dark text
    textSecondary: '#6B6478',         // Secondary text
    textMuted: '#A09AB0',             // Muted text
    
    // Utility Colors
    success: '#22C55E',               // Green (feedback)
    warning: '#F59E0B',               // Amber (caution)
    error: '#EF4444',                 // Red (errors)
    info: '#3B82F6',                  // Blue (info)
    accent: '#0D9488',                // Teal accent
    
    // AI/Gemini
    gemini: '#4285F4',                // Google blue
    
    // Neutral
    border: '#E5E7EB',
    divider: '#D1D5DB',
    disabled: '#D1D5DB',
    white: '#FFFFFF',                 // Needed for some existing components
  },

  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
    pill: 9999,
  },

  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '800' as const,
      fontFamily: 'Epilogue',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '800' as const,
      fontFamily: 'Epilogue',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '700' as const,
      fontFamily: 'Epilogue',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '700' as const,
      fontFamily: 'Manrope',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      fontFamily: 'Manrope',
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      fontFamily: 'Manrope',
      lineHeight: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      fontFamily: 'Manrope',
      lineHeight: 20,
    },
    labelBold: {
      fontSize: 14,
      fontWeight: '600' as const,
      fontFamily: 'Manrope',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      fontFamily: 'Manrope',
      lineHeight: 16,
    },
    // Adding previous typography properties back for backward compatibility with older components
    bodyLg: { fontFamily: 'Manrope_400Regular', fontSize: 18, lineHeight: 28 },
    bodyMd: { fontFamily: 'Manrope_500Medium', fontSize: 16, lineHeight: 24 },
    bodySm: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 20 },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
