import { useNavigation } from '@react-navigation/native';

export function useGoBackOrClose(shouldNavigate?: boolean) {
  const navigation = useNavigation();
  return () => {
    if (shouldNavigate) {
      navigation.getParent()?.goBack();
    } else {
      window.close();
    }
  };
}
