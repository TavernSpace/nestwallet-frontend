import {
  ConnectedSite,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { View } from '@nestwallet/app/components/view';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { useState } from 'react';
import { WebSearchInput } from './search-input';
import { CurrentSiteSheet } from './site-sheet';

interface TopNavBarProps {
  wallet: IWallet;
  wallets: IWallet[];
  canGoBack: boolean;
  loading: boolean;
  currentSite?: ConnectedSite;
  showLandingPage: boolean;
  isBookmarked: boolean;
  onPressBack: VoidFunction;
  onPressReload: VoidFunction;
  onPressBookmark: VoidFunction;
  onFocus: VoidFunction;
  onSubmit: (text: string) => void;
  onHome: VoidPromiseFunction;
  onCloseLandingPage: VoidFunction;
  onWalletPress: VoidFunction;
}

export function TopNavBar(props: TopNavBarProps) {
  const {
    wallet,
    canGoBack,
    loading,
    currentSite,
    isBookmarked,
    onPressBack,
    onPressReload,
    onPressBookmark,
    onFocus,
    onSubmit,
    onHome,
    onCloseLandingPage,
    onWalletPress,
  } = props;

  const [showConnectionSheet, setShowConnectionSheet] = useState(false);

  return (
    <View className='-mt-2 flex h-16 w-full flex-row items-center px-4'>
      <WebSearchInput
        wallet={wallet}
        canGoBack={canGoBack}
        currentSite={currentSite}
        isBookmarked={isBookmarked}
        loading={loading}
        onBookmark={onPressBookmark}
        onPressReload={onPressReload}
        onPressBack={onPressBack}
        onFocus={onFocus}
        onSubmit={onSubmit}
        onCancel={() => {
          onCloseLandingPage();
        }}
        onHome={onHome}
        onSitePress={() => setShowConnectionSheet(true)}
        onWalletPress={onWalletPress}
      />
      {currentSite && (
        <CurrentSiteSheet
          isShowing={showConnectionSheet}
          currentSite={currentSite}
          onClose={() => setShowConnectionSheet(false)}
        />
      )}
    </View>
  );
}
