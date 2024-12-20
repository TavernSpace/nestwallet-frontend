import _ from 'lodash';
import {
  IContractVisibility,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';
import { ChainId } from '../chain';

export function chainFilter(crypto: ICryptoBalance, filteredChain: number) {
  return filteredChain === 0 || crypto.chainId === filteredChain;
}

export function visibilityFilter(crypto: ICryptoBalance) {
  const isVisible = crypto.visibility === IContractVisibility.Shown;
  const hasPrice = parseFloat(crypto.tokenMetadata.price) > 0;
  const isShown = _.isNil(crypto.visibility)
    ? hasPrice ||
      crypto.chainId === ChainId.Solana ||
      crypto.chainId === ChainId.Ton
    : isVisible;
  return isShown;
}
