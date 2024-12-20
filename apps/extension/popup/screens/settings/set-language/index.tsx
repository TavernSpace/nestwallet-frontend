import { useLanguageContext } from '@nestwallet/app/provider/language';
import { SetLanguageScreen } from '@nestwallet/app/screens/settings/language/screen';
import { withUserContext } from '../../../provider/user/wrapper';

export const LanguageWithData = withUserContext(_LanguageWithData);

function _LanguageWithData() {
  const { language, setLanguage } = useLanguageContext();

  return (
    <SetLanguageScreen
      onLanguageChange={setLanguage}
      currentLanguage={language}
    />
  );
}
