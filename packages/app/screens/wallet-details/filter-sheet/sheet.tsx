import { ActionSheet } from '../../../components/sheet';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { FilterContent } from './content';

interface FilterSheetProps {
  blockchain: IBlockchainType;
  chainId: number;
  isShowing: boolean;
  onSelectChain: (chainId: number) => void;
  onClose: VoidFunction;
}

export function FilterSheet(props: FilterSheetProps) {
  const { blockchain, chainId, isShowing, onSelectChain, onClose } = props;

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      hasBottomInset={false}
      hasTopInset
      isFullHeight
    >
      <FilterContent
        blockchain={blockchain}
        chainId={chainId}
        onSelectChain={onSelectChain}
        onClose={onClose}
      />
    </ActionSheet>
  );
}
