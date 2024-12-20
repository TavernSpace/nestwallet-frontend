import { useMemo } from 'react';
import {
  useMutationEmitter,
  useQueryRefetcher,
} from '../../common/hooks/query';
import { Tuple } from '../../common/types';
import { recordFrom } from '../../common/utils/functions';
import {
  loadDataFromQuery,
  mapLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import {
  IContractPreferences,
  useContractPreferencesQuery,
  useUpsertContractPreferencesMutation,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';
import { cryptoKey } from '../crypto/utils';
import { PresetInput } from './types';

export function useSwapPresets() {
  const contractPreferencesMutation = useMutationEmitter(
    graphqlType.ContractPreferences,
    useUpsertContractPreferencesMutation(),
  );

  const contractPreferencesQuery = useQueryRefetcher(
    graphqlType.ContractPreferences,
    useContractPreferencesQuery(undefined, { staleTime: 5 * 60 * 1000 }),
  );
  const contractPreferences = loadDataFromQuery(
    contractPreferencesQuery,
    (preferences) => preferences.contractPreferences as IContractPreferences[],
  );

  const presets = useMemo(
    () =>
      mapLoadable(contractPreferences)((preferences) =>
        recordFrom(
          preferences.filter(
            (pref) => pref.tradePresets || pref.tradePresetsPercentage,
          ),
          (item) => cryptoKey(item),
          (item) => ({
            absolute: item.tradePresets as Tuple<string, 3>,
            percentage: item.tradePresetsPercentage as Tuple<number, 3>,
          }),
        ),
      ),
    [...spreadLoadable(contractPreferences)],
  );

  const updatePresets = async (input: PresetInput) => {
    await contractPreferencesMutation.mutateAsync({
      input: {
        chainId: input.chainId,
        address: input.address,
        tradePresets: input.presets,
        tradePresetsPercentage: input.percentagePresets,
      },
    });
  };

  return {
    presets,
    updatePresets,
  };
}
