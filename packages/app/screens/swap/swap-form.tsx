import { ethers } from 'ethers';
import { useState } from 'react';
import { Loadable } from '../../common/types';
import {
  makeLoadable,
  makeLoadableError,
  mapLoadable,
} from '../../common/utils/query';
import { InlineErrorTooltip } from '../../components/input-error';
import { View } from '../../components/view';
import { SwapRoute } from '../../features/swap/types';
import {
  getSwapAssetError,
  getSwapAssetInputError,
} from '../../features/swap/utils';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IInteractedAddress,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { SpotForm } from '../quick-trade/types';
import { SwapInput } from './swap-input';

interface SwapFormProps {
  formik: SpotForm;
  wallet: IWallet;
  cryptoBalances: Loadable<ICryptoBalance[]>;
  swappableTokens: Loadable<ICryptoBalance[]>;
  contacts: Loadable<IContact[]>;
  interactions: Loadable<IInteractedAddress[]>;
  wallets: IWallet[];
  route: Loadable<SwapRoute | null>;
  externalError?: string;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
  onToggleLock?: (enabled: boolean) => void;
}

export function SwapForm(props: SwapFormProps) {
  const {
    formik,
    contacts,
    interactions,
    wallets,
    wallet,
    cryptoBalances,
    swappableTokens,
    route,
    externalError,
    onAddContact,
    onToggleLock,
  } = props;

  const [touched, setTouched] = useState(false);

  const input = formik.values;
  const inputError = getSwapAssetInputError(input);
  const error = getSwapAssetError(input, route) || externalError;
  const toAmount = inputError
    ? makeLoadableError()
    : input.amount === ''
    ? makeLoadable('')
    : mapLoadable(route)((route) => {
        const toAmount = route?.data.toAmount;
        return toAmount && input.toAsset
          ? ethers.formatUnits(toAmount, input.toAsset.tokenMetadata.decimals)
          : '';
      });

  const handleAmountChange = (amount: string) => {
    formik.setFieldValue('amount', amount);
    setTouched(true);
  };

  return (
    <View className='flex flex-col'>
      <SwapInput
        formik={formik}
        wallet={wallet}
        toAmount={toAmount}
        cryptoBalances={cryptoBalances}
        swappable={swappableTokens}
        computeToAmount={!!input.toAccount && !!input.fromAsset}
        onChangeAmount={handleAmountChange}
        contacts={contacts}
        interactions={interactions}
        wallets={wallets}
        route={route}
        onToggleLock={onToggleLock}
        onAddContact={onAddContact}
      />
      {touched && error && (
        <View className='flex w-full flex-row items-center pt-2'>
          <InlineErrorTooltip isEnabled={!!error} errorText={error} />
        </View>
      )}
    </View>
  );
}
