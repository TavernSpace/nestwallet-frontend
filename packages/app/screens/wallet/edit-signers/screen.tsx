import {
  faArrowRightArrowLeft,
  faClone,
  faPen,
  faTrash,
} from '@fortawesome/pro-regular-svg-icons';
import { SafeInfoResponse } from '@safe-global/api-kit';
import { formatEVMAddress } from '../../../common/format/evm';
import { useCopy } from '../../../common/hooks/copy';
import { Loadable } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { BaseButton } from '../../../components/button/base-button';
import {
  ColoredIconButton,
  IconButton,
} from '../../../components/button/icon-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ScrollWrapper } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { EditOperation } from './edit-signer-sheet/content';

interface EditSafeSignerProps {
  selectedWallet: IWallet;
  safeInfo: Loadable<SafeInfoResponse>;
  onEditSignersPress: (op: EditOperation) => void;
}

export function EditSafeSignersScreen(props: EditSafeSignerProps) {
  const { safeInfo, onEditSignersPress } = props;
  const { copy } = useCopy('Copied signer address!');

  const size = adjust(16);

  return onLoadable(safeInfo)(
    () => (
      <View className='flex h-full items-center justify-center pt-8'>
        <ActivityIndicator />
      </View>
    ),
    () => (
      <ErrorScreen
        title='Unable to get Signers'
        description='Something went wrong trying to get the signers of this Safe.'
      />
    ),
    (safeInfo) => (
      <ScrollWrapper>
        <ViewWithInset className='h-full w-full' hasBottomInset={true}>
          <View className='flex h-full flex-col justify-between px-4'>
            <View className='flex flex-col'>
              <Text className='text-text-secondary mt-2 text-sm font-medium'>
                Update the signers and threshold of your Safe.
              </Text>
              <View className='bg-card mt-4 w-full rounded-2xl p-4'>
                <Text className='text-text-primary text-sm font-bold'>
                  Confirmations Required:
                </Text>
                <View className='mt-2 w-full flex-row items-center justify-between'>
                  <Text className='text-text-secondary text-sm font-medium'>
                    {safeInfo.threshold} out of {safeInfo.owners.length} signers
                  </Text>
                  <IconButton
                    icon={faPen}
                    size={size}
                    onPress={() => onEditSignersPress({ type: 'threshold' })}
                    color={colors.textSecondary}
                  />
                </View>
              </View>
              <View className='bg-card mt-4 w-full rounded-2xl p-4'>
                <Text className='text-text-primary text-sm font-bold'>
                  Safe Signers:
                </Text>
                <View>
                  {safeInfo.owners.map((signer, index) => {
                    return (
                      <View
                        className='flex flex-row items-center justify-between'
                        key={index}
                      >
                        <BaseButton
                          className='-ml-2 overflow-hidden rounded-full'
                          onPress={() => copy(signer)}
                          rippleEnabled={false}
                        >
                          <View className='flex-row items-center space-x-2 px-2 py-3'>
                            <Text className='text-text-secondary text-sm font-medium'>
                              {formatEVMAddress(signer)}
                            </Text>
                            <FontAwesomeIcon
                              icon={faClone}
                              size={adjust(12, 2)}
                              color={colors.textSecondary}
                            />
                          </View>
                        </BaseButton>
                        <View className='flex flex-row items-center space-x-2'>
                          <ColoredIconButton
                            icon={faArrowRightArrowLeft}
                            size='sm'
                            onPress={() =>
                              onEditSignersPress({
                                type: 'swap',
                                address: signer,
                              })
                            }
                            color={colors.primary}
                          />
                          <ColoredIconButton
                            icon={faTrash}
                            size='sm'
                            onPress={() =>
                              onEditSignersPress({
                                type: 'remove',
                                address: signer,
                              })
                            }
                            color={colors.failure}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
            <View className='mt-4 flex flex-col space-y-2'>
              <View className='bg-card rounded-2xl px-4 py-3'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {
                    'Changing the signers and threshold of your Safe can render it unusable. Only proceed if you know what you are doing.'
                  }
                </Text>
              </View>
              <TextButton
                onPress={() =>
                  onEditSignersPress({
                    type: 'add',
                  })
                }
                text='Add a Signer'
              />
            </View>
          </View>
        </ViewWithInset>
      </ScrollWrapper>
    ),
  );
}
