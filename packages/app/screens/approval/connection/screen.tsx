import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import {
  faCheckCircle,
  faPlug,
  faTimesCircle,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ISignerWallet, Origin } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { WarningBanner } from '../../../components/banner/warning';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import {
  isSupportedChain,
  onBlockchain,
  supportedChainsForBlockchain,
} from '../../../features/chain';
import {
  IBlockchainType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import {
  ChainSelect,
  renderSmallSelectedChainItem,
} from '../../../molecules/select/chain-select';
import { useLanguageContext } from '../../../provider/language';
import { RequestHeader } from '../header';
import { ConnectionType } from '../types';
import { localization } from './localization';
import { WalletSelectSheet } from './wallet-select';

interface ApprovalConnectionScreenProps {
  wallet: IWallet;
  wallets: IWallet[];
  signers: ISignerWallet[];
  blockchain: IBlockchainType;
  chainId: number;
  origin?: Origin;
  connectionType: ConnectionType;
  onCancel: VoidFunction;
  onConfirm: (wallet: IWallet, chainId: number) => void;
}

export function ApprovalConnectionScreen(props: ApprovalConnectionScreenProps) {
  const {
    wallet,
    wallets,
    signers,
    blockchain,
    chainId,
    origin,
    connectionType,
    onCancel,
    onConfirm,
  } = props;
  const { language } = useLanguageContext();

  const [selectedWallet, setSelectedWallet] = useState(wallet);
  const [selectedChainId, setSelectedChainId] = useState(
    wallet.chainId !== 0
      ? wallet.chainId
      : isSupportedChain(chainId)
      ? chainId
      : 1,
  );
  const [showWalletSheet, setShowWalletSheet] = useState(false);

  const keyringWallet = signers.find(
    (signer) => signer.hasKeyring && selectedWallet.address === signer.address,
  );
  const canConnect = onBlockchain(blockchain)(
    () => true,
    () => true,
    () => !!keyringWallet,
  );

  return (
    <ViewWithInset
      className='bg-background absolute h-full w-full'
      hasBottomInset={true}
    >
      <View className='flex h-full w-full flex-col'>
        <RequestHeader
          origin={origin}
          connectionType={connectionType}
          icon={faPlug}
          text={localization.connectionRequest[language]}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flex: 1, paddingBottom: 16 }}
        >
          {!canConnect && (
            <View className='w-full px-4 pt-3'>
              <WarningBanner
                title={localization.missingImport[language]}
                body={localization.missingImportDescription[language]}
              />
            </View>
          )}
          <View className='flex flex-col items-center justify-center space-y-3 px-4 pt-3'>
            <View className='bg-card flex w-full flex-col space-y-4 rounded-2xl px-4 py-3'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.websiteWillBeAbleTo[language]}
              </Text>
              <ConnectionAbilityItem
                positive={true}
                text={localization.viewBalanceAndActivity[language]}
              />
              <ConnectionAbilityItem
                positive={true}
                text={localization.requestTransactionApprovals[language]}
              />
            </View>
            <View className='bg-card flex w-full flex-col space-y-4 rounded-2xl px-4 py-3'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.websiteWontBeAbleTo[language]}
              </Text>
              <ConnectionAbilityItem
                positive={false}
                text={localization.moveFundsWithoutPermissions[language]}
              />
            </View>
          </View>
        </ScrollView>

        <View className='flex flex-col space-y-2 px-4 pt-2'>
          <View className='bg-card rounded-2xl px-4 py-3'>
            <View className='flex w-full flex-row justify-between'>
              <Text className='text-text-secondary text-xs font-medium'>
                {localization.wallet[language]}
              </Text>
              <Text className='text-text-secondary text-xs font-medium'>
                {localization.network[language]}
              </Text>
            </View>
            <View className='mt-2 flex w-full flex-row justify-between'>
              <BaseButton onPress={() => setShowWalletSheet(true)}>
                <View className='flex flex-row items-center space-x-2'>
                  <WalletAvatar wallet={selectedWallet} size={24} />
                  <Text className='text-text-primary truncate text-sm font-medium'>
                    {selectedWallet.name}
                  </Text>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    size={adjust(12, 2)}
                    color={colors.textSecondary}
                  />
                </View>
              </BaseButton>
              <View>
                <ChainSelect // TODO: doesn't do anything for walletconnect
                  disabled={selectedWallet.chainId !== 0}
                  value={selectedChainId}
                  chains={
                    supportedChainsForBlockchain[selectedWallet.blockchain]
                  }
                  onChange={(chain) => setSelectedChainId(chain.id)}
                  renderSelectedItem={renderSmallSelectedChainItem}
                  isFullHeight={true}
                  hasTopInset={false}
                />
              </View>
            </View>
          </View>
          <View className='flex flex-row justify-between space-x-4'>
            <View className='flex-1'>
              <TextButton
                onPress={onCancel}
                type='tertiary'
                text={localization.cancel[language]}
              />
            </View>
            <View className='flex-1'>
              <TextButton
                disabled={!canConnect}
                onPress={() => onConfirm(selectedWallet, selectedChainId)}
                type='primary'
                text={localization.confirm[language]}
              />
            </View>
          </View>
        </View>
        <WalletSelectSheet
          wallets={wallets.filter((wallet) => !wallet.hidden)}
          isShowing={showWalletSheet}
          onClose={() => setShowWalletSheet(false)}
          onSelectWallet={(wallet) => {
            setSelectedWallet(wallet);
            setShowWalletSheet(false);
            if (wallet.chainId !== 0) {
              setSelectedChainId(wallet.chainId);
            }
          }}
          hasTopInset={false}
        />
      </View>
    </ViewWithInset>
  );
}

const ConnectionAbilityItem = styled(function (props: {
  text: string;
  positive: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { text, positive, style } = props;

  return (
    <View className='flex flex-row items-center space-x-4' style={style}>
      <View
        className={cn('items-center justify-center rounded-full', {
          'bg-success/10': positive,
          'bg-failure/10': !positive,
        })}
        style={withSize(adjust(20))}
      >
        <FontAwesomeIcon
          icon={positive ? faCheckCircle : faTimesCircle}
          size={adjust(14, 2)}
          color={positive ? colors.success : colors.failure}
        />
      </View>
      <View className='bg-card-highlight rounded-xl px-4 py-3'>
        <Text className='text-text-secondary text-xs font-normal'>{text}</Text>
      </View>
    </View>
  );
});
