// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook zum Verzögern von Wertänderungen
 * Nützlich, um unnötige API-Anfragen bei Eingabefeldern zu vermeiden
 *
 * @param value Der zu verzögernde Wert
 * @param delay Die Verzögerungszeit in Millisekunden
 * @returns Der verzögerte Wert
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Timer setzen, der den Wert nach der Verzögerung aktualisiert
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Timer beim Aufräumen zurücksetzen
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
