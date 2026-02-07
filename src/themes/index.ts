import type { MindMapConfig, ThemePreset } from '../types';

// ─── Default Configuration ───────────────────────────────────────────────────

export const defaultConfig: MindMapConfig = {
  style: {
    palette: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#EF4444'],
    levelColors: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#EF4444'],
    useGradients: true,
    gradientDirection: 'vertical',
    nodeRadius: 12,
    nodeBorderWidth: 2,
    nodeBorderColor: 'rgba(0,0,0,0.1)',
    nodeOpacity: 1,
    nodeShadow: true,
    nodeShadowColor: 'rgba(0,0,0,0.15)',
    nodeShadowBlur: 8,
    nodePaddingX: 20,
    nodePaddingY: 10,
    nodeShape: 'rounded-rect',
    rootBgColor: '#4F46E5',
    rootTextColor: '#FFFFFF',
    rootFontSize: 20,
    rootBorderRadius: 16,
    bgColor: '#F8FAFC',
    bgTransparent: false,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    levelFontSizes: [20, 15, 13, 12, 11, 10],
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.4,
    textAlign: 'center',
    textColor: '#1E293B',
  },
  structure: {
    layout: 'radial',
    horizontalSpacing: 60,
    verticalSpacing: 30,
    maxDepth: 8,
    compactMode: false,
  },
  link: {
    style: 'organic',
    stroke: 'solid',
    thickness: 4,
    color: '#94A3B8',
    colorByLevel: true,
    animated: false,
    animationSpeed: 2,
    tapered: true,
    markerStart: 'none',
    markerEnd: 'arrow',
    markerSize: 8,
  },
  export: {
    format: 'svg',
    scale: 2,
    bgTransparent: false,
    bgColor: '#F8FAFC',
    padding: 40,
    quality: 0.95,
  },
};

// ─── Theme Presets ───────────────────────────────────────────────────────────

const darkTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#818CF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#22D3EE', '#FB923C', '#F87171'],
    levelColors: ['#818CF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#22D3EE', '#FB923C', '#F87171'],
    rootBgColor: '#818CF8',
    rootTextColor: '#FFFFFF',
    nodeBorderColor: 'rgba(255,255,255,0.1)',
    nodeShadowColor: 'rgba(0,0,0,0.4)',
    bgColor: '#0F172A',
  },
  typography: {
    ...defaultConfig.typography,
    textColor: '#E2E8F0',
  },
  link: {
    ...defaultConfig.link,
    color: '#475569',
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#0F172A',
  },
};

const minimalTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'],
    levelColors: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'],
    useGradients: false,
    rootBgColor: '#111827',
    rootTextColor: '#FFFFFF',
    nodeShadow: false,
    nodeBorderWidth: 1,
    nodeBorderColor: '#D1D5DB',
    nodeRadius: 6,
    bgColor: '#FFFFFF',
  },
  typography: {
    ...defaultConfig.typography,
    textColor: '#111827',
  },
  link: {
    ...defaultConfig.link,
    colorByLevel: false,
    color: '#D1D5DB',
    thickness: 2,
    tapered: false,
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#FFFFFF',
  },
};

const professionalTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#1E40AF', '#047857', '#B45309', '#B91C1C', '#6D28D9', '#0E7490', '#4338CA', '#065F46'],
    levelColors: ['#1E40AF', '#047857', '#B45309', '#B91C1C', '#6D28D9', '#0E7490', '#4338CA', '#065F46'],
    useGradients: true,
    rootBgColor: '#1E3A5F',
    rootTextColor: '#FFFFFF',
    nodeShadowBlur: 4,
    nodeShadowColor: 'rgba(0,0,0,0.1)',
    nodeRadius: 8,
    nodeBorderColor: 'rgba(0,0,0,0.08)',
    bgColor: '#F1F5F9',
  },
  typography: {
    ...defaultConfig.typography,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    textColor: '#0F172A',
  },
  link: {
    ...defaultConfig.link,
    thickness: 3,
    color: '#64748B',
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#F1F5F9',
  },
};

const funTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#E11D48', '#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#0D9488'],
    levelColors: ['#E11D48', '#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#0D9488'],
    useGradients: true,
    rootBgColor: '#E11D48',
    rootTextColor: '#FFFFFF',
    nodeShadow: true,
    nodeShadowBlur: 12,
    nodeShadowColor: 'rgba(0,0,0,0.2)',
    nodeRadius: 20,
    nodeShape: 'pill',
    bgColor: '#FFF7ED',
  },
  typography: {
    ...defaultConfig.typography,
    fontFamily: "'Nunito', 'Quicksand', sans-serif",
    fontWeight: 'bold',
    textColor: '#FFFFFF',
  },
  link: {
    ...defaultConfig.link,
    thickness: 4.5,
    style: 'organic',
    animated: true,
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#FFF7ED',
  },
};

const oceanTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#0369A1', '#0891B2', '#0D9488', '#0E7490', '#155E75', '#164E63', '#1E40AF', '#0C4A6E'],
    levelColors: ['#0369A1', '#0891B2', '#0D9488', '#0E7490', '#155E75', '#164E63', '#1E40AF', '#0C4A6E'],
    useGradients: true,
    rootBgColor: '#0C4A6E',
    rootTextColor: '#FFFFFF',
    nodeShadowColor: 'rgba(3,105,161,0.2)',
    bgColor: '#F0F9FF',
  },
  typography: {
    ...defaultConfig.typography,
    textColor: '#0C4A6E',
  },
  link: {
    ...defaultConfig.link,
    color: '#7DD3FC',
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#F0F9FF',
  },
};

const forestTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#166534', '#15803D', '#4D7C0F', '#A16207', '#854D0E', '#365314', '#14532D', '#3F6212'],
    levelColors: ['#166534', '#15803D', '#4D7C0F', '#A16207', '#854D0E', '#365314', '#14532D', '#3F6212'],
    useGradients: true,
    rootBgColor: '#14532D',
    rootTextColor: '#FFFFFF',
    nodeShadowColor: 'rgba(22,101,52,0.2)',
    bgColor: '#F0FDF4',
  },
  typography: {
    ...defaultConfig.typography,
    textColor: '#14532D',
  },
  link: {
    ...defaultConfig.link,
    color: '#86EFAC',
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#F0FDF4',
  },
};

const sunsetTheme: Partial<MindMapConfig> = {
  style: {
    ...defaultConfig.style,
    palette: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#E11D48', '#C2410C', '#B91C1C', '#9A3412'],
    levelColors: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#E11D48', '#C2410C', '#B91C1C', '#9A3412'],
    useGradients: true,
    rootBgColor: '#991B1B',
    rootTextColor: '#FFFFFF',
    nodeShadowColor: 'rgba(220,38,38,0.2)',
    bgColor: '#FFFBEB',
  },
  typography: {
    ...defaultConfig.typography,
    textColor: '#78350F',
  },
  link: {
    ...defaultConfig.link,
    color: '#FCA5A5',
  },
  export: {
    ...defaultConfig.export,
    bgColor: '#FFFBEB',
  },
};

export const themePresets: Record<ThemePreset, Partial<MindMapConfig>> = {
  light: { ...defaultConfig },
  dark: darkTheme,
  minimal: minimalTheme,
  professional: professionalTheme,
  fun: funTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
};

export function applyTheme(base: MindMapConfig, theme: ThemePreset): MindMapConfig {
  const preset = themePresets[theme];
  return {
    style: { ...base.style, ...(preset.style || {}) },
    typography: { ...base.typography, ...(preset.typography || {}) },
    structure: { ...base.structure, ...(preset.structure || {}) },
    link: { ...base.link, ...(preset.link || {}) },
    export: { ...base.export, ...(preset.export || {}) },
  };
}
