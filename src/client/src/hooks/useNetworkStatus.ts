import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: 'unknown' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet';
  downlink?: number;
  rtt?: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let connectionType: NetworkStatus['connectionType'] = 'unknown';
      let isSlowConnection = false;
      let downlink: number | undefined;
      let rtt: number | undefined;

      // Check if Network Information API is available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        downlink = connection.downlink;
        rtt = connection.rtt;

        // Determine connection type
        const effectiveType = connection.effectiveType;
        if (effectiveType) {
          connectionType = effectiveType;
        }

        // Consider connection slow if:
        // - Effective type is 2g or slow-2g
        // - Downlink is less than 1 Mbps
        // - RTT is greater than 500ms
        isSlowConnection = 
          effectiveType === '2g' || 
          effectiveType === 'slow-2g' ||
          (downlink ? downlink < 1 : false) ||
          (rtt ? rtt > 500 : false);
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        downlink,
        rtt,
      });
    };

    // Initial status
    updateNetworkStatus();

    // Listen for online/offline events
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}

export default useNetworkStatus;