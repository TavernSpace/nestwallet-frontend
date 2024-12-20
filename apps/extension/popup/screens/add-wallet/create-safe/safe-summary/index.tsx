import { id } from '@nestwallet/app/common/utils/functions';
import { getJSONRPCProvider } from '@nestwallet/app/features/evm/provider';
import {
  encodeSafeCreationTx,
  predictSafeAddress,
} from '@nestwallet/app/features/safe/create';
import {
  IWallet,
  useDeploySafeWalletMutation,
  useUpsertPredictedSafeWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { CreateSafeSafeSummaryScreen } from '@nestwallet/app/screens/add-wallet/create-safe/safe-summary/screen';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import { useSelectedWallet } from '../../../../hooks/selected-wallet';
import { CreateSafeStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';
import { EditNameSheet } from './edit-name-sheet';
import { EditThresholdSheet } from './edit-threshold-sheet';

type RouteProps = StackScreenProps<CreateSafeStackParamList, 'safeSummary'>;

export const CreateSafeSafeSummary = withUserContext(_CreateSafeSafeSummary);

function _CreateSafeSafeSummary({ route }: RouteProps) {
  const { signers, chainId, nonce, metadata } = route.params;
  const { user, accounts, refetch } = useUserContext();
  const { setSelectedWallet } = useSelectedWallet();
  const navigation = useNavigation();

  const [showThresholdSheet, setShowThresholdSheet] = useState(false);
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [threshold, setThreshold] = useState(Math.ceil(signers.length / 2));
  const [name, setName] = useState(metadata.name);

  const upsertPredictedSafeWalletMutation =
    useUpsertPredictedSafeWalletMutation();
  const deploySafeWalletMutation = useDeploySafeWalletMutation();

  const defaultOrganization = accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const input = {
    organizationId: defaultOrganization.id,
    name,
    color: undefined,
    chainId,
    signers,
    threshold,
    saltNonce: nonce,
  };

  const handleCreateSafe = async () => {
    const owners = input.signers.map((signer) => signer.address);
    const { to, data } = await encodeSafeCreationTx(
      getJSONRPCProvider(input.chainId),
      { owners, threshold: input.threshold },
      input.saltNonce,
    );
    const predictedAddress = await predictSafeAddress({
      chainId: input.chainId,
      factoryAddress: to,
      creationData: data,
    });
    const wallet = await upsertPredictedSafeWalletMutation.mutateAsync({
      input: {
        color: input.color,
        name: input.name,
        organizationId: input.organizationId,
        owners: input.signers.map((signer) => signer.address),
        threshold,
        chainId,
        nonce,
        predictedAddress,
      },
    });
    if (chainId !== 1 && user.safeDeployCredit > 0) {
      // If this fails for any reason (including user has no free deploys left) Safe will just be in undeployed state
      await deploySafeWalletMutation
        .mutateAsync({
          id: wallet.upsertPredictedSafeWallet.id,
        })
        .catch(id);
    }
    await refetch();
    await setSelectedWallet(wallet.upsertPredictedSafeWallet as IWallet);
    navigation.navigate('app', {
      screen: 'walletDetails',
      params: { walletId: wallet.upsertPredictedSafeWallet.id },
    });
  };

  const handleEditThreshold = () => {
    setShowThresholdSheet(true);
  };

  const handleCloseThreshold = () => {
    setShowThresholdSheet(false);
  };

  const handleChangeThreshold = (threshold: number) => {
    setThreshold(threshold);
  };

  const handleEditName = () => {
    setShowNameSheet(true);
  };

  const handleCloseName = () => {
    setShowNameSheet(false);
  };

  const handleChangeName = (name: string) => {
    setName(name);
  };

  return (
    <>
      <CreateSafeSafeSummaryScreen
        input={input}
        onCreateSafe={handleCreateSafe}
        onEditThreshold={handleEditThreshold}
        onEditName={handleEditName}
      />
      <EditThresholdSheet
        signerCount={signers.length}
        threshold={threshold}
        isShowing={showThresholdSheet}
        onClose={handleCloseThreshold}
        onChangeThreshold={handleChangeThreshold}
      />
      <EditNameSheet
        name={name}
        isShowing={showNameSheet}
        onClose={handleCloseName}
        onChangeName={handleChangeName}
      />
    </>
  );
}
