import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { useCopy } from '../../../../common/hooks/copy';
import {
  AssetTransfer,
  ISignerWallet,
  Loadable,
  VoidPromiseFunction,
} from '../../../../common/types';
import { adjust } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { TextButton } from '../../../../components/button/text-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { colors } from '../../../../design/constants';
import {
  IContact,
  IOrganization,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { TransferReviewItem } from '../transfer-review-item';
import { WalletCard } from '../wallet-card';

interface SafeTransferReviewScreenProps {
  transfers: AssetTransfer[];
  wallet: IWallet;
  organization: IOrganization;
  signers: ISignerWallet[];
  contacts: Loadable<IContact[]>;
  onSubmit: VoidPromiseFunction;
  onDeleteTransfer: (transfer: AssetTransfer) => void;
  onAddTransfer: VoidFunction;
}

export function SafeTransferReviewScreen(props: SafeTransferReviewScreenProps) {
  const {
    transfers,
    wallet,
    signers,
    organization,
    contacts,
    onSubmit,
    onAddTransfer,
    onDeleteTransfer,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { copy } = useCopy('Copied address!');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Error creating proposal',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<
    AssetTransfer,
    {
      contacts: IContact[];
      wallets: IWallet[];
      transfers: AssetTransfer[];
    }
  >) => {
    return (
      <TransferReviewItem
        transfer={item}
        wallets={extraData!.wallets}
        contacts={extraData!.contacts}
        signers={signers}
        copy={copy}
        onDeleteTransfer={
          extraData!.transfers.length > 1 ? onDeleteTransfer : undefined
        }
      />
    );
  };

  const AddTransferItem = () => (
    <BaseButton className='overflow-hidden' onPress={onAddTransfer}>
      <View className='mt-2 flex flex-row items-center justify-center space-x-2'>
        <FontAwesomeIcon
          icon={faPlus}
          size={adjust(16, 2)}
          color={colors.textPrimary}
        />
        <Text className='text-text-primary text-sm font-bold'>
          {'Add Another'}
        </Text>
      </View>
    </BaseButton>
  );

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full w-full flex-col justify-between'>
        <View className='flex flex-1 flex-col px-4'>
          <WalletCard wallet={wallet} />
          <View className='flex flex-1'>
            <FlatList
              data={transfers}
              extraData={{
                wallets: organization.wallets,
                contacts: contacts.data ?? [],
                transfers,
              }}
              estimatedItemSize={adjust(64)}
              renderItem={renderItem}
              ListFooterComponent={AddTransferItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </View>
        <View className='px-4 pt-4'>
          <TextButton
            text='Confirm'
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
