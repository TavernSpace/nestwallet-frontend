import noResults from '../../assets/images/no-results.png';
import { Image } from '../../components/image';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';

export const SelectEmptyState = (props: {
  subHeader: string;
  paragraph: string;
}) => {
  const { subHeader, paragraph } = props;
  return (
    <View className='-mx-2 mb-2 mt-4 flex flex-col items-center'>
      <Image
        source={noResults}
        tintColor={colors.primary}
        style={{ width: 48, height: 48 }}
      />
      <Text className='text-text-primary mt-4 text-lg font-medium'>
        {subHeader}
      </Text>
      <Text className='text-text-secondary my-2 text-sm font-normal'>
        {paragraph}
      </Text>
    </View>
  );
};
