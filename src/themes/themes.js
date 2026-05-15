/**
 * KanDoo Theme Definitions
 *
 * Each theme defines CSS variable tokens for the entire UI.
 * Custom themes must match this schema to be valid.
 */

export const THEME_TOKENS = [
  'bgPrimary', 'bgSecondary', 'bgCard', 'bgSidebar', 'bgInput',
  'bgHover', 'bgModal', 'bgOverlay',
  'textPrimary', 'textSecondary', 'textMuted',
  'border', 'shadow',
  'accent', 'accentHover', 'accentLight',
  'danger', 'dangerLight', 'dangerBg', 'success', 'warning',
  'taskBg', 'taskBorder', 'highlightBg', 'scrollThumb',
];

const themes = [
  {
    name: 'Light',
    id: 'light',
    emoji: '☀️',
    colors: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgCard: '#ffffff',
      bgSidebar: '#f9fafb',
      bgInput: '#f3f4f6',
      bgHover: '#e5e7eb',
      bgModal: '#ffffff',
      bgOverlay: 'rgba(0,0,0,0.5)',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      shadow: 'rgba(0,0,0,0.08)',
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentLight: 'rgba(124,58,237,0.1)',
      danger: '#ef4444',
      dangerLight: '#fca5a5',
      dangerBg: '#fee2e2',
      success: '#22c55e',
      warning: '#eab308',
      taskBg: '#ffffff',
      taskBorder: '#f1f5f9',
      highlightBg: '#fef08a',
      scrollThumb: 'rgba(100,100,100,0.4)',
    },
  },
  {
    name: 'Dark',
    id: 'dark',
    emoji: '🌙',
    colors: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgCard: '#1e293b',
      bgSidebar: '#0f172a',
      bgInput: '#334155',
      bgHover: '#334155',
      bgModal: '#1e293b',
      bgOverlay: 'rgba(0,0,0,0.7)',
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      border: 'rgba(255,255,255,0.08)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#8b5cf6',
      accentHover: '#a78bfa',
      accentLight: 'rgba(139,92,246,0.15)',
      danger: '#ef4444',
      dangerLight: '#fca5a5',
      dangerBg: 'rgba(239,68,68,0.15)',
      success: '#22c55e',
      warning: '#eab308',
      taskBg: '#334155',
      taskBorder: 'rgba(255,255,255,0.05)',
      highlightBg: 'rgba(234,179,8,0.3)',
      scrollThumb: 'rgba(139,92,246,0.4)',
    },
  },
  {
    name: 'Midnight',
    id: 'midnight',
    emoji: '🔮',
    colors: {
      bgPrimary: '#13111c',
      bgSecondary: '#1c1a29',
      bgCard: '#221f33',
      bgSidebar: '#13111c',
      bgInput: '#2d2944',
      bgHover: '#2d2944',
      bgModal: '#221f33',
      bgOverlay: 'rgba(0,0,0,0.75)',
      textPrimary: '#e4e0f5',
      textSecondary: '#9b93c9',
      textMuted: '#6e63a5',
      border: 'rgba(157,140,230,0.12)',
      shadow: 'rgba(0,0,0,0.5)',
      accent: '#9d8ce6',
      accentHover: '#b8a9f0',
      accentLight: 'rgba(157,140,230,0.15)',
      danger: '#f06292',
      dangerLight: '#f8bbd0',
      dangerBg: 'rgba(240,98,146,0.15)',
      success: '#69f0ae',
      warning: '#ffd54f',
      taskBg: '#2d2944',
      taskBorder: 'rgba(157,140,230,0.08)',
      highlightBg: 'rgba(255,213,79,0.25)',
      scrollThumb: 'rgba(157,140,230,0.35)',
    },
  },
  {
    name: 'Forest',
    id: 'forest',
    emoji: '🌿',
    colors: {
      bgPrimary: '#0f1a14',
      bgSecondary: '#162118',
      bgCard: '#1a2b1f',
      bgSidebar: '#0f1a14',
      bgInput: '#243a2a',
      bgHover: '#243a2a',
      bgModal: '#1a2b1f',
      bgOverlay: 'rgba(0,0,0,0.7)',
      textPrimary: '#d4e7d9',
      textSecondary: '#8baa93',
      textMuted: '#5e7d66',
      border: 'rgba(76,175,80,0.12)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#4caf50',
      accentHover: '#66bb6a',
      accentLight: 'rgba(76,175,80,0.15)',
      danger: '#ef5350',
      dangerLight: '#ef9a9a',
      dangerBg: 'rgba(239,83,80,0.15)',
      success: '#69f0ae',
      warning: '#ffd54f',
      taskBg: '#243a2a',
      taskBorder: 'rgba(76,175,80,0.08)',
      highlightBg: 'rgba(255,213,79,0.25)',
      scrollThumb: 'rgba(76,175,80,0.35)',
    },
  },
  {
    name: 'Sunset',
    id: 'sunset',
    emoji: '🌅',
    colors: {
      bgPrimary: '#1a1210',
      bgSecondary: '#261a15',
      bgCard: '#30211a',
      bgSidebar: '#1a1210',
      bgInput: '#3d2c22',
      bgHover: '#3d2c22',
      bgModal: '#30211a',
      bgOverlay: 'rgba(0,0,0,0.7)',
      textPrimary: '#f0ddd0',
      textSecondary: '#c4a48e',
      textMuted: '#8a6d58',
      border: 'rgba(255,152,0,0.12)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#ff9800',
      accentHover: '#ffb74d',
      accentLight: 'rgba(255,152,0,0.15)',
      danger: '#ef5350',
      dangerLight: '#ef9a9a',
      dangerBg: 'rgba(239,83,80,0.15)',
      success: '#69f0ae',
      warning: '#ffd54f',
      taskBg: '#3d2c22',
      taskBorder: 'rgba(255,152,0,0.08)',
      highlightBg: 'rgba(255,213,79,0.25)',
      scrollThumb: 'rgba(255,152,0,0.35)',
    },
  },
];

/**
 * Validate a custom theme object has all required tokens
 */
export const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'object') return { valid: false, error: 'Theme must be an object' };
  if (!theme.name || typeof theme.name !== 'string') return { valid: false, error: 'Theme must have a "name" string' };
  if (!theme.colors || typeof theme.colors !== 'object') return { valid: false, error: 'Theme must have a "colors" object' };

  const missing = THEME_TOKENS.filter((token) => !theme.colors[token]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing color tokens: ${missing.join(', ')}` };
  }

  return { valid: true };
};

/**
 * Convert a theme's colors to CSS variable assignments
 */
export const themeToCSSVars = (theme) => {
  const vars = {};
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case: bgPrimary -> bg-primary
    const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    vars[cssKey] = value;
  });
  return vars;
};

export default themes;
