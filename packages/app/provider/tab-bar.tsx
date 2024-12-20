import { createContext, useContext, useMemo, useState } from 'react';

interface ITabBarVisibilityContext {
  isTabBarHidden: boolean;
  hideTabBar: VoidFunction;
  showTabBar: VoidFunction;
}

const TabBarVisibilityContext = createContext<ITabBarVisibilityContext>(
  {} as any,
);

export function TabBarVisibilityProvider(props: { children: React.ReactNode }) {
  const [isTabBarHidden, setIsTabBarHidden] = useState(false);

  const hideTabBar = () => {
    setIsTabBarHidden(true);
  };

  const showTabBar = () => {
    setIsTabBarHidden(false);
  };

  const context = useMemo(
    () => ({ isTabBarHidden, hideTabBar, showTabBar }),
    [isTabBarHidden],
  );

  return (
    <TabBarVisibilityContext.Provider value={context}>
      {props.children}
    </TabBarVisibilityContext.Provider>
  );
}

export const useTabBarVisibilityContext = () => {
  return useContext(TabBarVisibilityContext);
};
