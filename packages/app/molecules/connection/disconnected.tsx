import { ConnectedSite } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { ConnectionIcon } from '../../components/connection';
import { Text } from '../../components/text';
import { View } from '../../components/view';

interface DisconnectedContentProps {
  connectedSite?: ConnectedSite;
}

export function DisconnectedContent(props: DisconnectedContentProps) {
  const { connectedSite } = props;

  return (
    <View className='space-y-4 px-4'>
      <View className='flex flex-row items-center space-x-4'>
        <View className='bg-card flex items-center justify-center overflow-hidden rounded-lg'>
          <ConnectionIcon
            isConnected={false}
            iconUrl={connectedSite?.siteInfo?.imageUrl}
            size={adjust(24)}
          />
        </View>
        <View className='flex flex-1 flex-col'>
          <Text className='text-text-primary text-sm font-bold'>
            Not Connected
          </Text>
          <Text
            className='text-text-secondary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {connectedSite?.siteInfo?.url}
          </Text>
        </View>
      </View>
      <Text className='text-text-secondary text-xs font-normal'>
        You are not connected to this site. If the site is a dApp, there should
        be a "Connect Wallet" button to connect Nest Wallet.
      </Text>
    </View>
  );
}
