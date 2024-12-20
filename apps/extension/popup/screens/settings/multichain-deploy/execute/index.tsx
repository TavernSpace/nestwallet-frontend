import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { useMultichainDeploySafeTransaction } from '@nestwallet/app/features/safe/create';
import {
  IBlockchainType,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { MultichainDeployExecuteWithQuery } from '@nestwallet/app/screens/multichain-deploy/execute/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../../hooks/selected-wallet';
import { useWalletById } from '../../../../hooks/wallet';
import { SettingsStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  SettingsStackParamList,
  'multichainDeployExecute'
>;

export const MultichainDeployExecuteScreenWithData = withUserContext(
  _MultichainDeployExecuteScreenWithData,
);

function _MultichainDeployExecuteScreenWithData({ route }: RouteProps) {
  const { walletId, input } = route.params;
  const { wallet } = useWalletById(walletId);
  const { user, signers, refetch } = useUserContext();
  const { setSelectedWallet } = useSelectedWallet();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

  const multichainDeploySafeTransaction =
    useMultichainDeploySafeTransaction(user);

  const handleRedeploySafe = async () => {
    const wallet = await multichainDeploySafeTransaction.mutateAsync(input);
    // Need to manually refetch so the wallet exists before we navigate
    // TODO: what to do if this fetch fails? This function is technically idempotent so maybe its fine to just run everything again?
    await refetch();
    await setSelectedWallet(wallet.upsertCustomPredictedSafeWallet as IWallet);
    navigation.navigate('app', {
      screen: 'walletDetails',
      params: {
        walletId: wallet.upsertCustomPredictedSafeWallet.id,
      },
    });
  };

  return wallet ? (
    <MultichainDeployExecuteWithQuery
      wallet={wallet}
      signers={signers.filter(
        (signer) => signer.blockchain === IBlockchainType.Evm,
      )}
      input={input}
      onSubmit={handleRedeploySafe}
    />
  ) : null;
}
