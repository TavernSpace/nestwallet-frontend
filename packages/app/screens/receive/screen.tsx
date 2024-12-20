import { faClone } from '@fortawesome/pro-solid-svg-icons';
import LogoImage from '../../assets/images/logos/nest-logo.png';
import { formatAddress } from '../../common/format/address';
import { useCopy } from '../../common/hooks/copy';
import { adjust } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { ChainChip } from '../../components/chip';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { QRCode } from '../../components/qr';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import {
  getChainInfo,
  onBlockchain,
  supportedChainsForBlockchain,
} from '../../features/chain';
import { IWallet } from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

interface ReceiveScreenProps {
  wallet: IWallet;
}

export function ReceiveScreen(props: ReceiveScreenProps) {
  const { wallet } = props;
  const { language } = useLanguageContext();
  const { copy } = useCopy(localization.copiedAddress[language]);

  const chain = wallet.chainId ? getChainInfo(wallet.chainId) : undefined;
  const qrSize = SCREEN_WIDTH - 70;
  const validChains = supportedChainsForBlockchain[wallet.blockchain];

  return (
    <View className='flex h-full w-full flex-col items-center'>
      <View className='mt-2 flex flex-col items-center space-y-1'>
        <Text className='text-text-primary text-center text-xl font-bold'>
          {wallet.name}
        </Text>
        <BaseButton onPress={() => copy(wallet.address)}>
          <View className='flex flex-row items-center space-x-2 px-4'>
            <Text className='text-text-secondary text-sm font-medium'>
              {formatAddress(wallet.address)}
            </Text>
            <FontAwesomeIcon
              icon={faClone}
              size={adjust(14, 2)}
              color={colors.textSecondary}
            />
          </View>
        </BaseButton>
      </View>
      <View
        className='mt-4 items-center justify-around bg-white shadow'
        style={{
          height: qrSize,
          width: qrSize,
          borderRadius: 28,
        }}
      >
        <QRCode
          value={wallet.address}
          logo={LogoImage}
          logoSize={75}
          logoPadding={30}
          size={SCREEN_WIDTH - 120}
        />
      </View>
      {chain ? (
        <View
          className='mt-2 flex flex-col items-center space-y-3'
          style={{ width: qrSize }}
        >
          <ChainChip chainId={chain.id} />
          <Text className='text-text-secondary text-center text-xs font-normal'>
            {localization.safeText(chain.name)[language]}
          </Text>
        </View>
      ) : (
        <View
          className='bg-card mt-2 rounded-2xl px-4 py-3'
          style={{ width: qrSize }}
        >
          <Text className='text-text-secondary text-center text-xs font-normal'>
            {onBlockchain(wallet.blockchain)(
              () => localization.evmText(validChains)[language],
              () => localization.svmText[language],
              () => localization.tvmText[language],
            )}
          </Text>
        </View>
      )}
    </View>
  );
}
