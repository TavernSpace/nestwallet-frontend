import { formatAddress } from '../../../common/format/address';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function ApprovalWalletNotFoundScreen(props: {
  blockchain: IBlockchainType;
  expectedAddress?: string;
}) {
  const { blockchain, expectedAddress } = props;
  const { language } = useLanguageContext();

  const chainName = onBlockchain(blockchain)(
    () => localization.ethereum[language],
    () => localization.solana[language],
    () => localization.ton[language],
  );

  return (
    <ErrorScreen
      title={localization.noWalletsFound[language]}
      description={
        expectedAddress
          ? localization.walletNotFound(formatAddress(expectedAddress))[
              language
            ]
          : localization.noWalletsForChain(chainName)[language]
      }
    />
  );
}
