import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { Platform } from 'react-native';
import { delay } from '../../../common/api/utils';
import { TextButton } from '../../../components/button/text-button';
import { ScrollView } from '../../../components/scroll';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { ChainId } from '../../../features/chain';
import { GasPriceLevel } from '../../../features/proposal/types';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useAudioContext } from '../../../provider/audio';
import { ApprovalSection, ApprovalSectionProps } from './approval';
import { GasPriceSection, GasPriceSectionProps } from './gas';
import { LimitSection, LimitSectionProps } from './limit';
import { MevSection, MevSectionProps } from './mev';
import { SwapSettingsSchema } from './schema';
import { SimulateSection, SimulateSectionProps } from './simulate';
import { SlippageSection, SlippageSectionProps } from './slippage';
import { TipSection, TipSectionProps } from './tip';

export interface SwapSettingsInput {
  slippage: string;
  tip: string;
  mev: boolean;
  infiniteApproval: boolean;
  chainId: number;
  simulate: boolean;
  gas?: GasPriceLevel;
}

export interface SwapSettingsContentProps {
  type: 'trade' | 'bridge';
  chainId: number;
  toChainId: number;
  offset: number;
  slippageProps: Omit<
    SlippageSectionProps,
    'slippageError' | 'onSlippageChange'
  >;
  simulateProps: Omit<SimulateSectionProps, 'onSimulateToggle'>;
  mevProps: Omit<MevSectionProps, 'disabled' | 'onMevToggle'>;
  tipProps: Omit<TipSectionProps, 'tipError' | 'onTipChange' | 'mev'>;
  approvalProps: Omit<ApprovalSectionProps, 'onInfiniteApprovalToggle'>;
  gasProps: Omit<GasPriceSectionProps, 'onGasChange'>;
  limitProps?: LimitSectionProps;
  onSettingsChange: (input: SwapSettingsInput) => Promise<void>;
  onClose: VoidFunction;
}

export function SwapSettingsContent(props: SwapSettingsContentProps) {
  const {
    type,
    chainId,
    toChainId,
    offset,
    slippageProps,
    simulateProps,
    mevProps,
    tipProps,
    approvalProps,
    gasProps,
    limitProps,
    onSettingsChange,
    onClose,
  } = props;
  const { pressSound } = useAudioContext().sounds;
  const { bottom } = useSafeAreaInsets();

  const [expiration, setExpiration] = useState(limitProps?.expiration);

  const handleSubmit = async (input: SwapSettingsInput) => {
    await delay(50);
    await onSettingsChange(input);
    if (limitProps) {
      limitProps.onDateChange(
        expiration ? DateTime.fromSeconds(expiration) : undefined,
      );
    }
    onClose();
  };

  const settingsForm = useFormik<SwapSettingsInput>({
    initialValues: {
      slippage: slippageProps.slippage.toString(),
      infiniteApproval: approvalProps.infiniteApproval,
      mev: mevProps.mev,
      tip: tipProps.tip ? ethers.formatUnits(tipProps.tip, 9) : '',
      chainId,
      simulate: simulateProps.simulate,
    },
    validationSchema: SwapSettingsSchema,
    onSubmit: handleSubmit,
  });

  const mevSupported =
    chainId === ChainId.Ethereum ||
    (chainId === ChainId.Solana && toChainId === ChainId.Solana);
  const approvalSupported =
    chainId !== ChainId.Solana && chainId !== ChainId.Ton;
  const input = settingsForm.values;
  const tipMevError =
    chainId === ChainId.Solana &&
    input.mev &&
    (input.tip === '' || parseFloat(input.tip) === 0);

  return (
    <ViewWithInset
      className='flex h-full w-full flex-col'
      keyboardOffset={-offset}
      shouldAvoidKeyboard={Platform.OS === 'ios'}
    >
      <ActionSheetHeader
        title={type === 'bridge' ? 'Bridge Settings' : 'Trade Settings'}
        closeSound={pressSound}
        onClose={onClose}
        type='fullscreen'
      />
      <ScrollView
        className='-mt-3'
        keyboardShouldPersistTaps={
          Platform.OS !== 'web' ? 'handled' : undefined
        }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 16,
        }}
      >
        {!gasProps.limit && (
          <SlippageSection
            slippage={input.slippage}
            slippageDefaults={slippageProps.slippageDefaults}
            slippageError={settingsForm.errors.slippage}
            onSlippageChange={async (slippage) => {
              settingsForm.setFieldValue('slippage', slippage);
            }}
          />
        )}
        <GasPriceSection
          chainId={chainId}
          toChainId={toChainId}
          limit={gasProps.limit}
          nativeAsset={gasProps.nativeAsset}
          customGasMap={gasProps.customGasMap}
          onGasChange={async (gas) => {
            settingsForm.setFieldValue('gas', gas);
          }}
        />
        {chainId === ChainId.Solana &&
          toChainId === ChainId.Solana &&
          !gasProps.limit && (
            <TipSection
              tip={input.tip}
              mev={input.mev}
              tipError={settingsForm.errors.tip}
              onTipChange={async (tip) => {
                settingsForm.setFieldValue('tip', tip);
              }}
            />
          )}
        {mevSupported && !gasProps.limit && (
          <MevSection
            mev={input.mev}
            disabled={
              chainId === ChainId.Solana &&
              (!input.tip || parseFloat(input.tip) === 0)
            }
            onMevToggle={async (mev) => {
              settingsForm.setFieldValue('mev', mev);
            }}
          />
        )}
        {chainId === ChainId.Solana && !gasProps.limit && (
          <SimulateSection
            simulate={input.simulate}
            onSimulateToggle={async (simulate) => {
              settingsForm.setFieldValue('simulate', simulate);
            }}
          />
        )}
        {gasProps.limit && limitProps && (
          <LimitSection
            expiration={expiration}
            nativeAsset={gasProps.nativeAsset}
            onDateChange={(exp) => {
              setExpiration(exp?.toSeconds());
            }}
          />
        )}
        {approvalSupported && !gasProps.limit && (
          <ApprovalSection
            infiniteApproval={input.infiniteApproval}
            onInfiniteApprovalToggle={async (infinite) => {
              settingsForm.setFieldValue('infiniteApproval', infinite);
            }}
          />
        )}
      </ScrollView>
      <View className='w-full px-4' style={{ paddingBottom: bottom }}>
        <TextButton
          pressSound={pressSound}
          text='Confirm'
          onPress={settingsForm.submitForm}
          loading={settingsForm.isSubmitting}
          disabled={
            !!settingsForm.errors.infiniteApproval ||
            !!settingsForm.errors.mev ||
            !!settingsForm.errors.slippage ||
            !!settingsForm.errors.tip ||
            settingsForm.isSubmitting ||
            tipMevError
          }
        />
      </View>
    </ViewWithInset>
  );
}
