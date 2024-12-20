import { ActionSheet } from '../../../components/sheet';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { FilterContent } from './content';

interface FilterSheetProps {
  isShowing: boolean;
  blockchain: IBlockchainType;
  onSelectChain: (chainId: number) => void;
  onClose: VoidFunction;
}

export function FilterSheet(props: FilterSheetProps) {
  const { isShowing, blockchain, onSelectChain, onClose } = props;

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      hasBottomInset={false}
      hasTopInset={true}
      isFullHeight={true}
    >
      <FilterContent
        onSelectChain={onSelectChain}
        blockchain={blockchain}
        onClose={onClose}
      />
    </ActionSheet>
  );
}
