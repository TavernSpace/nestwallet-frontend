import {
  IGasPriceClassicLevel,
  IGasPriceEip1559Level,
  IGasType,
} from '../../graphql/client/generated/graphql';

// This is hacky but we also use this for Solana and TON
export interface GasPriceClassicLevel
  extends Omit<
    IGasPriceClassicLevel,
    'gasLimit' | 'gasPrice' | 'estimatedGasPrice'
  > {
  estimatedGasPrice: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  type: IGasType.Classic;
}

export interface GasPriceEip1559Level
  extends Omit<
    IGasPriceEip1559Level,
    | 'gasLimit'
    | 'maxFeePerGas'
    | 'maxPriorityFeePerGas'
    | 'lastBaseFeePerGas'
    | 'estimatedGasPrice'
  > {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  lastBaseFeePerGas: bigint;
  estimatedGasPrice: bigint;
  gasLimit: bigint;
  type: IGasType.Eip1559;
}

export type GasPriceLevel = GasPriceClassicLevel | GasPriceEip1559Level;
