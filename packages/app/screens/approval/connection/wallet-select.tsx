import { ActionSheet } from '../../../components/sheet';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { WalletSelectContent } from '../../../molecules/select/wallet-select/content';

interface WalletSelectSheetProps {
  wallets: IWallet[];
  isShowing: boolean;
  gestureEnabled?: boolean;
  hasTopInset?: boolean;
  onClose: VoidFunction;
  onSelectWallet: (wallet: IWallet) => void;
}

export function WalletSelectSheet(props: WalletSelectSheetProps) {
  const {
    wallets,
    isShowing,
    gestureEnabled,
    hasTopInset = true,
    onClose,
    onSelectWallet,
  } = props;

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      gestureEnabled={gestureEnabled}
      hasBottomInset={false}
      hasTopInset={hasTopInset}
    >
      <WalletSelectContent
        wallets={wallets}
        onSelectWallet={onSelectWallet}
        onClose={onClose}
      />
    </ActionSheet>
  );
}
