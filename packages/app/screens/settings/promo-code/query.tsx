import {
  useMutationEmitter,
  useQueryRefetcher,
} from '../../../common/hooks/query';
import { loadDataFromQuery } from '../../../common/utils/query';
import {
  IClaimPromoCodeInput,
  IPromoCode,
  useClaimPromoCodeMutation,
  usePromoCodesQuery,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { PromoCodeScreen } from './screen';

export function PromoCodeScreenWithQuery() {
  const promoCodesQuery = useQueryRefetcher(
    graphqlType.Promo,
    usePromoCodesQuery(),
  );
  const promoCodes = loadDataFromQuery(
    promoCodesQuery,
    (data) => data.promoCodes as IPromoCode[],
  );

  const claimPromoCodeMutation = useMutationEmitter(
    graphqlType.Promo,
    useClaimPromoCodeMutation(),
  );

  const handleClaimPromoCode = async (
    claimPromoCodeInput: IClaimPromoCodeInput,
  ) => {
    await claimPromoCodeMutation.mutateAsync({ input: claimPromoCodeInput });
  };

  return (
    <PromoCodeScreen
      onClaimPromoCode={handleClaimPromoCode}
      promoCodes={promoCodes}
    />
  );
}
