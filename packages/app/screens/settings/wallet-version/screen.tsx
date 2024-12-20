import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { useMemo, useState } from 'react';
import { formatAddress } from '../../../common/format/address';
import { Loadable, Tuple } from '../../../common/types';
import { recordify } from '../../../common/utils/functions';
import { onLoadable } from '../../../common/utils/query';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Skeleton } from '../../../components/skeleton';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { WalletVersion } from '../../../features/tvm/types';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface WalletVersionScreenProps {
  wallet: IWallet;
  wallets: IWallet[];
  walletVersions: Loadable<Tuple<string, 4>>;
  onAddWallets: (
    versions: { address: string; version: string }[],
  ) => Promise<void>;
}

export function WalletVersionScreen(props: WalletVersionScreenProps) {
  const { wallet, wallets, walletVersions, onAddWallets } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(false);

  const ownedWallets = useMemo(
    () => recordify(wallets, (wallet) => wallet.address),
    [wallets],
  );

  const versions: Tuple<WalletVersion, 4> = ['V3R1', 'V3R2', 'V4', 'W5'];

  const handleAddWallets = async () => {
    if (!walletVersions.success) return;
    try {
      setLoading(true);
      await onAddWallets(
        walletVersions.data
          .map((address, index) => ({
            address,
            version: versions[index]!,
          }))
          .filter((w) => selectedVersions[w.address]),
      );
    } catch (err) {
      const error = parseError(err, localization.failedToAddWallets[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='mt-4 flex w-full flex-col space-y-4'>
          <View className='bg-card overflow-hidden rounded-2xl'>
            <View className='flex flex-col'>
              {onLoadable(walletVersions)(
                () => (
                  <Skeleton height={240} width={'100%'} borderRadius={16} />
                ),
                () => (
                  <View className='h-60 w-full' />
                ),
                (data) =>
                  data.map((address, index) => {
                    const owned =
                      !!ownedWallets[address] || wallet.address === address;
                    const version = versions[index]!;
                    return (
                      <View key={index}>
                        <ListItem
                          onPress={() =>
                            setSelectedVersions({
                              ...selectedVersions,
                              [address]: !selectedVersions[address],
                            })
                          }
                          disabled={owned || loading}
                        >
                          <View className='flex flex-row items-center justify-between px-4 py-3'>
                            <View className='flex flex-col'>
                              <Text className='text-text-primary text-sm font-medium'>
                                {version}
                              </Text>
                              <Text className='text-text-secondary text-xs font-normal'>
                                {formatAddress(address)}
                              </Text>
                            </View>
                            {owned && (
                              <View className='bg-success/10 items-center justify-center rounded-full px-2 py-1'>
                                <Text className='text-success text-sm font-medium'>
                                  {localization.added[language]}
                                </Text>
                              </View>
                            )}
                            {selectedVersions[address] && !owned && (
                              <View
                                className='bg-primary/10 items-center justify-center rounded-full'
                                style={withSize(adjust(20))}
                              >
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  color={colors.primary}
                                  size={adjust(14, 2)}
                                />
                              </View>
                            )}
                          </View>
                        </ListItem>
                        {index < data.length - 1 && (
                          <View className='w-full px-4'>
                            <View className='bg-card-highlight h-[1px] w-full' />
                          </View>
                        )}
                      </View>
                    );
                  }),
              )}
            </View>
          </View>
        </View>
        <View className='flex flex-col space-y-2'>
          <View className='bg-card rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {localization.walletVersionsInfo[language]}
            </Text>
          </View>
          <TextButton
            text={localization.import[language]}
            onPress={handleAddWallets}
            disabled={
              loading ||
              Object.values(selectedVersions).filter((item) => item).length ===
                0
            }
            loading={loading}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
