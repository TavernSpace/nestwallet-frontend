import { ActionSheet } from '@nestwallet/app/components/sheet';
import { TextButton } from '../../../components/button/text-button';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';

export function InactiveSafeSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
  onActivate: VoidFunction;
}) {
  const { isShowing, onClose, onActivate } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title='Activate your Safe'
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col space-y-4 px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          Your Safe has been imported but has not been deployed on chain yet.
          You can receive assets on your Safe, but cannot send assets or
          interact with Dapps until you activate your Safe. Safes are
          smart-contract wallets so must be deployed through a transaction. Nest
          Wallet will cover your deployment costs for every chain except
          Ethereum.
        </Text>
        <TextButton text='Activate' onPress={onActivate} />
      </View>
    </ActionSheet>
  );
}
