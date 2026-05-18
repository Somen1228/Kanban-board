/**
 * Kandoo Theme Definitions
 *
 * Each theme defines CSS variable tokens for the entire UI.
 * Custom themes must match this schema to be valid.
 *
 * Brand palette (sloth logo inspired):
 *   - Cream/beige (sloth body): warm light backgrounds
 *   - Navy (sloth outline / wordmark): primary accent + text
 *   - Sky blue, fresh green, warm yellow, coral: kanban accents
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
    name: 'Zen',
    id: 'light',
    emoji: '🦥',
    colors: {
      bgPrimary: '#fbf7f0',
      bgSecondary: '#f5efe3',
      bgCard: '#ffffff',
      bgSidebar: '#fbf7f0',
      bgInput: '#f5efe3',
      bgHover: '#ede3d0',
      bgModal: '#ffffff',
      bgOverlay: 'rgba(30,58,95,0.4)',
      textPrimary: '#1e3a5f',
      textSecondary: '#5c6b7c',
      textMuted: '#8b7e6e',
      border: '#e4dacb',
      shadow: 'rgba(30,58,95,0.08)',
      accent: '#1e3a5f',
      accentHover: '#2d4f7a',
      accentLight: 'rgba(30,58,95,0.1)',
      danger: '#e66b5c',
      dangerLight: '#f8b5ac',
      dangerBg: '#fce8e5',
      success: '#5baa5b',
      warning: '#e8b94a',
      taskBg: '#ffffff',
      taskBorder: '#efe7d9',
      highlightBg: '#fbe8a6',
      scrollThumb: 'rgba(30,58,95,0.3)',
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
      bgOverlay: 'rgba(15,23,42,0.75)',
      textPrimary: '#f4e8d3',
      textSecondary: '#a8b3c1',
      textMuted: '#64748b',
      border: 'rgba(244,232,211,0.1)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#7cb9e8',
      accentHover: '#9dcce8',
      accentLight: 'rgba(124,185,232,0.15)',
      danger: '#e66b5c',
      dangerLight: '#f8b5ac',
      dangerBg: 'rgba(230,107,92,0.15)',
      success: '#7cc97c',
      warning: '#f4d06f',
      taskBg: '#334155',
      taskBorder: 'rgba(244,232,211,0.06)',
      highlightBg: 'rgba(244,208,111,0.3)',
      scrollThumb: 'rgba(124,185,232,0.4)',
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
      danger: '#e66b5c',
      dangerLight: '#f8bbd0',
      dangerBg: 'rgba(230,107,92,0.15)',
      success: '#7cc97c',
      warning: '#f4d06f',
      taskBg: '#2d2944',
      taskBorder: 'rgba(157,140,230,0.08)',
      highlightBg: 'rgba(244,208,111,0.25)',
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
      border: 'rgba(124,201,124,0.12)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#7cc97c',
      accentHover: '#9cd99c',
      accentLight: 'rgba(124,201,124,0.15)',
      danger: '#e66b5c',
      dangerLight: '#ef9a9a',
      dangerBg: 'rgba(230,107,92,0.15)',
      success: '#7cc97c',
      warning: '#f4d06f',
      taskBg: '#243a2a',
      taskBorder: 'rgba(124,201,124,0.08)',
      highlightBg: 'rgba(244,208,111,0.25)',
      scrollThumb: 'rgba(124,201,124,0.35)',
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
      border: 'rgba(244,208,111,0.15)',
      shadow: 'rgba(0,0,0,0.4)',
      accent: '#f4d06f',
      accentHover: '#fae099',
      accentLight: 'rgba(244,208,111,0.15)',
      danger: '#e66b5c',
      dangerLight: '#ef9a9a',
      dangerBg: 'rgba(230,107,92,0.15)',
      success: '#7cc97c',
      warning: '#f4d06f',
      taskBg: '#3d2c22',
      taskBorder: 'rgba(244,208,111,0.08)',
      highlightBg: 'rgba(244,208,111,0.25)',
      scrollThumb: 'rgba(244,208,111,0.35)',
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
    const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    vars[cssKey] = value;
  });
  return vars;
};

export default themes;
