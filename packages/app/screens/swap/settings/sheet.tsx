import { ActionSheet } from '../../../components/sheet';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { SwapSettingsContent, SwapSettingsContentProps } from './content';

type SwapSettingsProps = Omit<SwapSettingsContentProps, 'offset'> & {
  isShowing: boolean;
  hasTopInset: boolean;
};

export function SwapSettingsSheet(props: SwapSettingsProps) {
  const { isShowing, hasTopInset, onClose } = props;
  const { bottom, top } = useSafeAreaInsets();

  const offset = hasTopInset ? top + bottom - 16 : bottom - 24;

  return (
    <ActionSheet
      isShowing={isShowing}
      isFullHeight={true}
      hasTopInset={hasTopInset}
      hasBottomInset={false}
      onClose={onClose}
    >
      <SwapSettingsContent {...props} offset={offset} />
    </ActionSheet>
  );
}
