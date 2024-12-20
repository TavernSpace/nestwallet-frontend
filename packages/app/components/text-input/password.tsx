import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { styled } from 'nativewind';
import { forwardRef, useState } from 'react';
import { TextInput as RNTextInput, StyleProp, ViewStyle } from 'react-native';
import { TextInput } from '.';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';

interface PasswordInputProps {
  id?: string;
  password: string;
  placeholder?: string;
  errorText?: string;
  onPasswordChange: (password: string) => void;
  onSubmit?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}

export const PasswordInput = styled(
  forwardRef<RNTextInput, PasswordInputProps>(function (props, ref) {
    const {
      id = 'password',
      password,
      placeholder,
      errorText,
      onPasswordChange,
      onSubmit,
      style,
    } = props;

    const [hidden, setHidden] = useState(true);

    return (
      <View style={style}>
        <TextInput
          ref={ref}
          inputProps={{
            id,
            secureTextEntry: hidden,
            placeholder: placeholder ?? 'Enter your password',
            onChangeText: onPasswordChange,
            value: password,
            onSubmitEditing: onSubmit,
          }}
          errorText={errorText}
          endAdornment={
            <BaseButton
              className='pr-4'
              onPress={() => setHidden(!hidden)}
              tabIndex={-1}
            >
              <View className='flex h-4 w-4 items-center justify-center'>
                <FontAwesomeIcon
                  icon={hidden ? faEye : faEyeSlash}
                  size={adjust(16, 2)}
                  color={colors.textSecondary}
                />
              </View>
            </BaseButton>
          }
        />
      </View>
    );
  }),
);
