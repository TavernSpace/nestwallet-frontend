import { SafeCreationInfoResponse } from '@safe-global/api-kit';
import { loadDataFromQuery } from '../../../common/utils/query';
import { useSafeCreationInfoQuery } from '../../../features/safe/queries';
import {
  IWallet,
  IWalletDeploymentStatus,
} from '../../../graphql/client/generated/graphql';
import { MultichainDeployInput } from '../schema';
import { MultichainDeployScreen } from './screen';

interface MultichainDeployChainQueryProps {
  wallet: IWallet;
  onSubmit: (
    input: MultichainDeployInput,
    creationInfo: SafeCreationInfoResponse,
  ) => Promise<void>;
}

export function MultichainDeployChainWithQuery(
  props: MultichainDeployChainQueryProps,
) {
  const { wallet, onSubmit } = props;

  // TODO: maybe we can do a batch safe info query here to check which chains already have
  // safes deployed
  const safeCreationInfoQuery = useSafeCreationInfoQuery(
    wallet.chainId,
    wallet.address,
    { enabled: wallet.deploymentStatus === IWalletDeploymentStatus.Deployed },
  );
  const safeCreationInfo = loadDataFromQuery(safeCreationInfoQuery);

  return (
    <MultichainDeployScreen
      wallet={wallet}
      safeCreationInfo={safeCreationInfo}
      onSubmit={onSubmit}
    />
  );
}
