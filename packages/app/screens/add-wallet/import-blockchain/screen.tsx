import { faChartNetwork } from '@fortawesome/pro-solid-svg-icons';
import { adjust } from '../../../common/utils/style';
import { BlockchainAvatar } from '../../../components/avatar/blockchain-avatar';
import { LayeredChainAvatar } from '../../../components/avatar/chain-avatar/layered';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { supportedChainsForBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface ImportWalletBlockchainTypeProps {
  onSubmit: (blockchain: IBlockchainType) => void;
}

export function ImportWalletBlockchainTypeScreen(
  props: ImportWalletBlockchainTypeProps,
) {
  const { onSubmit } = props;
  const { language } = useLanguageContext();

  const size = adjust(36);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faChartNetwork}
            color={colors.success}
            size={48}
          />
        </View>
        <View className='mt-4 flex w-full flex-col justify-center'>
          <Text className='text-text-primary mt-4 text-lg font-medium'>
            {localization.selectBlockchain[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-normal'>
            {localization.selectBlockchainDescription[language]}
          </Text>
          <View className='mt-4 space-y-2'>
            <ButtonListItem
              onPress={() => onSubmit(IBlockchainType.Evm)}
              title={localization.ethereum[language]}
              subtitle={localization.ethereumSubtitle[language]}
              adornment={
                <View
                  className='absolute items-center justify-center'
                  style={{ left: adjust(68, 10), bottom: -0.75 }}
                >
                  <LayeredChainAvatar
                    chains={supportedChainsForBlockchain[
                      IBlockchainType.Evm
                    ].map((chain) => chain.id)}
                    limit={5}
                    displayRemaining={true}
                    size={adjust(18, 2)}
                    border={true}
                    borderColor={colors.card}
                  />
                </View>
              }
            >
              <BlockchainAvatar size={size} blockchain={IBlockchainType.Evm} />
            </ButtonListItem>
            <ButtonListItem
              onPress={() => onSubmit(IBlockchainType.Svm)}
              title={localization.solana[language]}
              subtitle={localization.solanaSubtitle[language]}
            >
              <BlockchainAvatar size={size} blockchain={IBlockchainType.Svm} />
            </ButtonListItem>
            <ButtonListItem
              onPress={() => onSubmit(IBlockchainType.Tvm)}
              title={localization.ton[language]}
              subtitle={localization.tonSubtitle[language]}
            >
              <BlockchainAvatar size={size} blockchain={IBlockchainType.Tvm} />
            </ButtonListItem>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
