import { RecipientAccount } from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { CreateSafeSelectSignersWithQuery } from '@nestwallet/app/screens/add-wallet/create-safe/signers/query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { CreateSafeStackParamList } from '../../../../navigation/types';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<CreateSafeStackParamList, 'signers'>;

export const CreateSafeSelectSigners = withUserContext(
  _CreateSafeSelectSigners,
);

function _CreateSafeSelectSigners({ route }: RouteProps) {
  const { wallets, signers, accounts } = useUserContext();
  const { toggleAutoLock } = useLockContext();
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

  useEffect(() => {
    return () => toggleAutoLock(true);
  }, []);

  return (
    <CreateSafeSelectSignersWithQuery
      safes={wallets.filter((wallet) => wallet.type === IWalletType.Safe)}
      signers={signers.filter(
        (signer) => signer.blockchain === IBlockchainType.Evm,
      )}
      organization={accounts.find((account) => account.isDefault)!.organization}
      onSelectSigners={handleSelectSigners}
      onToggleLock={Platform.OS === 'android' ? toggleAutoLock : undefined}
    />
  );
}
