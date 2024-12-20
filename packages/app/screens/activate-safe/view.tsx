import { useEffect, useMemo, useState } from 'react';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
  Loadable,
  VoidPromiseFunction,
} from '../../common/types';
import { id } from '../../common/utils/functions';
import { mapLoadable } from '../../common/utils/query';
import { TextButton } from '../../components/button/text-button';
import { ScrollView } from '../../components/scroll';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { parseError } from '../../features/errors';
import { defaultGasMultiplier } from '../../features/proposal/fee';
import {
  useLoadExecutorBalances,
  useSafeSignerInfo,
  useWithExecutor,
} from '../../features/proposal/signer';
import { GasPriceLevel } from '../../features/proposal/types';
import { decodeSafeInfoFromCreationData } from '../../features/safe/encode';
import {
  IContact,
  IFeeData,
  IUser,
  IWallet,
  IWalletDeploymentStatus,
} from '../../graphql/client/generated/graphql';
import { GasSection } from '../../molecules/gas/selector';
import {
  GeneralInfoCard,
  UndeployedSafeInfoCard,
} from '../../molecules/transaction/card';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { localization } from './localization';

interface ActivateSafeViewProps {
  user: IUser;
  wallet: IWallet;
  executor?: ISignerWallet | null;
  executors: IWalletWithLoadableBalance[];
  signers: ISignerWallet[];
  contacts: Loadable<IContact[]>;
  gasLimit: Loadable<bigint>;
  feeData: Loadable<IFeeData>;
  onCreateSafe: VoidFunction;
  onFreeSafe: VoidPromiseFunction;
  refetchUser: VoidPromiseFunction;
  onChangeGasData: (gasLevel: GasPriceLevel, gasLimits: bigint[]) => void;
  onSelectExecutor: (executor: ISignerWallet | null) => void;
  onSelectExecutorPress: VoidFunction;
}

export function ActivateSafeView(props: ActivateSafeViewProps) {
  const {
    user,
    wallet,
    executor,
    executors,
    signers,
    contacts,
    gasLimit,
    feeData,
    onCreateSafe,
    onFreeSafe,
    refetchUser,
    onSelectExecutorPress,
    onSelectExecutor,
    onChangeGasData,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();
  const [loading, setLoading] = useState(false);
  const [missingGas, setMissingGas] = useState(false);

  const canRelay = user.safeDeployCredit > 0 && wallet.chainId !== 1;
  const creationData = wallet.creationData!.creationData;
  const executorWithBalance = executors.find(
    (exe) => exe.wallet.id === executor?.id,
  );

  const safeInfo = useMemo(
    () => decodeSafeInfoFromCreationData(creationData),
    [creationData],
  );
  const signerInfo = useSafeSignerInfo(
    signers,
    contacts.data ?? [],
    safeInfo.owners,
  );

  useWithExecutor(executor, executors, !canRelay, onSelectExecutor);
  useEffect(() => {
    if (canRelay) {
      onSelectExecutor(null);
    }
  }, []);

  const handleMissingGas = (missingGas: boolean) => {
    setMissingGas(missingGas);
  };

  const handleFreeSafe = async () => {
    try {
      setLoading(true);
      await onFreeSafe();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.safeDeploySuccess[language],
      });
    } catch (err) {
      // TODO: this should be done in upper layer
      const errors = parseError(err);
      const noCreditsError = 'You have reached the limit of free Safes';
      if (errors.message === noCreditsError) {
        await refetchUser().catch(id);
        onCreateSafe();
      } else {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: errors.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadingExecutors = useLoadExecutorBalances(executors);

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between'>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex flex-col'>
            {user.safeDeployCredit > 0 &&
              wallet.chainId !== 1 &&
              wallet.deploymentStatus ===
                IWalletDeploymentStatus.Undeployed && (
                <View className='w-full px-4'>
                  <View className='bg-success/10 w-full items-center rounded-full py-2'>
                    <Text className='text-success font-bold'>
                      {`${user.safeDeployCredit} ${localization.numberOfFreeSafesRemaining[language]}`}
                    </Text>
                  </View>
                </View>
              )}
            <View className='flex flex-col space-y-3 pt-2'>
              <GeneralInfoCard
                className='px-4'
                wallet={wallet}
                chainId={wallet.chainId}
                type='proposal'
                initialCollapsed={false}
              />
              <UndeployedSafeInfoCard
                className='px-4'
                signers={signerInfo}
                threshold={safeInfo.threshold}
                executor={executor}
                onExecutorPress={
                  wallet.deploymentStatus !== IWalletDeploymentStatus.Undeployed
                    ? undefined
                    : onSelectExecutorPress
                }
                executionState={
                  !canRelay && loadingExecutors.loading ? 'loading' : 'valid'
                }
              />
            </View>
          </View>
        </ScrollView>

        {wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed && (
          <View className='mt-4 space-y-2 px-4 pt-2'>
            {executorWithBalance && (
              <GasSection
                hasBackground={true}
                chainId={wallet.chainId}
                feeData={feeData}
                gasLimit={gasLimit}
                balance={mapLoadable(executorWithBalance.balance)((data) =>
                  BigInt(data),
                )}
                sendAmount={'0x0'}
                gasMultiplier={defaultGasMultiplier}
                onChange={onChangeGasData}
                onMissingGas={handleMissingGas}
              />
            )}
            <TextButton
              onPress={executor === null ? handleFreeSafe : onCreateSafe}
              disabled={
                loading || (executor !== null && (missingGas || !executor))
              }
              loading={loading}
              text={localization.createSafeButton[language]}
            />
          </View>
        )}
      </View>
    </ViewWithInset>
  );
}
