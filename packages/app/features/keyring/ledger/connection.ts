import { ledgerUSBVendorId } from '@ledgerhq/devices';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const hasConnectedLedgerDevice = async () => {
  const devices = await navigator.hid.getDevices();
  return (
    devices.filter((device) => device.vendorId === ledgerUSBVendorId).length > 0
  );
};

export const useLedgerDeviceConnected = () => {
  const [connected, setConnected] = useState(false);

  const onConnect = async ({ device }: { device: HIDDevice }) => {
    if (device.vendorId === ledgerUSBVendorId) {
      setConnected(true);
    }
  };

  const onDisconnect = ({ device }: { device: HIDDevice }) => {
    if (device.vendorId === ledgerUSBVendorId) {
      setConnected(false);
    }
  };

  const detectDevice = async () => {
    hasConnectedLedgerDevice().then((state) => {
      setConnected(state);
    });
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      detectDevice();
      navigator.hid.addEventListener('connect', onConnect);
      navigator.hid.addEventListener('disconnect', onDisconnect);

      return () => {
        navigator.hid.removeEventListener('connect', onConnect);
        navigator.hid.removeEventListener('disconnect', onDisconnect);
      };
    }
    return undefined;
  }, []);

  return connected;
};
