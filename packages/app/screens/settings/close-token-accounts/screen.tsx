import { faCheck, faPiggyBank } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useState } from 'react';
import { formatCryptoFloat } from '../../../common/format/number';
import { Loadable } from '../../../common/types';
import { recordFrom } from '../../../common/utils/functions';
import { onLoadable } from '../../../common/utils/query';
import { adjust, withSize } from '../../../common/utils/style';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { NFTAvatar } from '../../../components/avatar/nft-avatar';
import { TextButton } from '../../../components/button/text-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Skeleton } from '../../../components/skeleton';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { ChainId } from '../../../features/chain';
import {
  IBlockchainType,
  IEmptyTokenAccountType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { useLanguageContext } from '../../../provider/language';
import { ExecutionSheet } from '../../proposal/execution-sheet';
import { localization } from './localization';
import { EmptySVMTokenMetadata } from './query';

interface CloseEmptyTokenAccountsProps {
  wallet: IWallet;
  emptyTokenAccounts: Loadable<EmptySVMTokenMetadata[]>;
  onExecute: (accounts: EmptySVMTokenMetadata[]) => Promise<string>;
  onCompleted: VoidFunction;
}

export function CloseEmptyTokenAccountsScreen(
  props: CloseEmptyTokenAccountsProps,
) {
  const { wallet, emptyTokenAccounts, onCompleted, onExecute } = props;
  const { language } = useLanguageContext();

  return onLoadable(emptyTokenAccounts)(
    () => (
      <ViewWithInset className='h-full w-full px-4' hasBottomInset={true}>
        <Skeleton height={'100%'} width={'100%'} borderRadius={16} />
      </ViewWithInset>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetTokenAccounts[language]}
        description={localization.somethingWentWrong[language]}
      />
    ),
    (emptyTokenAccounts) => (
      <CloseTokenAccountsSection
        wallet={wallet}
        emptyTokenAccounts={emptyTokenAccounts}
        onExecute={onExecute}
        onCompleted={onCompleted}
      />
    ),
  );
}

function CloseTokenAccountsSection(props: {
  wallet: IWallet;
  emptyTokenAccounts: EmptySVMTokenMetadata[];
  onExecute: (accounts: EmptySVMTokenMetadata[]) => Promise<string>;
  onCompleted: VoidFunction;
}) {
  const { wallet, emptyTokenAccounts, onCompleted, onExecute } = props;
  const { language } = useLanguageContext();

  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [deselected, setDeselected] = useState<Record<string, boolean>>(
    recordFrom(
      emptyTokenAccounts,
      (item) => item.tokenAccountAddress,
      (_, index) => index >= 25,
    ),
  );

  const handleSelect = (account: string, selected: boolean) => {
    setDeselected({ ...deselected, [account]: !selected });
  };

  const handleExecute = async () => {
    const input = emptyTokenAccounts.filter(
      (account) => !deselected[account.tokenAccountAddress],
    );
    return onExecute(input);
  };

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<
    EmptySVMTokenMetadata,
    { deselected: Record<string, boolean> }
  >) => (
    <EmptyTokenAccount
      tokenAccount={item}
      isSelected={!extraData!.deselected[item.tokenAccountAddress]}
      onSelect={() =>
        handleSelect(
          item.tokenAccountAddress,
          !!extraData!.deselected[item.tokenAccountAddress],
        )
      }
    />
  );

  const selectedTokenAccounts = emptyTokenAccounts.filter(
    (account) => !deselected[account.tokenAccountAddress],
  );

  return (
    <>
      <View className='absolute h-full w-full'>
        <ViewWithInset className='h-full w-full' hasBottomInset={true}>
          <View className='mt-4 flex-1 px-4'>
            {emptyTokenAccounts.length === 0 ? (
              <View className='bg-card flex-1 items-center justify-center space-y-4 overflow-hidden rounded-2xl px-4'>
                <View
                  className='bg-primary/10 items-center justify-center rounded-full'
                  style={withSize(80)}
                >
                  <FontAwesomeIcon
                    icon={faPiggyBank}
                    size={48}
                    color={colors.primary}
                  />
                </View>
                <View className='flex flex-col space-y-1'>
                  <Text className='text-text-primary text-center text-base font-medium'>
                    {localization.noEmptyTokenAccounts[language]}
                  </Text>
                  <Text className='text-text-secondary text-center text-xs font-normal'>
                    {localization.noEmptyTokenAccountsDescription[language]}
                  </Text>
                </View>
              </View>
            ) : (
              <View className='bg-card flex-1 overflow-hidden rounded-2xl'>
                <FlatList
                  data={emptyTokenAccounts}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.tokenAccountAddress}
                  extraData={{ deselected }}
                  estimatedItemSize={40}
                />
              </View>
            )}
          </View>
          <View className='flex w-full flex-col space-y-2 px-4 pt-2'>
            {emptyTokenAccounts.length > 0 && (
              <View className='bg-card flex flex-row items-center justify-between rounded-2xl px-4 py-3'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {selectedTokenAccounts.length > 25
                    ? localization.maximumCloseAccounts[language]
                    : localization.amountReclaimedDescription(
                        formatCryptoFloat(selectedTokenAccounts.length * 0.002),
                      )[language]}
                </Text>
              </View>
            )}
            <TextButton
              onPress={() => setShowExecutionSheet(true)}
              text={localization.closeAccounts[language]}
              disabled={
                selectedTokenAccounts.length === 0 ||
                selectedTokenAccounts.length > 25
              }
            />
          </View>
        </ViewWithInset>
      </View>
      <ExecutionSheet
        chainId={ChainId.Solana}
        blockchain={IBlockchainType.Svm}
        executor={wallet}
        isShowing={showExecutionSheet}
        onClose={() => setShowExecutionSheet(false)}
        onCompleted={onCompleted}
        onExecute={handleExecute}
      />
    </>
  );
}

function EmptyTokenAccount(props: {
  tokenAccount: EmptySVMTokenMetadata;
  isSelected: boolean;
  onSelect: VoidFunction;
}) {
  const { tokenAccount, isSelected, onSelect } = props;

  return (
    <View key={tokenAccount.tokenAccountAddress} className='flex flex-col'>
      <ListItem onPress={onSelect}>
        <View className='flex flex-row items-center justify-between space-x-2 px-4 py-3'>
          <View className='flex flex-1 flex-row items-center space-x-4'>
            {tokenAccount.type === IEmptyTokenAccountType.Token ? (
              <CryptoAvatar
                url={tokenAccount.imageUrl}
                size={adjust(36)}
                symbol={tokenAccount.symbol}
              />
            ) : (
              <NFTAvatar
                url={tokenAccount.imageUrl}
                size={adjust(36)}
                borderRadius={8}
              />
            )}
            <View className='flex flex-1 flex-col pr-4'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {tokenAccount.name}
              </Text>
              <Text
                className='text-text-secondary flex items-center truncate text-xs font-normal'
                numberOfLines={1}
              >
                {tokenAccount.symbol}
              </Text>
            </View>
          </View>
          <View className='flex flex-row items-center space-x-4'>
            <View
              className={cn(
                'flex flex-row items-center justify-center rounded-full',
                {
                  'bg-primary/10': isSelected,
                  'bg-card-highlight-secondary': !isSelected,
                },
              )}
              style={withSize(adjust(20, 2))}
            >
              <FontAwesomeIcon
                icon={faCheck}
                size={adjust(12, 2)}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        </View>
      </ListItem>
    </View>
  );
}
