import { ICryptoBalance } from '../../graphql/client/generated/graphql';

export interface Protocol {
  name: string;
  imageUrl: string;
  link: string;
  totalValueUSD: number;
  groups: ProtocolGroup[];
}

export interface ProtocolGroup {
  id: string;
  name: string;
  totalValueUSD: number;
  positions: ICryptoBalance[];
}

export interface CryptoPositionItem {
  balance: ICryptoBalance;
  groupedBalances: ICryptoBalance[];
}
