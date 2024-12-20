import { faAnglesDown } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Loadable } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { SwapRoute } from '../../features/swap/types';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IInteractedAddress,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { SpotForm } from '../quick-trade/types';
import { FromSection } from './from-asset';
import { ToSection } from './to-asset';

export function SwapInput(props: {
  formik: SpotForm;
  wallet: IWallet;
  toAmount: Loadable<string>;
  cryptoBalances: Loadable<ICryptoBalance[]>;
  swappable: Loadable<ICryptoBalance[]>;
  computeToAmount: boolean;
  contacts: Loadable<IContact[]>;
  interactions: Loadable<IInteractedAddress[]>;
  wallets: IWallet[];
  route: Loadable<SwapRoute | null>;
  onChangeAmount: (amount: string) => void;
  onToggleLock?: (enabled: boolean) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
}) {
  const {
    formik,
    wallet,
    toAmount,
    cryptoBalances,
    swappable,
    computeToAmount,
    wallets,
    contacts,
    interactions,
    route,
    onChangeAmount,
    onToggleLock,
    onAddContact,
  } = props;

  const [percentage, setPercentage] = useState(0);
  const [localAmount, setLocalAmount] = useState('');

  const handleChangeLocalAmount = (amount: string) => {
    setLocalAmount(amount);
  };

  const handleChangePercentage = (percentage: number) => {
    setPercentage(percentage);
  };

  return (
    <View className='w-full'>
      <View className='flex flex-col items-center space-y-2'>
        <FromSection
          className='w-full'
          formik={formik}
          wallet={wallet}
          cryptoBalances={cryptoBalances}
          amount={localAmount}
          percentage={percentage}
          onChangeLocalAmount={handleChangeLocalAmount}
          onChangePercentage={handleChangePercentage}
          onChangeAmount={onChangeAmount}
        />
        <View className='flex w-full flex-row items-center justify-center space-x-2 px-2 py-1'>
          <View className='bg-card-highlight h-[1px] flex-1' />
          <View className='bg-background h-4 w-4 rounded-full pt-0.5'>
            <FontAwesomeIcon
              icon={faAnglesDown}
              size={adjust(14, 2)}
              color={colors.cardHighlight}
            />
          </View>
          <View className='bg-card-highlight h-[1px] flex-1' />
        </View>
        <ToSection
          className='w-full'
          formik={formik}
          wallet={wallet}
          amount={toAmount}
          swappable={swappable}
          computeToAmount={computeToAmount}
          contacts={contacts}
          wallets={wallets}
          interactions={interactions}
          route={route}
          onToggleLock={onToggleLock}
          onChangeLocalAmount={handleChangeLocalAmount}
          onChangePercentage={handleChangePercentage}
          onAddContact={onAddContact}
        />
      </View>
    </View>
  );
}
