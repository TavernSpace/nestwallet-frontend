import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { ActionSheet } from '@nestwallet/app/components/sheet';
import { View } from '@nestwallet/app/components/view';
import { parseError } from '@nestwallet/app/features/errors';
import { getCurrentVersion } from '@nestwallet/app/features/version';
import {
  IBlockchainType,
  IMintStatus,
  IQuestGroupIdentifier,
  IQuestIdentifier,
  IRelayState,
  IWallet,
  useMintNestMutation,
  useVerifyRelayRequestMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { WalletRewardsIntro } from '@nestwallet/app/screens/wallet-details/rewards/intro-mint-screen';
import { WalletRewardsLoading } from '@nestwallet/app/screens/wallet-details/rewards/loading-mint-screen';
import { MintAnimationScreen } from '@nestwallet/app/screens/wallet-details/rewards/nest-home-screen/mint-animation-screen';
import { NestHomeWithQuery } from '@nestwallet/app/screens/wallet-details/rewards/nest-home-screen/query';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Portal } from 'react-native-paper';
import { useUserContext } from '../../../../provider/user';

export function WalletRewardsTab() {
  const { wallet } = useWalletContext();
  const { user, refetch: refetchUser, wallets } = useUserContext();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation();

  const [isMinting, setIsMinting] = useState(
    user.nestStatus === IMintStatus.Minting,
  );
  const [showLoadingSheet, setShowLoadingSheet] = useState(false);
  const [showMintAnimation, setShowMintAnimation] = useState(false);

  const mintNestMutation = useMutationEmitter(
    graphqlType.User,
    useMintNestMutation(),
  );

  const verifyRelayRequestMutation = useVerifyRelayRequestMutation();

  const handleQuestGroupAction = (groupID: IQuestGroupIdentifier) => {
    navigation.navigate('app', {
      screen: 'quest',
      params: {
        screen: 'questGroupDetails',
        params: {
          groupID: groupID,
        },
      },
    });
  };

  const handleQuestAction = (questID: IQuestIdentifier) => {
    navigation.navigate('app', {
      screen: 'quest',
      params: {
        screen: 'questDetails',
        params: {
          questId: questID,
          walletId: wallet.id,
        },
      },
    });
  };

  const handlePressRewards = () => {
    showSnackbar({
      message: 'Coming Soon!',
      severity: ShowSnackbarSeverity.success,
    });
    //TODO: Uncomment to re-enable rewards screen
    // navigation.navigate('app', {
    //   screen: 'quest',
    //   params: {
    //     screen: 'rewards',
    //   },
    // });
  };
  const handlePressReferral = () => {
    navigation.navigate('app', {
      screen: 'quest',
      params: {
        screen: 'referral',
      },
    });
  };

  const handleMint = async (wallet: IWallet) => {
    try {
      setIsMinting(true);
      setShowLoadingSheet(true);
      // TODO: if the refetch user fails here we currently need to close and reopen extension to
      // actually track mint status
      await mintNestMutation.mutateAsync({
        input: { walletId: wallet.id },
      });
    } catch (err) {
      const error = parseError(err, 'Mint failed');
      setShowLoadingSheet(false);
      setIsMinting(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleCreateWallet = () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletType',
        params: {
          blockchain: IBlockchainType.Evm,
        },
      },
    });
  };

  useEffect(() => {
    const verifyRelay = async () => {
      if (isMinting && user.nestRelayRequestId) {
        const result = await verifyRelayRequestMutation.mutateAsync({
          id: user.nestRelayRequestId,
        });
        if (
          result.verifyRelayRequest.state === IRelayState.Executed ||
          result.verifyRelayRequest.state === IRelayState.Finalized
        ) {
          await refetchUser();
          setIsMinting(false);
        }
      }
    };
    if (user.nestStatus === IMintStatus.Minting) {
      const interval = setInterval(verifyRelay, 5000);
      return () => clearInterval(interval);
    } else {
      return;
    }
  }, [user.nestStatus, user.nestRelayRequestId, isMinting]);

  return (
    <>
      <View className='h-full w-full items-center justify-center'>
        {user.nestStatus === IMintStatus.Minted ? (
          <NestHomeWithQuery
            user={user}
            version={getCurrentVersion()}
            refetchUser={refetchUser}
            onQuestGroupAction={handleQuestGroupAction}
            onQuestAction={handleQuestAction}
            onNavigateRewards={handlePressRewards}
            onNavigateReferral={handlePressReferral}
          />
        ) : (
          <WalletRewardsIntro
            minting={isMinting}
            wallets={wallets}
            handleMint={handleMint}
            onCreateWallet={handleCreateWallet}
          />
        )}

        <ActionSheet
          isShowing={showLoadingSheet}
          onClose={() => setShowLoadingSheet(false)}
          isFullHeight={true}
          hasTopInset={true}
          hasBottomInset={true}
        >
          <WalletRewardsLoading
            isMinting={isMinting}
            hideSheet={async () => {
              setShowLoadingSheet(false);
              setShowMintAnimation(true);
              await refetchUser();
            }}
          />
        </ActionSheet>
      </View>
      {showMintAnimation && (
        <Portal>
          <MintAnimationScreen onDismiss={() => setShowMintAnimation(false)} />
        </Portal>
      )}
    </>
  );
}
