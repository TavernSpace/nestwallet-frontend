import { useState } from 'react';
import { Platform } from 'react-native';
import { AssetTransfer, RecipientAccount } from '../../../common/types';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { InlineErrorTooltip } from '../../../components/input-error';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { RawTextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import {
  getMaxBalanceMinusGas,
  validDecimalAmount,
} from '../../../features/crypto/transfer';
import { INftBalance } from '../../../graphql/client/generated/graphql';
import { NFTListItem } from '../../../molecules/select/asset-select/nft-list-item';
import { RecipientView } from './recipient-input';

export function SendNFTForm(props: {
  asset: INftBalance;
  recipient: RecipientAccount;
  onChangeAsset: VoidFunction;
  onChangeRecipient: VoidFunction;
  onAddTransfer: (transfer: AssetTransfer) => Promise<void>;
}) {
  const { asset, recipient, onChangeAsset, onChangeRecipient, onAddTransfer } =
    props;

  const [amount, setAmount] = useState<string>('1');

  const handleSubmit = async () => {
    onAddTransfer({
      asset,
      recipient: recipient.address,
      value: amount,
    });
  };

  const handleAmountChange = (value: string) => {
    const validNumber = validDecimalAmount(value, 0);
    setAmount(validNumber);
  };

  const handleMax = () => {
    handleAmountChange(getMaxBalanceMinusGas(asset, 'send'));
  };

  const hasInsufficientNFTs =
    amount === '' ? false : BigInt(amount) > BigInt(asset.balance);

  return (
    <View className='flex h-full w-full flex-col justify-between px-4'>
      <ScrollView
        keyboardShouldPersistTaps={
          Platform.OS === 'web' ? undefined : 'handled'
        }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className='flex flex-col space-y-2'>
          <RecipientView
            recipient={recipient}
            chainId={asset.chainId}
            onPress={onChangeRecipient}
          />
          <View className='flex flex-col py-4'>
            <View className='flex flex-row items-center justify-center'>
              <RawTextInput
                className='text-text-primary w-full flex-1 bg-transparent text-center text-6xl font-bold outline-none'
                id={'amount'}
                placeholder='0'
                placeholderTextColor={colors.textPlaceholder}
                onChangeText={handleAmountChange}
                value={amount ?? ''}
                onSubmitEditing={handleSubmit}
                lineHeightAdjustment={10}
                autoComplete='off'
                inputMode='decimal'
              />
            </View>
            <View className='mt-2 flex w-full flex-row justify-center'>
              <View className='flex flex-row items-center space-x-2'>
                <Text className='text-text-secondary text-sm font-medium'>
                  {`${amount || '0'}/${asset.balance}`}
                </Text>
                <BaseButton
                  className='ml-2 overflow-hidden'
                  onPress={handleMax}
                >
                  <View className='bg-card-highlight items-center justify-center rounded-full px-3 py-1'>
                    <Text className='text-text-primary text-right text-sm font-medium'>
                      Max
                    </Text>
                  </View>
                </BaseButton>
              </View>
            </View>
          </View>
          <View className='flex flex-col'>
            {hasInsufficientNFTs && (
              <View className='mb-2 flex w-full flex-row items-center'>
                <InlineErrorTooltip
                  errorText={'Insufficient NFTs'}
                  isEnabled={true}
                />
              </View>
            )}
            <View className='bg-card overflow-hidden rounded-2xl'>
              <NFTListItem
                chainId={asset.chainId}
                balance={asset}
                onPress={onChangeAsset}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <TextButton
        onPress={handleSubmit}
        text={'Continue'}
        disabled={hasInsufficientNFTs || amount === '0' || amount === ''}
      />
    </View>
  );
}
