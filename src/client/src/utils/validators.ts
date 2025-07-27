// src/utils/validators.ts

/**
 * Prüft, ob eine E-Mail-Adresse gültig ist
 * @param email - Zu prüfende E-Mail-Adresse
 * @returns true, wenn die E-Mail gültig ist
 */
export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

/**
 * Prüft, ob ein Passwort den Sicherheitsanforderungen entspricht
 * @param password - Zu prüfendes Passwort
 * @returns true, wenn das Passwort sicher genug ist
 */
export const isValidPassword = (password: string): boolean => {
  // Mindestens 8 Zeichen, mind. 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordPattern.test(password);
};

/**
 * Prüft, ob zwei Passwörter übereinstimmen
 * @param password - Passwort
 * @param confirmPassword - Bestätigungspasswort
 * @returns true, wenn die Passwörter übereinstimmen
 */
export const doPasswordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Prüft, ob ein Benutzername gültig ist
 * @param username - Zu prüfender Benutzername
 * @returns true, wenn der Benutzername gültig ist
 */
export const isValidUsername = (username: string): boolean => {
  // 3-20 Zeichen, nur Buchstaben, Zahlen, Unterstrich und Bindestrich
  const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernamePattern.test(username);
};

/**
 * Prüft, ob ein Text nicht leer ist
 * @param text - Zu prüfender Text
 * @returns true, wenn der Text nicht leer ist
 */
export const isNotEmpty = (text: string): boolean => {
  return text?.trim().length > 0;
};

/**
 * Prüft, ob ein Text eine bestimmte Mindestlänge hat
 * @param text - Zu prüfender Text
 * @param minLength - Mindestlänge (default: 3)
 * @returns true, wenn der Text die Mindestlänge erreicht
 */
export const hasMinLength = (text: string, minLength = 3): boolean => {
  return text?.trim()?.length >= minLength;
};

/**
 * Prüft, ob ein Text eine bestimmte Maximallänge nicht überschreitet
 * @param text - Zu prüfender Text
 * @param maxLength - Maximallänge (default: 255)
 * @returns true, wenn der Text die Maximallänge nicht überschreitet
 */
export const hasMaxLength = (text: string, maxLength = 255): boolean => {
  return text?.trim()?.length <= maxLength;
};

/**
 * Prüft, ob ein Text zwischen einer Mindest- und Maximallänge liegt
 * @param text - Zu prüfender Text
 * @param minLength - Mindestlänge (default: 3)
 * @param maxLength - Maximallänge (default: 255)
 * @returns true, wenn der Text im gültigen Bereich liegt
 */
export const isValidLength = (
  text: string,
  minLength = 3,
  maxLength = 255
): boolean => {
  const length = text?.trim()?.length;
  return length >= minLength && length <= maxLength;
};

/**
 * Prüft, ob ein Datum ein gültiges Kalenderdatum ist
 * @param dateStr - Zu prüfendes Datum (im Format YYYY-MM-DD)
 * @returns true, wenn das Datum gültig ist
 */
export const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * Prüft, ob eine URL gültig ist
 * @param url - Zu prüfende URL
 * @returns true, wenn die URL gültig ist
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};
