import { RecipientAccount } from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { CreateSafeSelectSignersWithQuery } from '@nestwallet/app/screens/add-wallet/create-safe/signers/query';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { CreateSafeStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<CreateSafeStackParamList, 'signers'>;

export const CreateSafeSelectSigners = withUserContext(
  _CreateSafeSelectSigners,
);

function _CreateSafeSelectSigners({ route }: RouteProps) {
  const { wallets, signers, accounts } = useUserContext();
  const navigation = useNavigation();

  const handleSelectSigners = (signers: RecipientAccount[]) => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'createSafe',
        params: {
          screen: 'selectChain',
          params: {
            signers,
          },
        },
      },
    });
  };

  return (
    <CreateSafeSelectSignersWithQuery
      safes={wallets.filter((wallet) => wallet.type === IWalletType.Safe)}
      signers={signers.filter(
        (signer) => signer.blockchain === IBlockchainType.Evm,
      )}
      organization={accounts.find((account) => account.isDefault)!.organization}
      onSelectSigners={handleSelectSigners}
    />
  );
}
