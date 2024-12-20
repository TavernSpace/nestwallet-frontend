import {
  Chain,
  arbitrum,
  avalanche,
  base,
  blast,
  bsc,
  gnosis,
  linea,
  mainnet,
  optimism,
  polygon,
  scroll,
  zkSync,
  zora,
} from 'viem/chains';
import { solanaRpcUrl } from '../../common/api/nestwallet/utils';
import { colors } from '../../design/constants';
import {
  IBlockchainType,
  IGasType,
} from '../../graphql/client/generated/graphql';
import { nullAddress } from '../evm/constants';
import { nativeSolAddress } from '../svm/constants';
import { nativeTonAddress } from '../tvm/constants';
import { solana } from './solana';
import { ton } from './ton';

export enum ChainId {
  Arbitrum = arbitrum.id,
  Avalanche = avalanche.id,
  Base = base.id,
  BinanceSmartChain = bsc.id,
  Blast = blast.id,
  Ethereum = mainnet.id,
  Gnosis = gnosis.id,
  Linea = linea.id,
  Optimism = optimism.id,
  Polygon = polygon.id,
  Scroll = scroll.id,
  Solana = solana.id,
  Ton = ton.id,
  ZkSync = zkSync.id,
  Zora = zora.id,
}

export interface ChainInfo extends Chain {
  blockchain: IBlockchainType;
  gasType: IGasType;
  nativeCurrency: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    imageUrl: string;
  };
  icon: string;
  color: string;
  coingeckoId: string;
  overrideRPCUrls: string[];
  flags: {
    isSupported: boolean;
    isBlowfishSupported: boolean;
    isSafeSupported: boolean;
    isSwapSupported: boolean;
    isCandleSupported: boolean;
    isL2: boolean;
  };
  wrappedToken: {
    address: string;
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
  };
  stablecoins: {
    address: string;
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
  }[];
  swapPriority: number;
}

