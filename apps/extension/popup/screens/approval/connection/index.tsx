import { IApproveConnectionInput } from '@nestwallet/app/common/types';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { View } from '@nestwallet/app/components/view';
import { onBlockchain } from '@nestwallet/app/features/chain';
import { WalletVersion } from '@nestwallet/app/features/tvm/types';
import {
  generateTonConnectItemResponse,
  getTonWalletFromVersion,
} from '@nestwallet/app/features/tvm/utils';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { ApprovalConnectionScreen } from '@nestwallet/app/screens/approval/connection/screen';
import { ApprovalWalletNotFoundScreen } from '@nestwallet/app/screens/approval/errors/wallet-not-found';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { decodePayload } from '../../../../common/navigation/utils';
import { useGoBackOrClose } from '../../../hooks/navigation';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import {
  connectedSiteQueryKey,
  connectedSitesQueryKey,
} from '../../../hooks/ui-service';
import { useInternalApprovalModalStackNavigationOptions } from '../../../navigation/navigators/options';
import { ApprovalStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type ConnectionRouteParams = IApproveConnectionInput;

type RouteProps = StackScreenProps<ApprovalStackParamList, 'connection'>;

export const ApprovalConnectionWithData = withUserContext(
  _ApprovalConnectionWithData,
);

function _ApprovalConnectionWithData({ route }: RouteProps) {
  const { payload, isInternal = false } = route.params;
  const decodedPayload = decodePayload<ConnectionRouteParams>(payload);
  const { requestId, origin, tabId, chainId, blockchain, items, manifest } =
    decodedPayload;
  const { walletService } = useAppContext();
  const { wallets, signers } = useUserContext();
  const { client } = useLockContext();
  const {
    selectedEvmWallet,
    selectedSvmWallet,
    selectedTvmWallet,
    setConnectedWallet,
  } = useSelectedWallet();
  const queryClient = useQueryClient();
  const navigateBack = useGoBackOrClose(isInternal);

  useInternalApprovalModalStackNavigationOptions(
    decodedPayload,
    'Connection rejected',
  );

  const handleCancel = async () => {
    await walletService.resolveApproval({
      requestId,
      tabId,
      blockchain,
      error: 'Connection rejected',
    });
    navigateBack();
  };

  const selectedWallet = onBlockchain(blockchain)(
    () => selectedEvmWallet,
    () => selectedSvmWallet,
    () => selectedTvmWallet,
  );

  const handleConfirm = async (wallet: IWallet, chainId: number) => {
    try {
      if (origin.url) {
        // we need to call connect seperately since connecting to a dApp
        // changes the state of the provider
        const data = await setConnectedWallet(
          origin.url,
          origin.title ?? new URL(origin.url).hostname,
          origin.favIconUrl ?? '',
          chainId,
          wallet,
        );
        const result = await onBlockchain(blockchain)(
          () => ({
            origin: origin.url,
            ...data,
          }),
          () => ({
            origin: origin.url,
            ...data,
          }),
          async () => {
            const signer = await client.getTvmSigner(chainId, wallet);
            const publicKey = await signer.getPublicKey();
            const tonWallet = getTonWalletFromVersion(
              wallet.version as WalletVersion,
              publicKey,
            );
            const result = await generateTonConnectItemResponse(
              signer,
              publicKey,
              tonWallet,
              items,
              manifest,
            );
            return {
              origin: origin.url,
              data: result,
            };
          },
        );
        await walletService.resolveApproval({
          requestId,
          tabId,
          blockchain,
          result,
        });
      } else {
        await walletService.resolveApproval({
          requestId,
          tabId,
          blockchain,
          error: 'Could not connect to origin',
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: connectedSiteQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: connectedSitesQueryKey(),
        }),
      ]);
    } catch (err) {
      await walletService.resolveApproval({
        requestId,
        tabId,
        blockchain,
        error: 'Could not connect to origin',
      });
    } finally {
      navigateBack();
    }
  };

  return onLoadable(selectedWallet)(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => <ApprovalWalletNotFoundScreen blockchain={blockchain} />,
    (wallet) =>
      wallet ? (
        <ApprovalConnectionScreen
          wallet={wallet}
          wallets={wallets.filter((wallet) => wallet.blockchain === blockchain)}
          signers={signers}
          blockchain={blockchain}
          chainId={chainId}
          origin={origin}
          connectionType='injection'
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ) : (
        <ApprovalWalletNotFoundScreen blockchain={blockchain} />
      ),
  );
}
