import {
  IBlockchainType,
  ICryptoBalance,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { isNil } from 'lodash';
import {
  loadDataFromQuery,
  makeLoadable,
  onLoadable,
} from '../../../common/utils/query';
import { ActionSheet } from '../../../components/sheet';
import { useTokenApprovalQuery } from '../../../features/crypto/approval';
import { lifiAddress } from '../../../features/evm/constants';
import { SwapRoute } from '../../../features/swap/types';
import { LedgerSwapSigningSheetContent } from './content';

interface LedgerSwapSigningSheetProps {
  isShowing: boolean;
  isFullScreen?: boolean;
  wallet: IWallet;
  route: SwapRoute;
  requiresApproval?: boolean;
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  inputAmount: string;
  onClose: VoidFunction;
  onExecute: (onApprove: VoidFunction) => Promise<string | void>;
  onCompleted: VoidFunction;
}

export function LedgerSwapSigningSheet(props: LedgerSwapSigningSheetProps) {
  const {
    isShowing,
    isFullScreen = false,
    wallet,
    requiresApproval,
    route,
    fromAsset,
    toAsset,
    inputAmount,
    onClose,
    onExecute,
    onCompleted,
  } = props;

  const tokenApprovalQuery = useTokenApprovalQuery(
    {
      address: wallet.address,
      chainId: fromAsset.chainId,
      tokenAddress: fromAsset.address,
      approvalAddress: lifiAddress,
    },
    {
      enabled:
        requiresApproval === undefined &&
        wallet.blockchain === IBlockchainType.Evm,
    },
  );
  const isApproved = isNil(requiresApproval)
    ? loadDataFromQuery(
        tokenApprovalQuery,
        (amount) => amount >= BigInt(route.data.fromAmount),
      )
    : makeLoadable(!requiresApproval);

  // TODO: make this full screen and uncancellable for bridge screen
  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      gestureEnabled={false}
      isFullHeight={isFullScreen}
      isDetached={!isFullScreen}
    >
      {onLoadable(isApproved)(
        () => null,
        () => null,
        (approved) => (
          <LedgerSwapSigningSheetContent
            requiresApproval={!approved}
            isFullScreen={isFullScreen}
            fromAsset={fromAsset}
            toAsset={toAsset}
            inputAmount={inputAmount}
            outputAmount={route.data.toAmount}
            onClose={onClose}
            onExecute={onExecute}
            onCompleted={onCompleted}
          />
        ),
      )}
    </ActionSheet>
  );
}