export const chains: ChainInfo[] = [
  {
    ...mainnet,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.ethereum,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ethereum.svg',
    swapPriority: 100,
    //TODO: re-enable flashbots once we have proper tx tracking for them 'https://rpc.flashbots.net'],
    overrideRPCUrls: [
      'https://rpc.ankr.com/eth',
      'https://mainnet.gateway.tenderly.co',
      'https://rpc.flashbots.net/fast',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: false,
    },
    wrappedToken: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...blast,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.blast,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/blast.svg',
    swapPriority: 60,
    overrideRPCUrls: [
      'https://rpc.blast.io',
      'https://rpc.ankr.com/blast',
      'https://blast.blockpi.network/v1/rpc/public',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: false,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: false,
      isL2: true,
    },
    wrappedToken: {
      address: '0x4300000000000000000000000000000000000004',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x4300000000000000000000000000000000000003',
        name: 'Rebasing USDB',
        symbol: 'USDB',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdb.png',
      },
    ],
  },
  {
    ...scroll,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.scroll,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/scroll.svg',
    swapPriority: 9,
    overrideRPCUrls: ['https://rpc.scroll.io', 'https://rpc.ankr.com/scroll'],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: false,
      isL2: true,
    },
    wrappedToken: {
      address: '0x5300000000000000000000000000000000000004',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...base,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.base,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/base.svg',
    swapPriority: 90,
    overrideRPCUrls: [
      'https://mainnet.base.org',
      'https://base.gateway.tenderly.co',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: true,
    },
    wrappedToken: {
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...bsc,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nullAddress,
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
    },
    name: 'BNB Chain',
    coingeckoId: 'binancecoin',
    color: colors.bsc,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/bsc.svg',
    swapPriority: 80,
    overrideRPCUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org',
      'https://rpc.ankr.com/bsc',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: false,
    },
    wrappedToken: {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c.png',
    },
    stablecoins: [
      {
        address: '0x55d398326f99059fF775485246999027B3197955',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
      {
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        name: 'BUSD Token',
        symbol: 'BUSD',
        decimals: 18,
        imageUrl: '',
      },
    ],
  },
  {
    ...arbitrum,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    name: 'Arbitrum',
    coingeckoId: 'ethereum',
    color: colors.arbitrum,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/arbitrum.svg',
    swapPriority: 70,
    overrideRPCUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.gateway.tenderly.co',
      'https://rpc.ankr.com/arbitrum',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: true,
    },
    wrappedToken: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        name: 'USD Coin (Arbitrum)',
        symbol: 'USDC.e',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...polygon,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Polygon Ecosystem Token',
      symbol: 'POL',
      decimals: 18,
      imageUrl:
        'https://cdn.zerion.io/7560001f-9b6d-4115-b14a-6c44c4334ef2.png',
    },
    coingeckoId: 'matic-network',
    color: colors.polygon,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/polygon.svg',
    swapPriority: 50,
    overrideRPCUrls: [
      'https://polygon-rpc.com',
      'https://polygon.gateway.tenderly.co',
      'https://rpc.ankr.com/polygon',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: false,
    },
    wrappedToken: {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      name: 'Wrapped Matic',
      symbol: 'WMATIC',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/ef4dfcc9-4a7e-4a92-a538-df3d6f53e517.png',
    },
    stablecoins: [
      {
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        name: 'USD Coin (Polygon)',
        symbol: 'USDC.e',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
      {
        address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
        name: 'BUSD Token',
        symbol: 'BUSD',
        decimals: 18,
        imageUrl: '',
      },
    ],
  },
  {
    ...avalanche,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/43e05303-bf43-48df-be45-352d7567ff39.png',
    },
    coingeckoId: 'avalanche-2',
    color: colors.avalanche,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/avalanche.svg',
    swapPriority: 1,
    overrideRPCUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: false,
    },
    wrappedToken: {
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      name: 'Wrapped Avalanche',
      symbol: 'WAVAX',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7.png',
    },
    stablecoins: [
      {
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
        name: 'USD Coin (Avalanche)',
        symbol: 'USDC.e',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
    ],
  },
  {
    ...optimism,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    name: 'Optimism',
    coingeckoId: 'ethereum',
    color: colors.optimism,
    swapPriority: 5,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/optimism.svg',
    overrideRPCUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.gateway.tenderly.co',
      'https://rpc.ankr.com/optimism',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: true,
    },
    wrappedToken: {
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        name: 'USD Coin (Optimism)',
        symbol: 'USDC.e',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...zkSync,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.zksync,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/zksync.svg',
    swapPriority: 5,
    overrideRPCUrls: [
      'https://mainnet.era.zksync.io',
      'https://rpc.ankr.com/zksync_era',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: true,
    },
    wrappedToken: {
      address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
        name: 'USD Coin (zkSync Era)',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...linea,
    name: 'Linea',
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    coingeckoId: 'ethereum',
    color: colors.linea,
    swapPriority: 5,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/linea.svg',
    overrideRPCUrls: [
      'https://rpc.linea.build',
      'https://linea.blockpi.network/v1/rpc/public',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: false,
      isBlowfishSupported: true,
      isSwapSupported: true,
      isCandleSupported: false,
      isL2: true,
    },
    wrappedToken: {
      address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [
      {
        address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
      {
        address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/dai.png',
      },
    ],
  },
  {
    ...gnosis,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'xDai',
      symbol: 'XDAI',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/b99ea659-0ab1-4832-bf44-3bf1cc1acac7.png',
    },
    coingeckoId: 'xdai',
    color: colors.gnosis,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/gnosis.svg',
    swapPriority: 1,
    overrideRPCUrls: [
      'https://rpc.ankr.com/gnosis',
      'https://rpc.gnosischain.com',
    ],
    flags: {
      isSupported: true,
      isSafeSupported: true,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: false,
      isL2: false,
    },
    wrappedToken: {
      address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      name: 'Wrapped xDAI',
      symbol: 'WXDAI',
      decimals: 18,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/0xe91d153e0b41518a2ce8dd3d7944fa863463a97d.png',
    },
    stablecoins: [
      {
        address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
    ],
  },
  {
    ...zora,
    blockchain: IBlockchainType.Evm,
    gasType: IGasType.Eip1559,
    nativeCurrency: {
      address: nullAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      imageUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
    },
    name: 'Zora',
    coingeckoId: 'ethereum',
    color: colors.zora,
    swapPriority: 5,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/zora.svg',
    overrideRPCUrls: ['https://rpc.zora.energy'],
    flags: {
      isSupported: true,
      isSafeSupported: false,
      isBlowfishSupported: true,
      isSwapSupported: false,
      isCandleSupported: false,
      isL2: true,
    },
    wrappedToken: {
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      imageUrl:
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/wrapped-eth.png',
    },
    stablecoins: [],
  },
  {
    ...solana,
    blockchain: IBlockchainType.Svm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nativeSolAddress,
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      imageUrl:
        'https://token-icons.s3.amazonaws.com/11111111111111111111111111111111.png',
    },
    coingeckoId: 'sol',
    color: colors.solana,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg',
    overrideRPCUrls: [solanaRpcUrl],
    swapPriority: 95,
    flags: {
      isSupported: true,
      isSafeSupported: false,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: true,
      isL2: false,
    },
    wrappedToken: {
      address: 'So11111111111111111111111111111111111111112',
      name: 'Wrapped SOL',
      symbol: 'WSOL',
      imageUrl:
        'https://token-icons.s3.amazonaws.com/11111111111111111111111111111111.png',
      decimals: 9,
    },
    stablecoins: [
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/usdc.png',
      },
      {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
    ],
  },
  {
    ...ton,
    name: 'TON',
    blockchain: IBlockchainType.Tvm,
    gasType: IGasType.Classic,
    nativeCurrency: {
      address: nativeTonAddress,
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9,
      imageUrl:
        'https://raw.githubusercontent.com/ton-community/ton-docs/main/static/img/ton_symbol.svg',
    },
    blockExplorers: {
      default: { name: 'Tonviewer', url: 'https://tonviewer.com' },
    },
    coingeckoId: 'ton',
    color: colors.ton,
    icon: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ton.svg',
    overrideRPCUrls: [
      'https://toncenter.com/api/v2/jsonRPC',
      'https://ton.access.orbs.network/4410c0ff5Bd3F8B62C092Ab4D238bEE463E64410/1/mainnet/toncenter-api-v2',
      'https://ton.access.orbs.network/4411c0ff5Bd3F8B62C092Ab4D238bEE463E64411/1/mainnet/toncenter-api-v2',
      'https://ton.access.orbs.network/4412c0ff5Bd3F8B62C092Ab4D238bEE463E64412/1/mainnet/toncenter-api-v2',
      'https://ton.access.orbs.network/4413c0ff5Bd3F8B62C092Ab4D238bEE463E64413/1/mainnet/toncenter-api-v2',
    ],
    swapPriority: 95,
    flags: {
      isSupported: true,
      isSafeSupported: false,
      isBlowfishSupported: false,
      isSwapSupported: true,
      isCandleSupported: false,
      isL2: false,
    },
    wrappedToken: {
      address: 'EQCajaUU1XXSAjTD-xOV7pE49fGtg4q8kF3ELCOJtGvQFQ2C',
      name: 'Wrapped Toncoin',
      symbol: 'WTON',
      imageUrl:
        'https://raw.githubusercontent.com/ton-community/ton-docs/main/static/img/ton_symbol.svg',
      decimals: 9,
    },
    stablecoins: [
      {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        name: 'Tether USD',
        symbol: 'USD₮',
        decimals: 6,
        imageUrl:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/token/tether.png',
      },
    ],
  },
];
