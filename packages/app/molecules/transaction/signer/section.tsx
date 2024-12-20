import { TransactionSignerItem } from '.';
import { View } from '../../../components/view';
import { useConfirmedSafeSignerInfo } from '../../../features/proposal/signer';
import {
  IConfirmation,
  IContact,
  IWallet,
} from '../../../graphql/client/generated/graphql';

export function ConfirmedSafeSignersSection(props: {
  confirmations: IConfirmation[];
  wallets: IWallet[];
  contacts: IContact[];
  onSignerPressed?: (text: string) => void;
}) {
  const { confirmations, contacts, wallets, onSignerPressed } = props;

  const signerInfos = useConfirmedSafeSignerInfo(
    wallets,
    contacts,
    confirmations,
  );

  return (
    <View className='bg-card mx-4 flex flex-col rounded-2xl'>
      {signerInfos.map((signerInfo, index) => (
        <View key={index}>
          <TransactionSignerItem
            signerInfo={signerInfo}
            onSignerPressed={onSignerPressed}
          />
        </View>
      ))}
    </View>
  );
}
