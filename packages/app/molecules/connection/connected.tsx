import { faRightFromBracket } from '@fortawesome/pro-solid-svg-icons';
import { ConnectedSite } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { IconButton } from '../../components/button/icon-button';
import { ConnectionIcon } from '../../components/connection';
import { Divider } from '../../components/divider';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainInfo, supportedChainsForBlockchain } from '../../features/chain';
import {
  IBlockchainType,
  IWallet,
} from '../../graphql/client/generated/graphql';
import {
  ChainSelect,
  renderSmallSelectedChainItem,
} from '../select/chain-select';

interface ConnectedContentProps {
  connectedSite: ConnectedSite;
  wallets: Record<IBlockchainType, IWallet | null>;
  onChainChange: (value: ChainInfo) => void;
  onDisconnect: (origin: string) => void;
}

export function ConnectedContent(props: ConnectedContentProps) {
  const { connectedSite, wallets, onChainChange, onDisconnect } = props;

  const connections = Object.keys(connectedSite.connections)
    .map((key) => ({
      blockchain: key,
      connection: connectedSite.connections[key as IBlockchainType]!,
      wallet: wallets[key as IBlockchainType] as IWallet,
    }))
    .filter((connection) => connection.wallet && connection.connection);

  return (
    <View className='flex flex-col'>
      <View className='flex flex-row items-center justify-between space-x-2 px-4'>
        <View className='flex w-full flex-row items-center space-x-4'>
          <ConnectionIcon
            isConnected={true}
            size={adjust(24)}
            borderRadius={adjust(8, 2)}
            iconUrl={connectedSite.siteInfo!.imageUrl}
          />
          <View className='-mt-1 flex flex-1 flex-col'>
            <View className='flex flex-row items-center justify-between'>
              <Text className='text-success text-sm font-bold'>Connected</Text>
              <IconButton
                icon={faRightFromBracket}
                size={adjust(16)}
                color={colors.failure}
                onPress={() => onDisconnect(connectedSite.siteInfo!.url)}
              />
            </View>
            <Text
              className='text-text-secondary truncate text-xs font-medium'
              numberOfLines={1}
            >
              {new URL(connectedSite.siteInfo!.url).hostname}
            </Text>
          </View>
        </View>
      </View>
      <View className='flex flex-col'>
        {connections.map(({ wallet, connection, blockchain }, index) => (
          <View key={blockchain} className='flex flex-col space-y-4'>
            <View className='space-y-3 px-4 pt-4'>
              <View className='flex w-full flex-row items-center justify-between'>
                <Text className='text-text-primary text-sm font-medium'>
                  Wallet
                </Text>
                <View className='flex flex-row items-center space-x-2'>
                  <WalletAvatar wallet={wallet} size={adjust(24)} />
                  <Text
                    className='text-text-primary truncate text-sm font-medium'
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                </View>
              </View>

              <View className='flex w-full flex-row items-center justify-between'>
                <Text className='text-text-primary text-sm font-medium'>
                  Network
                </Text>
                <ChainSelect
                  disabled={
                    wallet.chainId !== 0 ||
                    wallet.blockchain !== IBlockchainType.Evm
                  }
                  value={connection.chainId}
                  chains={supportedChainsForBlockchain[wallet.blockchain]}
                  onChange={onChainChange}
                  renderSelectedItem={renderSmallSelectedChainItem}
                  isFullHeight={true}
                />
              </View>
            </View>
            {index < connections.length - 1 && <Divider />}
          </View>
        ))}
      </View>
    </View>
  );
}
