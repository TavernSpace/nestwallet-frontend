import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { ImageSourcePropType } from 'react-native';
import { colors } from '../../design/constants';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Svg } from '../svg';
import { Text } from '../text';
import { View } from '../view';

export interface ICardEmptyStateProps {
  title: string;
  description: string;
  icon?: ImageSourcePropType;
  overrideIcon?: React.ReactNode;
}

export function CardEmptyState(props: ICardEmptyStateProps) {
  const { title, description, icon, overrideIcon } = props;

  return (
    <View className='flex flex-col items-center justify-center'>
      {!!icon && !overrideIcon && (
        <View className='items-center justify-center'>
          <Svg source={icon} width={88} height={76} />
        </View>
      )}
      {overrideIcon}
      <View className='flex flex-col items-center justify-center space-y-1'>
        <Text className='text-text-primary mt-4 text-base font-medium'>
          {title}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function CardErrorState(props: Omit<ICardEmptyStateProps, 'icon'>) {
  const { title, description } = props;

  return (
    <View className='flex flex-col items-center justify-center'>
      <View className='bg-failure/10 h-20 w-20 items-center justify-center rounded-full'>
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          size={48}
          color={colors.failure}
        />
      </View>
      <View className='flex flex-col items-center justify-center space-y-1'>
        <Text className='text-text-primary mt-4 text-base font-medium'>
          {title}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {description}
        </Text>
      </View>
    </View>
  );
}
