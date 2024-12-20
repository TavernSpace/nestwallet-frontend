import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { withSize } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { colors } from '../../design/constants';

export function ErrorScreen(props: {
  header?: React.ReactNode;
  title: string;
  description: string;
}) {
  const { header, title, description } = props;

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      {header}
      <View className='flex h-full w-full flex-col items-center justify-center px-4'>
        <View className='-mt-16 flex flex-col items-center justify-center space-y-4'>
          <View
            className='bg-failure/10 flex flex-col items-center justify-center rounded-full'
            style={withSize(80)}
          >
            <FontAwesomeIcon
              color={colors.failure}
              icon={faExclamationTriangle}
              size={48}
            />
          </View>
          <View className='flex flex-col items-center justify-center space-y-4'>
            <Text className='text-text-primary text-lg font-medium'>
              {title}
            </Text>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {description}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
