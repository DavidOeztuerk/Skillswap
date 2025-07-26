// src/utils/formatters.ts

/**
 * Erstellt einen vollständigen Namen aus Vor- und Nachname
 * @param firstName - Vorname
 * @param lastName - Nachname
 * @returns Vollständiger Name oder fallback, wenn keine Namen vorhanden
 */
export const formatFullName = (
  firstName?: string | null,
  lastName?: string | null
): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (!first && !last) return 'Unbekannter Benutzer';

  return [first, last].filter(Boolean).join(' ');
};

/**
 * Formatiert Währungsbeträge
 * @param amount - Betrag als Zahl
 * @param currency - Währungscode (default: 'EUR')
 * @returns Formatierter Währungsbetrag
 */
export const formatCurrency = (amount: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatiert eine E-Mail-Adresse für die Anzeige
 * @param email - E-Mail-Adresse
 * @returns Formatierte E-Mail-Adresse oder leer, wenn keine vorhanden
 */
export const formatEmail = (email?: string | null): string => {
  if (!email) return '';
  return email.toLowerCase();
};

/**
 * Formatiert eine Telefonnummer für die Anzeige
 * @param phone - Telefonnummer
 * @returns Formatierte Telefonnummer oder leer, wenn keine vorhanden
 */
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';

  // Entferne alle Nicht-Ziffern
  const cleaned = phone.replace(/\D/g, '');

  // Einfache deutsche Formatierung
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }

  // Keine Formatierung, wenn Länge nicht passt
  return phone;
};

/**
 * Kürzt Text auf eine bestimmte Länge
 * @param text - Zu kürzender Text
 * @param maxLength - Maximale Länge (default: 100)
 * @param suffix - Anhang für gekürzte Texte (default: '...')
 * @returns Gekürzter Text mit Suffix oder original, wenn kurz genug
 */
export const truncateText = (
  text: string,
  maxLength = 100,
  suffix = '...'
): string => {
  if (!text) return '';

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Formatiert eine Kompetenzlevel als lesbare Beschreibung
 * @param level - Kompetenzstufe
 * @returns Menschenlesbare Beschreibung des Levels
 */
export const formatProficiencyLevel = (level: string): string => {
  switch (level) {
    case 'Beginner':
      return 'Anfänger';
    case 'Intermediate':
      return 'Fortgeschritten';
    case 'Advanced':
      return 'Sehr erfahren';
    case 'Expert':
      return 'Experte';
    default:
      return level;
  }
};

/**
 * Formatiert einen Status als lesbaren Text
 * @param status - Status-String
 * @returns Menschenlesbarer Status
 */
export const formatStatus = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'Ausstehend';
    case 'Confirmed':
      return 'Bestätigt';
    case 'Cancelled':
      return 'Abgesagt';
    case 'Completed':
      return 'Abgeschlossen';
    case 'Accepted':
      return 'Akzeptiert';
    case 'Rejected':
      return 'Abgelehnt';
    case 'Expired':
      return 'Abgelaufen';
    default:
      return status;
  }
};

// src/utils/formatters.ts

/**
 * Generiert eine konsistente Farbe aus einem String
 * @param string - Eingabestring (z.B. Name)
 * @returns Hexadezimaler Farbwert
 */
export const stringToColor = (string: string): string => {
  let hash = 0;
  let i;

  /* Einfache Hash-Funktion */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

/**
 * Formatiert eine Dauer in Sekunden zu einem lesbaren String
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
