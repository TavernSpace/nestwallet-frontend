import { useState } from 'react';
import { VoidPromiseFunction } from '../../common/types';
import { ActionSheet } from '../../components/sheet';
import { View } from '../../components/view';
import { SCREEN_HEIGHT } from '../../design/constants';
import { ChoosePasswordContent } from './choose-password/content';
import { LockContent } from './lock';
import { PasswordResetContent } from './reset/content';

interface WalletLockSheetProps {
  hasKeyrings: boolean;
  isShowing: boolean;
  onUnlock: (password: string) => Promise<void>;
  onCreatePassword: (password: string) => Promise<void>;
  onReset: VoidPromiseFunction;
}

export function WalletLockSheet(props: WalletLockSheetProps) {
  const { hasKeyrings, isShowing, onUnlock, onReset, onCreatePassword } = props;

  const [reset, setReset] = useState(false);

  const handleResetSubmit = async () => {
    await onReset();
    setReset(false);
  };

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={() => {}}
      gestureEnabled={false}
      isDetached={true}
      soundEnabled={false}
      blur={8}
    >
      <View className='w-full' style={{ height: (SCREEN_HEIGHT * 4) / 5 - 16 }}>
        {hasKeyrings && !reset ? (
          <LockContent onUnlock={onUnlock} onReset={() => setReset(true)} />
        ) : reset ? (
          <PasswordResetContent
            onClose={() => setReset(false)}
            onSubmit={handleResetSubmit}
          />
        ) : (
          <ChoosePasswordContent onSubmit={onCreatePassword} />
        )}
      </View>
    </ActionSheet>
  );
}
