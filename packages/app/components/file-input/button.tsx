import { faImage, faPen, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { ReactNativeFile } from '../../common/hooks/graphql';
import { colors } from '../../design/constants';
import { IFile } from '../../graphql/client/generated/graphql';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Media } from '../media';
import { View } from '../view';

export interface IFileInputButtonProps {
  defaultValue?: IFile;
  value?: File | ReactNativeFile;
  onPress: VoidFunction;
  size?: number;
}

export function FileInputButton(props: IFileInputButtonProps) {
  const { defaultValue, value, onPress, size = 128 } = props;

  const hasValue = value || defaultValue;
  const src = value ?? defaultValue;
  const buttonSize = size / 3;

  return (
    <>
      <View className='relative'>
        <BaseButton
          onPress={onPress}
          style={{ width: size, height: size }}
          pressableStyle={{ borderRadius: 100 }}
        >
          <View className='border-card-highlight items-center justify-center rounded-full border border-dashed'>
            {hasValue ? (
              <Media
                type='image'
                className='rounded-full'
                src={src}
                style={{ width: size, height: size }}
              />
            ) : (
              <View
                className='flex flex-row items-center justify-center overflow-hidden rounded-full'
                style={{ width: size, height: size }}
              >
                <FontAwesomeIcon
                  className='outline-none'
                  icon={faImage}
                  size={size / 1.5}
                  style={{ color: colors.cardHighlight }}
                />
              </View>
            )}
            {hasValue ? (
              <View
                className='bg-primary border-background absolute -bottom-1 -right-1 flex flex-row items-center justify-center overflow-hidden rounded-full border-2'
                style={{ width: buttonSize, height: buttonSize }}
              >
                <FontAwesomeIcon
                  icon={faPen}
                  size={buttonSize / 3}
                  color={colors.textButtonPrimary}
                />
              </View>
            ) : (
              <View
                className='border-background bg-card-highlight absolute -bottom-1 -right-1 flex flex-row items-center justify-center overflow-hidden rounded-full border-2'
                style={{ width: buttonSize, height: buttonSize }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  size={buttonSize / 3}
                  color={colors.textPrimary}
                />
              </View>
            )}
          </View>
        </BaseButton>
      </View>
    </>
  );
}
