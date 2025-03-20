/**
 * Hilfsklasse für das Speichern und Abrufen von Daten aus der sessionStorage
 * Die sessionStorage speichert Daten nur für die aktuelle Browser-Session
 * und wird gelöscht, wenn der Tab oder das Fenster geschlossen wird.
 */
export class SessionStorage {
  /**
   * Speichert einen Wert in der sessionStorage
   * @param key - Der Schlüssel, unter dem der Wert gespeichert wird
   * @param value - Der zu speichernde Wert
   */
  static setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Fehler beim Speichern in sessionStorage:', error);
    }
  }

  /**
   * Ruft einen Wert aus der sessionStorage ab
   * @param key - Der Schlüssel des abzurufenden Werts
   * @returns Der gespeicherte Wert oder null, wenn nicht gefunden
   */
  static getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Fehler beim Abrufen aus sessionStorage:', error);
      return null;
    }
  }

  /**
   * Entfernt einen Wert aus der sessionStorage
   * @param key - Der Schlüssel des zu entfernenden Werts
   */
  static removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Fehler beim Entfernen aus sessionStorage:', error);
    }
  }

  /**
   * Löscht alle Werte aus der sessionStorage
   */
  static clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Fehler beim Leeren der sessionStorage:', error);
    }
  }
}
