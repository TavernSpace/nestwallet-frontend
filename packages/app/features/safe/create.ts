import { getJSONRPCProvider } from '@nestwallet/app/features/evm/provider';
import {
  IUser,
  IWallet,
  IWalletDeploymentStatus,
  useDeploySafeWalletMutation,
  useUpdateWalletDeploymentStatusMutation,
  useUpsertCustomPredictedSafeWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import {
  EthersAdapter,
  SafeAccountConfig,
  encodeSetupCallData,
  getProxyFactoryContract,
  getSafeContract,
  predictSafeAddress as safePredictAddress,
} from '@safe-global/protocol-kit';
import { ContractNetworkConfig } from '@safe-global/protocol-kit/dist/src/types';
import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { Provider, ethers } from 'ethers';
import _ from 'lodash';
import { useMutationEmitter } from '../../common/hooks/query';
import { graphqlType } from '../../graphql/types';
import { AbstractEthersSigner } from '../evm/ethers/types';
import { safeProxyAddressToVersion } from './deployment';
import { decodeSafeCreationData, decodeSafeSetupData } from './encode';
import { RedeploySafeInput, SafePredictionInput } from './types';

const SAFE_LAST_VERSION = '1.3.0';

export function useDeployInactiveSafeTransaction() {
  const updateWalletDeploymentStatusMutation = useMutationEmitter(
    graphqlType.Wallet,
    useUpdateWalletDeploymentStatusMutation(),
  );
  const mutateAsync = async (
    signer: AbstractEthersSigner,
    wallet: IWallet,
    options: TransactionOptions,
  ) => {
    const nonce = await signer.getNonce(
      wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
        ? 'pending'
        : 'latest',
    );
    const txResponse = await signer.sendTransaction({
      ...options,
      data: wallet.creationData!.creationData,
      to: wallet.creationData!.factoryAddress,
      value: 0,
      nonce,
    });
    // TODO: what do to if this step fails?
    const result = await updateWalletDeploymentStatusMutation.mutateAsync({
      input: {
        id: wallet.id,
        txHash: txResponse.hash,
        deploymentStatus: IWalletDeploymentStatus.Deploying,
      },
    });
    return {
      wallet: result.updateWalletDeploymentStatus as IWallet,
      txHash: txResponse.hash,
    };
  };
  return { mutateAsync };
}

export function useMultichainDeploySafeTransaction(user: IUser) {
  const upsertCustomPredictedSafeWalletMutation =
    useUpsertCustomPredictedSafeWalletMutation();
  const deploySafeWalletMutation = useDeploySafeWalletMutation();
  const mutateAsync = async (input: RedeploySafeInput) => {
    const originalChainProvider = getJSONRPCProvider(input.originalChainId);
    const safeCreationTx = await originalChainProvider.getTransaction(
      input.creationInfo.transactionHash,
    );
    if (!safeCreationTx) {
      throw new Error("Couldn't get data from chain, please try again");
    }
    const predictedAddress = await predictSafeAddress({
      chainId: input.chainId,
      factoryAddress: input.creationInfo.factoryAddress,
      creationData: safeCreationTx.data,
    });
    const wallet = await upsertCustomPredictedSafeWalletMutation.mutateAsync({
      input: {
        color: input.color,
        name: input.name,
        organizationId: input.organizationId,
        factoryAddress: input.creationInfo.factoryAddress,
        creationData: safeCreationTx.data,
        chainId: input.chainId,
        predictedAddress,
      },
    });
    if (input.chainId !== 1 && user.safeDeployCredit > 0) {
      // If this fails for any reason (including user has no free deploys left) Safe will just be in undeployed state
      await deploySafeWalletMutation
        .mutateAsync({
          id: wallet.upsertCustomPredictedSafeWallet.id,
        })
        .catch(_.identity);
    }
    return wallet;
  };
  return { mutateAsync };
}

export async function encodeSafeCreationTx(
  provider: Provider,
  safeAccountConfig: SafeAccountConfig,
  saltNonce: string,
) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: provider,
  });
  const safeContract = await getSafeContract({
    ethAdapter,
    safeVersion: SAFE_LAST_VERSION,
  });
  const proxyContract = await getProxyFactoryContract({
    ethAdapter,
    safeVersion: SAFE_LAST_VERSION,
  });
  const to = await proxyContract.getAddress();
  const initializer = await encodeSetupCallData({
    ethAdapter,
    safeAccountConfig,
    safeContract,
  });
  const data = proxyContract.encode('createProxyWithNonce', [
    await safeContract.getAddress(),
    initializer,
    saltNonce,
  ]);
  return { data, to };
}

export async function predictSafeAddress(input: SafePredictionInput) {
  const { factoryAddress, chainId, creationData } = input;
  const { masterCopy, initializer, saltNonce } =
    decodeSafeCreationData(creationData);
  const safeAccountConfig = decodeSafeSetupData(initializer);
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: getJSONRPCProvider(chainId),
  });
  return safePredictAddress({
    ethAdapter,
    safeAccountConfig,
    safeDeploymentConfig: {
      saltNonce: ethers.toBeHex(saltNonce),
      safeVersion: safeProxyAddressToVersion(factoryAddress),
    },
    customContracts: {
      safeProxyFactoryAddress: factoryAddress,
      safeSingletonAddress: masterCopy,
    } as ContractNetworkConfig,
  });
}
