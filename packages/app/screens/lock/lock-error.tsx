import { useState } from 'react';
import { VoidPromiseFunction } from '../../common/types';
import { ActionSheet } from '../../components/sheet';
import { LockErrorContent } from './info';
import { PasswordResetContent } from './reset/content';
import { LockContentType } from './types';

export function LockErrorSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
  onReset: VoidPromiseFunction;
}) {
  const { isShowing, onClose, onReset } = props;

  const [content, setContent] = useState<LockContentType>('lock');

  const handleResetSubmit = async () => {
    await onReset();
    onClose();
  };

  const handleClose = () => {
    onClose();
    setContent('lock');
  };

  return (
    <ActionSheet isShowing={isShowing} onClose={handleClose} isDetached={true}>
      {content === 'lock' ? (
        <LockErrorContent
          onClose={handleClose}
          onReset={() => setContent('reset')}
        />
      ) : (
        <PasswordResetContent
          onClose={handleClose}
          onBack={() => setContent('lock')}
          onSubmit={handleResetSubmit}
        />
      )}
    </ActionSheet>
  );
}
