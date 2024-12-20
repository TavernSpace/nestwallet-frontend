import { useCopy } from '../../../../common/hooks/copy';
import {
  AssetTransfer,
  ISignerWallet,
  Loadable,
} from '../../../../common/types';
import { mapLoadable, onLoadable } from '../../../../common/utils/query';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { onBlockchain } from '../../../../features/chain';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import {
  IContact,
  ICryptoBalance,
  IOrganization,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { TransferReviewItem } from '../transfer-review-item';
import { WalletCard } from '../wallet-card';
import { TransferReviewFooterEvm } from './review-footer-evm';
import { TransferReviewFooterSvm } from './review-footer-svm';
import { TransferReviewFooterTvm } from './review-footer-tvm';

interface EoaTransferReviewScreenProps {
  transfer: AssetTransfer;
  wallet: IWallet;
  client: IProtectedWalletClient;
  organization: IOrganization;
  cryptoBalances: Loadable<ICryptoBalance[]>;
  signers: ISignerWallet[];
  contacts: Loadable<IContact[]>;
  onCompleted: VoidFunction;
}

export function EoaTransferReviewScreen(props: EoaTransferReviewScreenProps) {
  const {
    transfer,
    wallet,
    client,
    organization,
    cryptoBalances,
    signers,
    contacts,
    onCompleted,
  } = props;
  const { asset, recipient, value } = transfer;
  const { copy } = useCopy('Copied address!');

  const nativeAsset = mapLoadable(cryptoBalances)(
    (data) =>
      data.find(
        (item) =>
          item.tokenMetadata.isNativeToken &&
          item.chainId === transfer.asset.chainId,
      ) ?? null,
  );

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full w-full flex-col justify-between px-4'>
        <View className='flex flex-1 flex-col'>
          <WalletCard wallet={wallet} />
          <View className='flex flex-1'>
            <TransferReviewItem
              transfer={transfer}
              wallets={organization.wallets}
              contacts={contacts.data ?? []}
              signers={signers}
              copy={copy}
            />
            {!!transfer.comment && (
              <View className='bg-card flex flex-col space-y-2 rounded-2xl px-4 py-3'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {'Comment:'}
                </Text>
                <Text className='text-text-secondary text-xs font-normal'>
                  {transfer.comment}
                </Text>
              </View>
            )}
          </View>
        </View>
        {onLoadable(nativeAsset)(
          () => null,
          () => null,
          (nativeAsset) =>
            onBlockchain(wallet.blockchain)(
              () => (
                <TransferReviewFooterEvm
                  nativeAsset={nativeAsset}
                  asset={asset}
                  recipient={{ address: recipient }}
                  amount={value}
                  wallet={wallet}
                  client={client}
                  onCompleted={onCompleted}
                />
              ),
              () => (
                <TransferReviewFooterSvm
                  nativeAsset={nativeAsset}
                  asset={asset}
                  recipient={{ address: recipient }}
                  amount={value}
                  wallet={wallet}
                  client={client}
                  onCompleted={onCompleted}
                />
              ),
              () => (
                <TransferReviewFooterTvm
                  nativeAsset={nativeAsset}
                  asset={asset}
                  recipient={{ address: recipient }}
                  amount={value}
                  comment={transfer.comment}
                  wallet={wallet}
                  client={client}
                  onCompleted={onCompleted}
                />
              ),
            ),
        )}
      </View>
    </ViewWithInset>
  );
}
