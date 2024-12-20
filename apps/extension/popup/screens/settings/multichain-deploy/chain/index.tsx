import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { getSafeApiKit } from '@nestwallet/app/features/safe/utils';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { MultichainDeployChainWithQuery } from '@nestwallet/app/screens/multichain-deploy/chain/query';
import { MultichainDeployInput } from '@nestwallet/app/screens/multichain-deploy/schema';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeCreationInfoResponse } from '@safe-global/api-kit';
import { useWalletById } from '../../../../hooks/wallet';
import { SettingsStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  SettingsStackParamList,
  'multichainDeployChain'
>;

export const MultichainDeployChainScreenWithData = withUserContext(
  _MultichainDeployChainScreenWithData,
);

function _MultichainDeployChainScreenWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { wallets } = useUserContext();
  const navigation = useNavigation();
  // TODO: since this is open in a new tab maybe this should instead be close on invalid?
  // Or maybe just remove this and show an error screen
  useResetToOnInvalid('app', !wallet);

  const handleSubmit = async (
    input: MultichainDeployInput,
    creationInfo: SafeCreationInfoResponse,
    wallet: IWallet,
  ) => {
    const walletExists = wallets.find(
      (w) => w.chainId === input.chainId && w.address === wallet.address,
    );
    if (walletExists) {
      throw new Error(
        'A Safe with this chain and address has already been added to your account',
      );
    }
    const safeApi = getSafeApiKit(input.chainId);
    const safeExists = await safeApi
      .getSafeInfo(wallet.address)
      .then(() => true)
      .catch(() => {
        // TODO(Peter): not good - safe sdk do not return http status
        return false;
      });
    if (safeExists) {
      throw new Error(
        'A Safe with this address has already been deployed to the selected chain',
      );
    }
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'multichainDeployExecute',
        params: {
          walletId,
          input: {
            ...input,
            address: wallet.address,
            organizationId: wallet.organization.id,
            creationInfo,
            originalChainId: wallet.chainId,
          },
        },
      },
    });
  };

  return wallet ? (
    <MultichainDeployChainWithQuery
      wallet={wallet}
      onSubmit={(input, creationInfo) =>
        handleSubmit(input, creationInfo, wallet)
      }
    />
  ) : null;
}
