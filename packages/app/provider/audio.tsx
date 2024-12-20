import { AVPlaybackSource, Audio } from 'expo-av';
import { createContext, useContext, useMemo } from 'react';
import buyMode from '../assets/sounds/buy-mode.mp3';
import confirm1 from '../assets/sounds/confirm-1.mp3';
import confirm2 from '../assets/sounds/confirm-2.mp3';
import hover1 from '../assets/sounds/hover-1.mp3';
import hover2 from '../assets/sounds/hover-2.mp3';
import itemAppear from '../assets/sounds/item-appear.mp3';
import delete1 from '../assets/sounds/key-delete.mp3';
import key1 from '../assets/sounds/key-press-1.mp3';
import key2 from '../assets/sounds/key-press-2.mp3';
import key3 from '../assets/sounds/key-press-3.mp3';
import key4 from '../assets/sounds/key-press-4.mp3';
import levelUp from '../assets/sounds/level-up.mp3';
import lootboxOpen from '../assets/sounds/lootbox-open.mp3';
import menuClose from '../assets/sounds/menu-close.mp3';
import menuOpen from '../assets/sounds/menu-open.mp3';
import mintNest from '../assets/sounds/mint-nest.mp3';
import press1 from '../assets/sounds/press-1.mp3';
import pulse1 from '../assets/sounds/pulse-1.mp3';
import rewardsBg from '../assets/sounds/rewards-bg.mp3';
import sellMode from '../assets/sounds/sell-mode.mp3';
import closeSheet from '../assets/sounds/sheet-close.mp3';
import openSheet from '../assets/sounds/sheet-open.mp3';
import shellCrack1 from '../assets/sounds/shell-crack-1.mp3';
import shellEnter1 from '../assets/sounds/shell-enter-1.mp3';
import shellEnter2 from '../assets/sounds/shell-enter-2.mp3';
import sliderDrag from '../assets/sounds/slider-drag.mp3';
import unhover1 from '../assets/sounds/unhover-1.mp3';
import { useEffectOnSuccess, useLoadFunction } from '../common/hooks/loading';
import { Loadable, Preferences } from '../common/types';
import { tuple } from '../common/utils/functions';
import { composeLoadables, spreadLoadable } from '../common/utils/query';

type SoundKey =
  | 'hoverSound1'
  | 'hoverSound2'
  | 'unhoverSound1'
  | 'pressSound'
  | 'openSheetSound'
  | 'closeSheetSound'
  | 'keySound1'
  | 'keySound2'
  | 'keySound3'
  | 'keySound4'
  | 'deleteSound1'
  | 'sliderDragSound'
  | 'buyModeSound'
  | 'sellModeSound'
  | 'confirmSound1'
  | 'confirmSound2'
  | 'pulseSound1'
  | 'shellEnterSound1'
  | 'shellEnterSound2'
  | 'shellCrackSound1'
  | 'lootboxOpenSound'
  | 'rewardsBgSound'
  | 'itemAppearSound'
  | 'menuOpenSound'
  | 'menuCloseSound'
  | 'mintNestSound'
  | 'levelUpSound';

type Sounds = Record<SoundKey, Audio.Sound | undefined>;

async function initializeSounds() {
  const soundFiles: Record<SoundKey, AVPlaybackSource> = {
    hoverSound1: hover1,
    hoverSound2: hover2,
    unhoverSound1: unhover1,
    pressSound: press1,
    openSheetSound: openSheet,
    closeSheetSound: closeSheet,
    keySound1: key1,
    keySound2: key2,
    keySound3: key3,
    keySound4: key4,
    deleteSound1: delete1,
    sliderDragSound: sliderDrag,
    buyModeSound: buyMode,
    sellModeSound: sellMode,
    confirmSound1: confirm1,
    confirmSound2: confirm2,
    pulseSound1: pulse1,
    shellEnterSound1: shellEnter1,
    shellEnterSound2: shellEnter2,
    shellCrackSound1: shellCrack1,
    lootboxOpenSound: lootboxOpen,
    rewardsBgSound: rewardsBg,
    itemAppearSound: itemAppear,
    menuOpenSound: menuOpen,
    menuCloseSound: menuClose,
    mintNestSound: mintNest,
    levelUpSound: levelUp,
  };
  const newSounds: Sounds = {} as Sounds;
  for (const [key, file] of Object.entries(soundFiles)) {
    const sound = (await Audio.Sound.createAsync(file)).sound;
    newSounds[key as SoundKey] = sound;
  }

  //Configure options for different sounds here:
  newSounds.rewardsBgSound?.setStatusAsync({ isLooping: true });

  return newSounds;
}

interface IAudioContext {
  sounds: Sounds;
  toggleSounds: (muted: boolean) => Promise<void>;
}

const AudioContext = createContext<IAudioContext>({} as IAudioContext);

export function AudioContextProvider(props: {
  preferences: Loadable<Preferences>;
  children: React.ReactNode;
}) {
  const { preferences, children } = props;

  const { data: sounds } = useLoadFunction(initializeSounds);

  const soundData = useMemo(
    () => composeLoadables(preferences, sounds)(tuple),
    [...spreadLoadable(preferences), ...spreadLoadable(sounds)],
  );

  useEffectOnSuccess(soundData, ([preferences]) => {
    toggleSounds(preferences.audioMuted);
  });

  const toggleSounds = async (muted: boolean) => {
    if (!sounds.success) return;
    await Promise.all(
      Object.values(sounds.data).map((sound) =>
        sound?.setStatusAsync({ isMuted: muted }),
      ),
    );
  };

  const contextValue = useMemo(
    () => ({
      sounds: sounds.data ?? ({} as Sounds),
      toggleSounds,
    }),
    [...spreadLoadable(sounds)],
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudioContext = () => {
  return useContext(AudioContext);
};
