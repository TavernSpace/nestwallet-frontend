import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { adjust, withSize } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';

interface LanguageProps {
  currentLanguage: ILanguageCode;
  onLanguageChange: (language: ILanguageCode) => Promise<void>;
}

export function SetLanguageScreen(props: LanguageProps) {
  const { currentLanguage, onLanguageChange } = props;
  const { showSnackbar } = useSnackbar();

  const [loadingLanguage, setLoadingLanguage] = useState<
    ILanguageCode | undefined
  >(undefined);

  const handleLanguageChange = async (language: ILanguageCode) => {
    try {
      setLoadingLanguage(language);
      await onLanguageChange(language);
    } catch (err) {
      const error = parseError(
        err,
        'Something went wrong changing your language',
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoadingLanguage(undefined);
    }
  };

  const languages = [
    { code: ILanguageCode.En, name: 'English' },
    // { code: ILanguageCode.Es, name: 'Español' },
  ];

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='mt-4 flex w-full flex-col space-y-4'>
          <View className='bg-card overflow-hidden rounded-2xl'>
            <View className='flex flex-col'>
              {languages.map(({ code, name }, index) => (
                <View key={code}>
                  <ListItem
                    onPress={() => handleLanguageChange(code)}
                    disabled={!!loadingLanguage || code === currentLanguage}
                  >
                    <View className='flex flex-row items-center justify-between px-4 py-3'>
                      <Text className='text-text-primary text-sm font-medium'>
                        {name}
                      </Text>
                      {currentLanguage === loadingLanguage && (
                        <ActivityIndicator size={adjust(20)} />
                      )}
                      {currentLanguage === code && !loadingLanguage && (
                        <View
                          className='bg-primary/10 items-center justify-center rounded-full'
                          style={withSize(adjust(20))}
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            color={colors.primary}
                            size={adjust(14, 2)}
                          />
                        </View>
                      )}
                    </View>
                  </ListItem>
                  {index < languages.length - 1 && (
                    <View className='w-full px-4'>
                      <View className='bg-card-highlight h-[1px] w-full' />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
