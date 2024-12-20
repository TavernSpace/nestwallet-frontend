import { ethers } from 'ethers';
import { useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { formatMoney } from '../../../common/format/number';
import { AssetTransfer, RecipientAccount } from '../../../common/types';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { InlineErrorTooltip } from '../../../components/input-error';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { RawTextInput, TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ChainId } from '../../../features/chain';
import {
  getMaxBalanceMinusGas,
  validDecimalAmount,
} from '../../../features/crypto/transfer';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { ICryptoBalance } from '../../../graphql/client/generated/graphql';
import { CryptoListItem } from '../../../molecules/select/asset-select/crypto-list-item';
import { getAmountUSD } from '../utils';
import { RecipientView } from './recipient-input';

export function SendTokenForm(props: {
  asset: ICryptoBalance;
  recipient: RecipientAccount;
  onChangeAsset: VoidFunction;
  onChangeRecipient: VoidFunction;
  onAddTransfer: (transfer: AssetTransfer) => Promise<void>;
}) {
  const { asset, recipient, onChangeAsset, onAddTransfer, onChangeRecipient } =
    props;
  const { top } = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  const amountUSD = getAmountUSD(asset, amount);
  const validNumber = validDecimalAmount(amount, asset.tokenMetadata.decimals);
  const cryptoBalance = ethers.formatUnits(
    asset.balance,
    asset.tokenMetadata.decimals,
  );
  const hasInsufficientFunds =
    validNumber !== '' && parseFloat(validNumber) > parseFloat(cryptoBalance);
  const isInvalid =
    hasInsufficientFunds || amount === '' || parseFloat(amount) === 0;

  const handleSubmit = async () => {
    if (isInvalid || !amountUSD) return;
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    onAddTransfer({
      asset,
      recipient: recipient.address,
      value: amount,
      fiatValue: amountUSD,
      comment: comment || undefined,
    });
  };

  const handleAmountChange = (value: string) => {
    const validNumber = validDecimalAmount(value, asset.tokenMetadata.decimals);
    setAmount(validNumber);
  };

  const handleMax = () => {
    handleAmountChange(getMaxBalanceMinusGas(asset, 'send'));
  };

  return (
    <View className='flex h-full w-full flex-col justify-between px-4'>
      <ScrollView
        keyboardShouldPersistTaps={
          Platform.OS === 'web' ? undefined : 'handled'
        }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <View className='flex flex-1 flex-col justify-between'>
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
                <View className='flex flex-row items-center space-x-1'>
                  <Text className='text-text-primary text-sm'>=</Text>
                  <Text className='text-text-primary text-sm font-medium'>
                    {amountUSD ? formatMoney(parseFloat(amountUSD)) : '$0'}
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
              {hasInsufficientFunds && (
                <View className='mb-2 flex w-full flex-row items-center'>
                  <InlineErrorTooltip
                    errorText={'Insufficient funds'}
                    isEnabled={true}
                  />
                </View>
              )}
              <View className='bg-card overflow-hidden rounded-2xl'>
                <CryptoListItem balance={asset} onPress={onChangeAsset} />
              </View>
            </View>
          </View>
          {asset.chainId === ChainId.Ton && (
            <View className='mt-2'>
              <TextInput
                inputProps={{
                  id: 'comment-input',
                  multiline: true,
                  placeholder: 'Optional transaction memo',
                  textAlignVertical: 'top',
                  numberOfLines: 2,
                  value: comment,
                  style: { minHeight: 80 },
                  onChangeText: (text) => setComment(text),
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <TextButton
        className='mt-2'
        onPress={handleSubmit}
        text={'Continue'}
        disabled={isInvalid}
      />
    </View>
  );
}
