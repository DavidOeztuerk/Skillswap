// src/hooks/useTheme.ts
import { useState, useMemo, useEffect } from 'react';
import {
  createTheme,
  responsiveFontSizes,
  Theme,
  PaletteMode,
} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { getThemeOptions } from '../styles/theme';
import { withDefault } from '../utils/safeAccess';

/**
 * Hook für die Theme-Verwaltung
 * Ermöglicht das Umschalten zwischen Light und Dark Mode
 * und speichert die Präferenz im LocalStorage
 */
export const useTheme = () => {
  // Prüfen, ob der Benutzer Dark Mode bevorzugt
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const THEME_STORAGE_KEY = 'skillswap_theme_mode';

  // Gespeicherten Modus aus dem LocalStorage laden oder Systemeinstellung verwenden
  const getSavedMode = (): PaletteMode => {
    try {
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
      return savedMode === 'light' || savedMode === 'dark'
        ? savedMode
        : withDefault(prefersDarkMode, false)
          ? 'dark'
          : 'light';
    } catch {
      // Fallback wenn localStorage nicht verfügbar ist
      return withDefault(prefersDarkMode, false) ? 'dark' : 'light';
    }
  };

  // Zustand für den Theme-Modus
  const [mode, setMode] = useState<PaletteMode>(getSavedMode());

  // Theme bei Änderung des Modus aktualisieren
  const theme: Theme = useMemo(
    () => responsiveFontSizes(createTheme(getThemeOptions(mode))),
    [mode]
  );

  // Modus im LocalStorage speichern, wenn er sich ändert
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  }, [mode]);

  // Funktion zum Umschalten des Themes
  const toggleTheme = (): void => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Funktion zum expliziten Setzen des Modus
  const setThemeMode = (newMode: PaletteMode): void => {
    setMode(newMode);
  };

  return { theme, mode, toggleTheme, setThemeMode };
};
