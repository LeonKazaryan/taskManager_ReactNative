import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    primaryContainer: '#eef2ff',
    secondary: '#f59e0b',
    secondaryContainer: '#fef3c7',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#fafafa',
    error: '#ef4444',
    onSurface: '#111827',
    onSurfaceVariant: '#6b7280',
    outline: '#e5e7eb',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818cf8',
    primaryContainer: '#3730a3',
    secondary: '#fbbf24',
    secondaryContainer: '#78350f',
    surface: '#1f2937',
    surfaceVariant: '#374151',
    background: '#111827',
    error: '#f87171',
    onSurface: '#f9fafb',
    onSurfaceVariant: '#d1d5db',
    outline: '#4b5563',
  },
};

// Status colors for light theme
export const lightStatusColors = {
  todo: {
    color: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  in_progress: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  completed: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
  },
  cancelled: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
  },
};

// Status colors for dark theme
export const darkStatusColors = {
  todo: {
    color: '#818cf8',
    backgroundColor: '#312e81',
  },
  in_progress: {
    color: '#fbbf24',
    backgroundColor: '#78350f',
  },
  completed: {
    color: '#34d399',
    backgroundColor: '#064e3b',
  },
  cancelled: {
    color: '#f87171',
    backgroundColor: '#7f1d1d',
  },
};

