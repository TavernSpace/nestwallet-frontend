import { memo } from 'react';
import { Tuple } from '../../../common/types';
import { ActionSheet } from '../../../components/sheet';
import { PresetAmountContent } from './content';

interface PresetAmountSheetProps {
  presets: Tuple<string, 3>;
  decimals: number;
  isShowing: boolean;
  onPresetsChange: (amountPresets: Tuple<string, 3>) => Promise<void>;
  onClose: VoidFunction;
}

function arePropsEqual(
  prev: PresetAmountSheetProps,
  cur: PresetAmountSheetProps,
) {
  return (
    prev.isShowing === cur.isShowing &&
    prev.decimals === cur.decimals &&
    prev.presets[0] === cur.presets[0] &&
    prev.presets[1] === cur.presets[1] &&
    prev.presets[2] === cur.presets[2]
  );
}

export const PresetAmountSheet = memo(function (props: PresetAmountSheetProps) {
  const { presets, decimals, isShowing, onClose, onPresetsChange } = props;

  return (
    <ActionSheet isShowing={isShowing} isDetached={true} onClose={onClose}>
      <PresetAmountContent
        presets={presets}
        decimals={decimals}
        onClose={onClose}
        onPresetsChange={onPresetsChange}
      />
    </ActionSheet>
  );
}, arePropsEqual);
