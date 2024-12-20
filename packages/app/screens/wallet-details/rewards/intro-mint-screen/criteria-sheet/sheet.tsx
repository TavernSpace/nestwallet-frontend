import { adjust } from '../../../../../common/utils/style';
import { ChainAvatar } from '../../../../../components/avatar/chain-avatar';
import { Banner } from '../../../../../components/banner';
import { ActionSheet } from '../../../../../components/sheet';
import { View } from '../../../../../components/view';
import { colors } from '../../../../../design/constants';
import { getChainInfo } from '../../../../../features/chain';
import {
  IBlockchainType,
  IWallet,
} from '../../../../../graphql/client/generated/graphql';
import { WalletSelectContent } from '../../../../../molecules/select/wallet-select/content';

interface MintCriteriaSheetProps {
  wallets: IWallet[];
  isShowing: boolean;
  onClose: VoidFunction;
  onSelectWallet: (wallet: IWallet) => void;
  onCreateWallet: VoidFunction;
}

export function MintCriteriaSheet(props: MintCriteriaSheetProps) {
  const { wallets, isShowing, onClose, onSelectWallet, onCreateWallet } = props;

  const validWallets = wallets.filter(
    (wallet) =>
      wallet.blockchain === IBlockchainType.Evm &&
      (wallet.chainId === 0 || wallet.chainId === 137),
  );

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasBottomInset={true}
      hasTopInset={true}
    >
      <WalletSelectContent
        wallets={validWallets}
        onSelectWallet={onSelectWallet}
        onClose={onClose}
        onCreateWallet={onCreateWallet}
        ListHeader={() => (
          <View
            className='w-full px-4'
            style={{ marginBottom: validWallets.length === 0 ? 0 : 8 }}
          >
            <Banner
              title='Polygon Wallets Only'
              color={colors.polygon}
              borderRadius={8}
              icon={{
                adornment: (
                  <ChainAvatar
                    chainInfo={getChainInfo(137)}
                    size={adjust(20, 2)}
                  />
                ),
              }}
            />
          </View>
        )}
      />
    </ActionSheet>
  );
}
