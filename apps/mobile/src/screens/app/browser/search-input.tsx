import {
  faChevronLeft,
  faMagnifyingGlass,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faHome,
  faLock,
  faShieldSlash,
} from '@fortawesome/pro-solid-svg-icons';
import {
  ConnectedSite,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { adjust, withSize } from '@nestwallet/app/common/utils/style';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { WalletAvatar } from '@nestwallet/app/components/avatar/wallet-avatar';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Text } from '@nestwallet/app/components/text';
import { RawTextInput } from '@nestwallet/app/components/text-input';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import cn from 'classnames';
import { useRef, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';
import { BrowserMenu } from './menu';

interface WebSearchInputProps {
  wallet: IWallet;
  canGoBack?: boolean;
  errorText?: string;
  loading: boolean;
  currentSite?: ConnectedSite;
  isBookmarked: boolean;
  onFocus: VoidFunction;
  onSubmit: (url: string) => void;
  onBookmark: VoidFunction;
  onPressReload: VoidFunction;
  onPressBack: VoidFunction;
  onSitePress: VoidFunction;
  onCancel: VoidFunction;
  onHome: VoidPromiseFunction;
  onWalletPress: VoidFunction;
}

export function WebSearchInput(props: WebSearchInputProps) {
  const {
    wallet,
    canGoBack,
    currentSite,
    loading,
    isBookmarked,
    onPressReload,
    onBookmark,
    onSubmit,
    onFocus,
    onPressBack,
    onSitePress,
    onCancel,
    onHome,
    onWalletPress,
  } = props;

  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');

  const textRef = useRef<TextInput>(null);

  const currentUrl = currentSite?.siteInfo?.url;
  const simplifiedText = extractDomainFromUrl(currentUrl) ?? '';
  const isHttps = !!currentUrl && currentUrl.startsWith('https://');

  return (
    <View className='w-full'>
      <View className='bg-card flex h-11 w-full flex-row items-center rounded-2xl pl-4 pr-2'>
        <View className='flex flex-1 flex-row'>
          <RawTextInput
            ref={textRef}
            className='text-text-primary inline-block w-full flex-1 text-sm font-normal outline-none'
            textContentType='URL'
            placeholder='Search'
            style={{ minHeight: 36 }}
            placeholderTextColor={colors.textPlaceholder}
            onBlur={() => {
              setFocused(false);
            }}
            textAlign='left'
            selectTextOnFocus={true}
            onChangeText={(newText: string) => setText(newText)}
            autoCapitalize='none'
            autoCorrect={false}
            keyboardType='web-search'
            value={text}
            lineHeightAdjustment={-1}
            onFocus={() => {
              setFocused(true);
              setText(currentUrl ?? '');
              onFocus();
            }}
            onSubmitEditing={(e) => onSubmit(e.nativeEvent.text)}
          />
        </View>
        {text.length > 0 ? (
          <BaseButton onPress={() => setText('')}>
            <View className='mr-2 flex items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faTimes}
                color={colors.textSecondary}
                size={20}
              />
            </View>
          </BaseButton>
        ) : (
          <BaseButton
            onPress={() => {
              Keyboard.dismiss();
              onCancel();
            }}
          >
            <View className='bg-card-highlight rounded-full px-3 py-1'>
              <Text className='text-text-secondary text-sm font-medium'>
                {'Cancel'}
              </Text>
            </View>
          </BaseButton>
        )}
      </View>
      {!focused && (
        <View className='bg-background absolute flex flex-row items-center space-x-3'>
          <BaseButton onPress={onWalletPress}>
            <WalletAvatar wallet={wallet} size={adjust(36)} />
          </BaseButton>
          <BaseButton
            className='flex-1'
            animationEnabled={false}
            rippleEnabled={false}
            onPress={() => {
              setFocused(true);
              onFocus();
              textRef.current?.focus();
            }}
          >
            <View className='bg-card flex h-11 flex-1 flex-row items-center rounded-2xl'>
              {currentSite && (
                <View className='w-16 pl-3'>
                  <BaseButton
                    disabled={!canGoBack}
                    className={canGoBack ? 'opacity-100' : 'opacity-10'}
                    onPress={onPressBack}
                  >
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      color={colors.textSecondary}
                      size={16}
                    />
                  </BaseButton>
                </View>
              )}
              <View className='flex flex-1 flex-row items-center space-x-4 px-4'>
                {loading ? (
                  <ActivityIndicator size={14} />
                ) : !simplifiedText ? (
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    color={colors.textSecondary}
                    size={14}
                  />
                ) : isHttps ? (
                  <FontAwesomeIcon
                    icon={faLock}
                    color={colors.success}
                    size={14}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faShieldSlash}
                    color={colors.failure}
                    size={14}
                  />
                )}

                <Text
                  className={cn('text-sm font-normal', {
                    'text-text-placeholder': !simplifiedText,
                    'text-text-primary': !!simplifiedText,
                  })}
                >
                  {simplifiedText ? simplifiedText : 'Browse Sites'}
                </Text>
              </View>
              {currentSite && (
                <View className='mr-1'>
                  <BrowserMenu
                    site={currentSite}
                    isFavorite={isBookmarked}
                    onFavorite={onBookmark}
                    onConnection={onSitePress}
                    onReload={onPressReload}
                    onHome={onHome}
                  />
                </View>
              )}
            </View>
          </BaseButton>
          {currentSite && (
            <BaseButton onPress={onHome}>
              <View
                className='bg-primary/10 items-center justify-center rounded-xl'
                style={withSize(40)}
              >
                <FontAwesomeIcon
                  icon={faHome}
                  color={colors.primary}
                  size={20}
                />
              </View>
            </BaseButton>
          )}
        </View>
      )}
    </View>
  );
}

function extractDomainFromUrl(url?: string): string | undefined {
  if (!url) return '';
  const domain = url.match(
    /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\\/\n?]+)/im,
  );
  return domain?.[1] ?? '';
}
