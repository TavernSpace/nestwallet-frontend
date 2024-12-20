import { getChainInfo } from '@nestwallet/app/features/chain';
import { CreateSafeSelectChainScreen } from '@nestwallet/app/screens/add-wallet/create-safe/select-chain/screen';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ethers } from 'ethers';
import { CreateSafeStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<CreateSafeStackParamList, 'selectChain'>;

export const CreateSafeSelectChain = withUserContext(_CreateSafeSelectChain);

function _CreateSafeSelectChain({ route }: RouteProps) {
  const { signers } = route.params;
  const { user } = useUserContext();
  const navigation = useNavigation();

  const handleSelectChain = async (chainId: number) => {
    const nonce = `0x${Buffer.from(ethers.randomBytes(32)).toString('hex')}`;
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'createSafe',
        params: {
          screen: 'safeSummary',
          params: {
            signers,
            chainId,
            nonce,
            metadata: {
              name: `${getChainInfo(chainId).name} Safe`,
            },
          },
        },
      },
    });
  };

  return (
    <CreateSafeSelectChainScreen
      user={user}
      onSelectChain={handleSelectChain}
    />
  );
}
