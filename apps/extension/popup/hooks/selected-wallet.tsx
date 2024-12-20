import { Nullable } from '@nestwallet/app/common/types';
import { recordify } from '@nestwallet/app/common/utils/functions';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import {
  IBlockchainType,
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partition } from 'lodash';
import { useAppContext } from '../provider/application';
import { useUserContext } from '../provider/user';

export interface ISelectedWallet extends IWallet {
  selectedChainId: number;
}

export function useSelectedWallet() {
  const { walletService } = useAppContext();
  const { user, wallets } = useUserContext();
  const queryClient = useQueryClient();

  const selectedWalletQuery = useQuery({
    queryKey: ['querySelectedWallet', user.id, { wallets }],
    queryFn: async () => getSelectedWallet(wallets),
    placeholderData: (data, query) =>
      query?.queryKey[1] === user.id ? data : undefined,
    staleTime: Infinity,
  });

  const selectedWallet = loadDataFromQuery(
    selectedWalletQuery,
    (data) => data.latest,
  );
  const selectedEvmWallet = loadDataFromQuery(
    selectedWalletQuery,
    (data) => data.evm,
  );
  const selectedSvmWallet = loadDataFromQuery(
    selectedWalletQuery,
    (data) => data.svm,
  );
  const selectedTvmWallet = loadDataFromQuery(
    selectedWalletQuery,
    (data) => data.tvm,
  );

  // TODO: this is somewhat inefficient
  const getSelectedWallet = async (wallets: IWallet[]) => {
    const selectedWalletInfo = await walletService.getSelectedWallet();
    const {
      selectedWallet,
      selectedEvmWallet,
      selectedSvmWallet,
      selectedTvmWallet,
    } = getExistingSelectedWallet(wallets, selectedWalletInfo);
    const missingEvm = !selectedWalletInfo.evm || !selectedEvmWallet;
    const missingSvm = !selectedWalletInfo.svm || !selectedSvmWallet;
    const missingTvm = !selectedWalletInfo.tvm || !selectedTvmWallet;
    if (!selectedWallet) {
      // if we cannot find prevSelectedWallet then findNextSelectedWallet
      const selectedWalletCandidate = findNextSelectedWallet(wallets);
      const data = await walletService.setSelectedWallet(
        selectedWalletCandidate
          ? ({
              latest: selectedWalletCandidate,
              svm:
                selectedWalletCandidate.blockchain === IBlockchainType.Svm
                  ? selectedWalletCandidate
                  : findNextSelectedWallet(wallets, IBlockchainType.Svm),
              evm:
                selectedWalletCandidate.blockchain === IBlockchainType.Evm
                  ? selectedWalletCandidate
                  : findNextSelectedWallet(wallets, IBlockchainType.Evm),
              tvm:
                selectedWalletCandidate.blockchain === IBlockchainType.Tvm
                  ? selectedWalletCandidate
                  : findNextSelectedWallet(wallets, IBlockchainType.Tvm),
            } as SelectedWalletInfo)
          : { latest: null, svm: null, evm: null, tvm: null },
      );
      const result = getExistingSelectedWallet(wallets, data);
      return {
        latest: result.selectedWallet,
        svm: result.selectedSvmWallet,
        evm: result.selectedEvmWallet,
        tvm: result.selectedTvmWallet,
      };
    } else if (missingEvm || missingSvm || missingTvm) {
      const data = await walletService.setSelectedWallet({
        latest: selectedWallet,
        evm: missingEvm
          ? findNextSelectedWallet(wallets, IBlockchainType.Evm)
          : selectedEvmWallet,
        svm: missingSvm
          ? findNextSelectedWallet(wallets, IBlockchainType.Svm)
          : selectedSvmWallet,
        tvm: missingTvm
          ? findNextSelectedWallet(wallets, IBlockchainType.Tvm)
          : selectedTvmWallet,
      } as SelectedWalletInfo);
      const result = getExistingSelectedWallet(wallets, data);
      return {
        latest: result.selectedWallet,
        svm: result.selectedSvmWallet,
        evm: result.selectedEvmWallet,
        tvm: result.selectedTvmWallet,
      };
    }
    return {
      latest: selectedWallet,
      svm: selectedSvmWallet,
      evm: selectedEvmWallet,
      tvm: selectedTvmWallet,
    };
  };

  const setSelectedWallet = async (wallet: Nullable<IWallet>) => {
    // call refetch here to wait for any outgoing query to settle
    await selectedWalletQuery.refetch();
    const relatedSafes = wallets.filter(
      (w) =>
        w.address === wallet?.address &&
        w.type === IWalletType.Safe &&
        w.deploymentStatus === IWalletDeploymentStatus.Deployed,
    );
    const supportedChainIds = relatedSafes.map((w) => w.chainId);
    const walletInfo = wallet
      ? {
          id: wallet.id,
          address: wallet.address,
          chainId: wallet.chainId,
          type: wallet.type,
          blockchain: wallet.blockchain,
          supportedChainIds,
        }
      : null;
    const selectedWalletInfo = await walletService.getSelectedWallet();
    const selectedWallet = await walletService.setSelectedWallet(
      walletInfo
        ? ({
            latest: walletInfo,
            svm:
              walletInfo.blockchain === IBlockchainType.Svm
                ? walletInfo
                : selectedWalletInfo.svm,
            evm:
              walletInfo.blockchain === IBlockchainType.Evm
                ? walletInfo
                : selectedWalletInfo.evm,
            tvm:
              walletInfo.blockchain === IBlockchainType.Tvm
                ? walletInfo
                : selectedWalletInfo.tvm,
          } as SelectedWalletInfo)
        : { latest: null, evm: null, svm: null, tvm: null },
    );
    await queryClient.cancelQueries({
      queryKey: ['querySelectedWallet'],
    });
    await selectedWalletQuery.refetch({ cancelRefetch: true });
    return selectedWallet;
  };

  const setConnectedWallet = async (
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ) => {
    const relatedSafes = wallets.filter(
      (w) =>
        w.address === wallet?.address &&
        w.type === IWalletType.Safe &&
        w.deploymentStatus === IWalletDeploymentStatus.Deployed,
    );
    const supportedChainIds = relatedSafes.map((w) => w.chainId);
    const walletInfo = {
      id: wallet.id,
      address: wallet.address,
      chainId: wallet.chainId,
      type: wallet.type,
      blockchain: wallet.blockchain,
      supportedChainIds,
    };
    const connectionResponse = await walletService.connect(
      origin,
      title,
      imageUrl,
      chainId,
      walletInfo,
    );
    await selectedWalletQuery.refetch();
    return connectionResponse;
  };

  const deleteWallet = async (wallet: IWallet) => {
    if (selectedWallet.data?.id === wallet.id) {
      const newWallet = findNextSelectedWallet(wallets, undefined, wallet);
      await setSelectedWallet(newWallet);
    }
  };

  return {
    selectedWallet,
    selectedEvmWallet,
    selectedSvmWallet,
    selectedTvmWallet,
    setSelectedWallet,
    setConnectedWallet,
    deleteWallet,
  };
}

const findNextSelectedWallet = (
  wallets: IWallet[],
  blockchain?: IBlockchainType,
  deletedWallet?: IWallet,
): IWallet | null => {
  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.id !== deletedWallet?.id &&
      (!blockchain || blockchain === wallet.blockchain),
  );
  const [hidden, shown] = partition(filteredWallets, (wallet) => wallet.hidden);
  return shown[0] || hidden[0] || null;
};

const getExistingSelectedWallet = (
  wallets: IWallet[],
  selectedWalletInfo: SelectedWalletInfo,
) => {
  const walletMap = recordify(wallets, (wallet) => wallet.id);
  const selectedWallet = walletMap[selectedWalletInfo.latest?.id ?? ''] ?? null;
  const selectedEvmWallet = walletMap[selectedWalletInfo.evm?.id ?? ''] ?? null;
  const selectedSvmWallet = walletMap[selectedWalletInfo.svm?.id ?? ''] ?? null;
  const selectedTvmWallet = walletMap[selectedWalletInfo.tvm?.id ?? ''] ?? null;
  return {
    selectedWallet,
    selectedEvmWallet,
    selectedSvmWallet,
    selectedTvmWallet,
  };
};
