import cn from 'classnames';
import { styled } from 'nativewind';
import { useState } from 'react';
import {
  ScrollView as RNScrollView,
  RefreshControl,
  ScrollViewProps,
} from 'react-native';
import { minTime } from '../../common/api/utils';
import { VoidPromiseFunction } from '../../common/types';
import { colors } from '../../design/constants';

interface ScrollWrapperProps extends ScrollViewProps {
  refetchers?: (VoidPromiseFunction | undefined)[];
}

export const ScrollView = styled(RNScrollView);

export function ScrollWrapper(props: ScrollWrapperProps) {
  const { className, children, scrollEnabled, refetchers, ...viewProps } =
    props;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const validRefetchers = (refetchers ?? []).filter(
    (refetch): refetch is VoidPromiseFunction => !!refetch,
  );

  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      await minTime(
        Promise.all(validRefetchers.map((refetch) => refetch())),
        500,
      );
    } catch (err) {
      // TODO: what to do if refresh fails?
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshControl =
    validRefetchers.length > 0 ? (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        colors={[colors.primary]}
        progressBackgroundColor={colors.cardHighlight}
        tintColor={colors.primary}
      />
    ) : undefined;

  return (
    <ScrollView
      className={cn(className, 'absolute h-full w-full')}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      {...viewProps}
      contentContainerStyle={{
        flexGrow: 1,
        flexDirection: 'column',
      }}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}
