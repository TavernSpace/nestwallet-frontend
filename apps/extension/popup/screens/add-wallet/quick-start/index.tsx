import { delay } from '@nestwallet/app/common/api/utils';
import { Tuple } from '@nestwallet/app/common/types';
import {
  IUpsertWalletInput,
  IWallet,
  IWalletType,
  useUpsertWalletsMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { QuickStartScreen } from '@nestwallet/app/screens/add-wallet/quick-start/screen';
import { generateQuickStartWallets } from '@nestwallet/app/screens/add-wallet/quick-start/utils';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AddWalletStackParamList, 'quickStart'>;

export const QuickStart = withUserContext(_QuickStart);

function _QuickStart({ navigation }: RouteProps) {
  const { walletService } = useAppContext();
  const { accounts, refetch } = useUserContext();
  const { unlock } = useLockContext();
  const { setSelectedWallet } = useSelectedWallet();

  const upsertWalletsMutation = useUpsertWalletsMutation();

  const handleSubmit = async (input: Tuple<[string, boolean], 3>) => {
    const { evm, svm, tvm } = await generateQuickStartWallets(accounts, input);
    await unlock();
    const inputs: IUpsertWalletInput[] = [];
    if (evm) {
      await walletService.createKeyring(evm.keyring);
      inputs.push(evm.input);
    }
    if (svm) {
      await walletService.createKeyring(svm.keyring);
      inputs.push(svm.input);
    }
    if (tvm) {
      await walletService.createKeyring(tvm.keyring);
      inputs.push(tvm.input);
    }
    const wallets = await upsertWalletsMutation.mutateAsync({
      input: inputs,
    });
    await refetch();
    await setSelectedWallet(wallets.upsertWallets[0] as IWallet);
    await delay(100);
    navigation.navigate('importSignerSuccess', {
      walletType: IWalletType.SeedPhrase,
    });
  };

  return <QuickStartScreen onSubmit={handleSubmit} />;
}
