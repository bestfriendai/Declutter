/**
 * useNetworkStatus -- Wraps @react-native-community/netinfo
 * Provides a simple boolean for offline detection + connection type.
 */

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  isOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: NetInfoStateType.unknown,
    isOffline: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable;
      // Consider offline only when we definitively know there's no connection
      const isOffline = isConnected === false || isInternetReachable === false;

      setStatus({
        isConnected,
        isInternetReachable,
        type: state.type,
        isOffline,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
