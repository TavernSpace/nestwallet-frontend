import { useLoadFunction } from '@nestwallet/app/common/hooks/loading';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ScanBorder } from '@nestwallet/app/components/scan';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_WIDTH, colors } from '@nestwallet/app/design/constants';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { BarCodeScanningResult, Camera, PermissionStatus } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { delay } from '../../common/api/utils';
import { ActionSheetHeader } from '../../components/sheet/header';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { parseError } from '../../features/errors';
import { EnableCamera } from './enable-camera';

const getBarCodeScannerPermissions = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === PermissionStatus.GRANTED;
};

interface ScanQRCodeProps {
  title: string;
  description?: string;
  onScan: (data: string) => Promise<void>;
  onBack: VoidFunction;
  onRequestCamera: VoidFunction;
}

export function ScanQRCode(props: ScanQRCodeProps) {
  const { title, description, onScan, onBack, onRequestCamera } = props;

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>();

  const { data: hasPermission } = useLoadFunction(getBarCodeScannerPermissions);

  const handleScan = async (event: BarCodeScanningResult) => {
    try {
      setScanning(true);
      setError(undefined);
      await Haptics.impactAsync();
      await delay(1000);
      await onScan(event.data);
    } catch (err) {
      const error = parseError(err, 'Unable to scan QR code, please try again');
      setError(error.message);
    } finally {
      await delay(2000);
      setScanning(false);
    }
  };

  return onLoadable(hasPermission)(
    () => null,
    () => null,
    (hasPermission) =>
      !hasPermission ? (
        <ViewWithInset className='h-full w-full' hasBottomInset={true}>
          <ActionSheetHeader
            title={title}
            position='center'
            type='fullscreen'
            onClose={onBack}
          />
          <EnableCamera onLater={onBack} onEnable={onRequestCamera} />
        </ViewWithInset>
      ) : (
        <ViewWithInset className='h-full w-full' hasBottomInset={true}>
          <ActionSheetHeader
            title={title}
            position='center'
            type='fullscreen'
            onClose={onBack}
          />
          <View className='flex h-full flex-col px-4'>
            <View className='mt-16 flex flex-row items-center justify-center'>
              <View
                className='overflow-hidden'
                style={{
                  width: SCREEN_WIDTH - 80,
                  height: SCREEN_WIDTH - 80,
                  borderRadius: 48,
                }}
              >
                <Camera
                  barCodeScannerSettings={{
                    barCodeTypes: [
                      BarCodeScanner.Constants.BarCodeType.qr,
                      'qr',
                    ],
                  }}
                  onBarCodeScanned={!scanning ? handleScan : undefined}
                  style={{
                    width: SCREEN_WIDTH - 80,
                    height: SCREEN_WIDTH - 80,
                    borderRadius: 48,
                  }}
                />
              </View>
              {scanning && (
                <View
                  className='absolute bg-black opacity-5'
                  style={{
                    width: SCREEN_WIDTH - 80,
                    height: SCREEN_WIDTH - 80,
                    borderRadius: 48,
                  }}
                />
              )}
              <ScanBorder
                size={SCREEN_WIDTH - 140}
                length={40}
                thickness={6}
                color={
                  scanning && error
                    ? colors.failure
                    : scanning
                    ? colors.success
                    : colors.textPrimary
                }
                radius={48}
              />
            </View>
            {!!error && (
              <View className='mt-2 w-full items-center'>
                <View
                  className='bg-failure/10 rounded-xl px-4 py-2'
                  style={{ width: SCREEN_WIDTH - 80 }}
                >
                  <Text className='text-failure text-sm font-normal'>
                    {error}
                  </Text>
                </View>
              </View>
            )}
            {!!description && (
              <View className='mt-12 w-full items-center'>
                <View
                  className='bg-card rounded-2xl px-4 py-3'
                  style={{ width: SCREEN_WIDTH - 80 }}
                >
                  <Text className='text-text-secondary text-xs font-normal'>
                    {description}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ViewWithInset>
      ),
  );
}
