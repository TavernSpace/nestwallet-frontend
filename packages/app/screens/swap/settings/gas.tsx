import { makeLoadable } from '../../../common/utils/query';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ChainId } from '../../../features/chain';
import { GasPriceLevel } from '../../../features/proposal/types';
import {
  ICryptoBalance,
  IGasLevel,
} from '../../../graphql/client/generated/graphql';
import { GasSection } from '../../../molecules/gas/selector';
import { indexToGasLevel } from '../../../molecules/gas/utils';
import { CustomGasLevelMap } from '../../quick-trade/types';
import { useSwapGasLevel } from '../utils';

export interface GasPriceSectionProps {
  chainId: number;
  toChainId: number;
  limit: boolean;
  nativeAsset?: ICryptoBalance;
  customGasMap: CustomGasLevelMap;
  onGasChange: (gas: GasPriceLevel) => Promise<void>;
}

export function GasPriceSection(props: GasPriceSectionProps) {
  const { chainId, toChainId, nativeAsset, limit, customGasMap, onGasChange } =
    props;

  const { parsedFeeData, gasLimit, defaultGas } = useSwapGasLevel(
    chainId,
    toChainId,
    customGasMap,
    limit ? 'limit' : 'market',
    nativeAsset,
  );

  const gasMultiplier =
    chainId === ChainId.Solana ? 1.3 : chainId === ChainId.Ton ? 1 : 2;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'Priority Fee'}
      </Text>
      <GasSection
        key={chainId}
        hasBackground={true}
        editable={
          chainId !== ChainId.Ton &&
          !(chainId === ChainId.Solana && toChainId !== ChainId.Solana)
        }
        chainId={chainId}
        feeData={parsedFeeData}
        gasLimit={gasLimit}
        balance={makeLoadable(nativeAsset ? BigInt(nativeAsset.balance) : null)}
        gasMultiplier={gasMultiplier}
        sendAmount={'0'}
        defaultGasLevel={
          indexToGasLevel(customGasMap[chainId]?.index) ??
          (chainId === ChainId.Ethereum ? IGasLevel.Standard : IGasLevel.Fast)
        }
        defaultGasPriceLevel={defaultGas}
        onChange={onGasChange}
        onMissingGas={() => {}}
      />
    </View>
  );
}
