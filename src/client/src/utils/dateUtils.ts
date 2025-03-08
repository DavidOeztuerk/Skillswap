// src/utils/dateUtils.ts
import {
  format,
  parseISO,
  isValid,
  addMinutes,
  isBefore,
  isAfter,
  differenceInMinutes,
} from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Formatiert ein Datum basierend auf einem bestimmten Format
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @param formatStr - Format-String (default: 'dd.MM.yyyy')
 * @returns Formatierter Datumsstring oder leer, wenn ungültiges Datum
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatStr = 'dd.MM.yyyy'
): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return '';

  return format(dateObj, formatStr, { locale: de });
};

/**
 * Formatiert Zeit (ohne Datum)
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @returns Formatierte Zeit (HH:mm) oder leer, wenn ungültiges Datum
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'HH:mm');
};

/**
 * Formatiert Datum und Zeit zusammen
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @returns Formatiertes Datum mit Zeit oder leer, wenn ungültiges Datum
 */
export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Formatiert ein Datumsintervall
 * @param startDate - ISO-Datumsstring oder Date-Objekt für Startdatum
 * @param endDate - ISO-Datumsstring oder Date-Objekt für Enddatum
 * @returns Formatiertes Datumsintervall
 */
export const formatDateTimeRange = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string => {
  if (!startDate || !endDate) return '';

  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (!isValid(start) || !isValid(end)) return '';

  // Wenn gleicher Tag, nur Zeit anzeigen
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return `${format(start, 'dd.MM.yyyy')} ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  }

  // Sonst vollständiges Datum und Zeit
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};

/**
 * Berechnet die Dauer zwischen zwei Zeitstempeln in Minuten
 * @param startDate - ISO-Datumsstring oder Date-Objekt für Startdatum
 * @param endDate - ISO-Datumsstring oder Date-Objekt für Enddatum
 * @returns Dauer in Minuten oder 0, wenn ungültige Daten
 */
export const calculateDuration = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): number => {
  if (!startDate || !endDate) return 0;

  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  if (!isValid(start) || !isValid(end)) return 0;

  return differenceInMinutes(end, start);
};

/**
 * Prüft, ob ein Datum in der Vergangenheit liegt
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @returns true, wenn Datum in der Vergangenheit liegt
 */
export const isPastDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return false;

  return isBefore(dateObj, new Date());
};

/**
 * Prüft, ob ein Datum in der Zukunft liegt
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @returns true, wenn Datum in der Zukunft liegt
 */
export const isFutureDate = (
  date: string | Date | null | undefined
): boolean => {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return false;

  return isAfter(dateObj, new Date());
};

/**
 * Fügt eine bestimmte Anzahl von Minuten zu einem Datum hinzu
 * @param date - ISO-Datumsstring oder Date-Objekt
 * @param minutes - Anzahl der hinzuzufügenden Minuten
 * @returns Neues Date-Objekt
 */
export const addTime = (
  date: string | Date | null | undefined,
  minutes: number
): Date | null => {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return null;

  return addMinutes(dateObj, minutes);
};
