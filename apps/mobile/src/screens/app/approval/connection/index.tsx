import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { View } from '@nestwallet/app/components/view';
import { onBlockchain } from '@nestwallet/app/features/chain';
import { WalletVersion } from '@nestwallet/app/features/tvm/types';
import {
  generateTonConnectItemResponse,
  getDeviceInfo,
  getTonWalletFromVersion,
} from '@nestwallet/app/features/tvm/utils';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { ApprovalConnectionScreen } from '@nestwallet/app/screens/approval/connection/screen';
import { ApprovalWalletNotFoundScreen } from '@nestwallet/app/screens/approval/errors/wallet-not-found';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { getPlatform } from '../../../../common/service/tonconnect/utils';
import { useSelectedWallet } from '../../../../hooks/selected-wallet';
import { InternalConnectionApprovalStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  InternalConnectionApprovalStackParamList,
  'connection'
>;

export const ApprovalConnectionWithData = withUserContext(
  _ApprovalConnectionWithData,
);

function _ApprovalConnectionWithData({ route }: RouteProps) {
  const { payload } = route.params;
  const { requestId, origin, chainId, blockchain, items, manifest } = payload;
  const { walletService, walletConnectProvider, tonConnectProvider } =
    useAppContext();
  const { wallets, signers } = useUserContext();
  const {
    selectedEvmWallet,
    selectedSvmWallet,
    selectedTvmWallet,
    setConnectedWallet,
  } = useSelectedWallet();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    if (payload.walletConnect) {
      await walletConnectProvider.rejectConnection(payload.walletConnect);
    } else if (payload.tonConnectConnectionData) {
      await tonConnectProvider.postMessage(payload.tonConnectConnectionData, {
        event: 'connect_error',
        id: Date.now(),
        payload: {
          code: 300,
          message: 'User declined the connection',
        },
      });
    } else {
      await walletService.resolveApproval({
        requestId,
        blockchain,
        error: 'Connection rejected',
      });
    }
    navigation.goBack();
  };

  const handleConfirm = async (wallet: IWallet, chainId: number) => {
    try {
      if (payload.walletConnect) {
        await walletConnectProvider.confirmConnection(
          wallet,
          payload.walletConnect,
        );
        await queryClient.invalidateQueries({
          queryKey: ['queryWalletConnectConnections'],
        });
      } else if (payload.tonConnectConnectionData) {
        const signer = await walletService.getTvmSigner(chainId, wallet);
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
        await tonConnectProvider.upsertConnection(
          payload.tonConnectConnectionData.url,
          payload.tonConnectConnectionData,
        );
        await tonConnectProvider.postMessage(payload.tonConnectConnectionData, {
          event: 'connect',
          id: Date.now(),
          payload: {
            items: result,
            device: getDeviceInfo(getPlatform()),
          },
        });
        await queryClient.invalidateQueries({
          queryKey: ['queryTonConnectConnections'],
        });
      } else if (origin.url) {
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
            const signer = await walletService.getTvmSigner(chainId, wallet);
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
          blockchain,
          result,
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['queryConnectedSite'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['queryConnectedSites'],
          }),
        ]);
      } else {
        await walletService.resolveApproval({
          requestId,
          blockchain,
          error: 'Could not connect to origin',
        });
      }
    } catch (err) {
      await walletService.resolveApproval({
        requestId,
        blockchain,
        error: 'Could not connect to origin',
      });
    } finally {
      navigation.goBack();
    }
  };

  const selectedWallet = onBlockchain(blockchain)(
    () => selectedEvmWallet,
    () => selectedSvmWallet,
    () => selectedTvmWallet,
  );

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
          connectionType={payload.walletConnect ? 'wc' : 'injection'}
          signers={signers}
          blockchain={blockchain}
          chainId={chainId}
          origin={origin}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      ) : (
        <ApprovalWalletNotFoundScreen blockchain={blockchain} />
      ),
  );
}
