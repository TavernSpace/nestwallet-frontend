import { useState } from 'react';
import { VoidPromiseFunction } from '../../common/types';
import { TextButton } from '../button/text-button';
import { ActionSheet } from '../sheet';
import { ActionSheetHeader } from '../sheet/header';
import { Text } from '../text';
import { View } from '../view';

export function Alert(props: {
  children?: React.ReactNode;
  title: string;
  subtitle: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: VoidFunction;
  onConfirm: VoidFunction | VoidPromiseFunction;
  isVisible: boolean;
}) {
  const {
    children,
    title,
    subtitle,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onCancel,
    onConfirm,
    isVisible,
  } = props;

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <ActionSheet isShowing={isVisible} onClose={onCancel} isDetached={true}>
      <ActionSheetHeader title={title} onClose={onCancel} type='detached' />
      <View className='flex flex-col px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {subtitle}
        </Text>
        {children}
        <View className='mt-6 flex w-full flex-row space-x-4'>
          <View className='flex-1'>
            <TextButton
              onPress={onCancel}
              type='tertiary'
              disabled={loading}
              text={cancelText}
            />
          </View>
          <View className='flex-1'>
            <TextButton
              onPress={handleConfirm}
              loading={loading}
              disabled={loading}
              text={confirmText}
            />
          </View>
        </View>
      </View>
    </ActionSheet>
  );
}
