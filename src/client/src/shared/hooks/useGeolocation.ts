import { useState, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => void;
  clearLocation: () => void;
  isSupported: boolean;
}

const initialState: GeolocationState = {
  latitude: null,
  longitude: null,
  error: null,
  loading: false,
  permissionDenied: false,
};

/**
 * Hook for accessing browser geolocation API
 *
 * @example
 * ```tsx
 * const { latitude, longitude, error, loading, requestLocation, isSupported } = useGeolocation();
 *
 * // Request location when user clicks button
 * <Button onClick={requestLocation} disabled={loading}>
 *   {loading ? 'Standort wird ermittelt...' : 'Standort verwenden'}
 * </Button>
 *
 * // Use coordinates in filter
 * if (latitude && longitude) {
 *   fetchSkills({ userLatitude: latitude, userLongitude: longitude, maxDistanceKm: 50 });
 * }
 * ```
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [state, setState] = useState<GeolocationState>(initialState);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation wird von diesem Browser nicht unterstützt',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        });
      },
      (error) => {
        let errorMessage: string;
        let permissionDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Standortzugriff wurde verweigert';
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Standortinformationen nicht verfügbar';
            break;
          case error.TIMEOUT:
            errorMessage = 'Zeitüberschreitung bei der Standortabfrage';
            break;
          default:
            errorMessage = 'Ein unbekannter Fehler ist aufgetreten';
        }

        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, [isSupported]);

  const clearLocation = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
    isSupported,
  };
};

export default useGeolocation;
