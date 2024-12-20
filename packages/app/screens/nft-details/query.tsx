import { loadDataFromQuery } from '../../common/utils/query';
import { isSoulbound } from '../../features/evm/utils';
import {
  INftBalance,
  INftSaleData,
  useNftSaleDataQuery,
} from '../../graphql/client/generated/graphql';
import { NftDetails } from './screen';

interface NftDetailsQueryProps {
  nft: INftBalance;
  hideActions: boolean;
  onPressSend: VoidFunction;
}

export function NftDetailsWithQuery(props: NftDetailsQueryProps) {
  const { nft } = props;

  const nftSaleDataQuery = useNftSaleDataQuery(
    {
      chainId: nft.chainId,
      address: nft.address,
      tokenId: nft.tokenId,
    },
    {
      staleTime: 1000 * 60 * 10,
      enabled: !isSoulbound(nft.chainId, nft.address),
    },
  );

  const nftSaleData = loadDataFromQuery(
    nftSaleDataQuery,
    (data) => data.nftSaleData as INftSaleData,
  );

  return <NftDetails {...props} nftSaleData={nftSaleData} />;
}
