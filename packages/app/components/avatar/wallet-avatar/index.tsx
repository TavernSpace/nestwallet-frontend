import { faKeySkeleton, faSeedling } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { memo } from 'react';
import LedgerIcon from '../../../assets/images/logos/ledger.png';
import SafeLogo from '../../../assets/images/logos/safe-logo-green.png';
import TrezorIcon from '../../../assets/images/logos/trezor.png';
import { NestWalletClient } from '../../../common/api/nestwallet/client';
import { adjust, withSize } from '../../../common/utils/style';
import { colors } from '../../../design/constants';
import { getChainInfo, onBlockchain } from '../../../features/chain';
import { useLedgerDeviceConnected } from '../../../features/keyring/ledger/connection';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { Badge } from '../../badge';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Image } from '../../image';
import { View } from '../../view';
import { WalletIcon } from '../../wallet-icon';
import { BlockchainAvatar } from '../blockchain-avatar';
import { ChainAvatar } from '../chain-avatar';

interface IWalletAvatarProps {
  wallet: IWallet;
  safeBadge?: boolean;
  borderColor?: string;
  size: number;
}

export const WalletAvatar = memo((props: IWalletAvatarProps) => {
  const { wallet, safeBadge = false, borderColor, size } = props;

  const badgeSize =
    size >= 36
      ? adjust(14, 2)
      : size >= 30
      ? adjust(12, 2)
      : size >= 24
      ? adjust(12, 0)
      : adjust(8, 2);

  if (wallet.profilePicture) {
    const avatar = (
      <Image
        className='rounded-full'
        source={{
          uri: NestWalletClient.getFileURL(wallet.profilePicture.id),
        }}
        style={withSize(size)}
      />
    );
    return (
      <View>
        {wallet.type === IWalletType.Ledger ? (
          <LedgerWalletAvatar size={badgeSize}>{avatar}</LedgerWalletAvatar>
        ) : wallet.type === IWalletType.Trezor ? (
          <TrezorWalletAvatar size={badgeSize}>{avatar}</TrezorWalletAvatar>
        ) : wallet.type === IWalletType.Safe ? (
          <SafeWalletAvatar size={badgeSize} badge={safeBadge}>
            {avatar}
          </SafeWalletAvatar>
        ) : (
          avatar
        )}
        <View className='absolute -bottom-0.5 -right-0.5'>
          {wallet.type === IWalletType.Safe ? (
            <ChainAvatar
              chainInfo={getChainInfo(wallet.chainId)}
              size={badgeSize}
              border={true}
              borderColor={borderColor}
            />
          ) : (
            <BlockchainAvatar
              blockchain={wallet.blockchain}
              size={badgeSize}
              border={true}
              borderColor={borderColor}
            />
          )}
        </View>
      </View>
    );
  } else if (wallet.type === IWalletType.Safe) {
    return (
      <View>
        <SafeDefaultAvatar badge={safeBadge} size={size} />
        <View className='absolute -bottom-0.5 -right-0.5'>
          <ChainAvatar
            chainInfo={getChainInfo(wallet.chainId)}
            size={badgeSize}
            border={true}
            borderColor={borderColor}
          />
        </View>
      </View>
    );
  } else if (wallet.type === IWalletType.Ledger) {
    return (
      <View>
        <LedgerDefaultAvatar size={size} />
        <View className='absolute -bottom-0.5 -right-0.5'>
          <BlockchainAvatar
            blockchain={wallet.blockchain}
            size={badgeSize}
            border={true}
            borderColor={borderColor}
          />
        </View>
      </View>
    );
  } else if (wallet.type === IWalletType.Trezor) {
    return (
      <View>
        <Image
          className='rounded-full'
          style={withSize(size)}
          source={TrezorIcon}
        />
        <View className='absolute -bottom-0.5 -right-0.5'>
          <BlockchainAvatar
            blockchain={wallet.blockchain}
            size={badgeSize}
            border={true}
            borderColor={borderColor}
          />
        </View>
      </View>
    );
  } else if (wallet.type === IWalletType.SeedPhrase) {
    return (
      <View>
        <View
          className={cn('flex items-center justify-center rounded-full', {
            'bg-seed-primary/10': wallet.blockchain === IBlockchainType.Evm,
            'bg-seed-secondary/10': wallet.blockchain === IBlockchainType.Svm,
            'bg-seed-tertiary/10': wallet.blockchain === IBlockchainType.Tvm,
          })}
          style={withSize(size)}
        >
          <FontAwesomeIcon
            icon={faSeedling}
            size={size / 1.8}
            color={onBlockchain(wallet.blockchain)(
              () => colors.seedPrimary,
              () => colors.seedSecondary,
              () => colors.seedTertiary,
            )}
          />
        </View>
        <View className='absolute -bottom-0.5 -right-0.5'>
          <BlockchainAvatar
            blockchain={wallet.blockchain}
            size={badgeSize}
            border={true}
            borderColor={borderColor}
          />
        </View>
      </View>
    );
  } else if (wallet.type === IWalletType.PrivateKey) {
    return (
      <View>
        <View
          className={cn('flex items-center justify-center rounded-full', {
            'bg-key-primary/10': wallet.blockchain === IBlockchainType.Evm,
            'bg-key-secondary/10': wallet.blockchain === IBlockchainType.Svm,
            'bg-key-tertiary/10': wallet.blockchain === IBlockchainType.Tvm,
          })}
          style={withSize(size)}
        >
          <FontAwesomeIcon
            icon={faKeySkeleton}
            size={size / 1.8}
            color={onBlockchain(wallet.blockchain)(
              () => colors.keyPrimary,
              () => colors.keySecondary,
              () => colors.keyTertiary,
            )}
          />
        </View>
        <View className='absolute -bottom-0.5 -right-0.5'>
          <BlockchainAvatar
            blockchain={wallet.blockchain}
            size={badgeSize}
            border={true}
            borderColor={borderColor}
          />
        </View>
      </View>
    );
  } else {
    return <WalletIcon size={size} defaultStyle='primary' />;
  }
});

const LedgerWalletAvatar = memo(
  (props: {
    size: number;
    children: React.ReactNode;
    borderColor?: string;
  }) => {
    const { size, borderColor = colors.background, children } = props;
    const connected = useLedgerDeviceConnected();

    const iconSize = size > 12 ? 6 : 4;
    const borderSize = size > 12 ? 4 : 2;

    return (
      <View className='relative'>
        {children}
        <View
          className='absolute -right-0.5 -top-0.5 items-center justify-center rounded-full'
          style={{
            ...withSize(size + borderSize),
            backgroundColor: borderColor,
          }}
        >
          <Badge
            color={colors.success}
            size={iconSize}
            borderSize={borderSize}
            hidden={connected}
            containerStyle={{
              bottom: -iconSize / 2,
              right: -iconSize / 2,
              backgroundColor: borderColor,
            }}
          >
            <Image
              className='rounded-full'
              style={withSize(size)}
              source={LedgerIcon}
            />
          </Badge>
        </View>
      </View>
    );
  },
);

const LedgerDefaultAvatar = memo(
  (props: { size: number; borderColor?: string }) => {
    const { size, borderColor = colors.background } = props;
    const connected = useLedgerDeviceConnected();

    const iconSize = size > 12 ? 6 : 4;
    const borderSize = size > 12 ? 4 : 2;

    return (
      <Badge
        size={iconSize}
        borderSize={borderSize}
        color={colors.success}
        hidden={!connected}
        containerStyle={{ top: 0, right: 0, backgroundColor: borderColor }}
      >
        <Image
          className='rounded-full'
          style={withSize(size)}
          source={LedgerIcon}
        />
      </Badge>
    );
  },
);

const TrezorWalletAvatar = memo(
  (props: {
    size: number;
    children: React.ReactNode;
    borderColor?: string;
  }) => {
    const { size, children, borderColor = colors.background } = props;

    const borderSize = size > 12 ? 4 : 2;

    return (
      <View className='relative'>
        {children}
        <View
          className='absolute -right-0.5 -top-0.5 items-center justify-center rounded-full'
          style={{
            ...withSize(size + borderSize),
            backgroundColor: borderColor,
          }}
        >
          <Image
            className='rounded-full'
            style={withSize(size)}
            source={TrezorIcon}
          />
        </View>
      </View>
    );
  },
);

const SafeDefaultAvatar = memo(
  (props: { size: number; badge: boolean; borderColor?: string }) => {
    const { badge, borderColor = colors.background, size } = props;

    return (
      <Badge
        hidden={!badge}
        containerStyle={{ top: 0, right: 0, backgroundColor: borderColor }}
      >
        <Image
          className='rounded-full'
          style={withSize(size)}
          source={SafeLogo}
        />
      </Badge>
    );
  },
);

const SafeWalletAvatar = memo(
  (props: {
    size: number;
    badge: boolean;
    borderColor?: string;
    children: React.ReactNode;
  }) => {
    const { size, badge, borderColor = colors.background, children } = props;

    const borderSize = size > 12 ? 4 : 2;

    return (
      <View className='relative'>
        {children}
        <View
          className='absolute -right-0.5 -top-0.5 items-center justify-center rounded-full'
          style={{
            ...withSize(size + borderSize),
            backgroundColor: borderColor,
          }}
        >
          <Badge
            size={6}
            hidden={!badge}
            containerStyle={{
              bottom: -3,
              right: -3,
              backgroundColor: borderColor,
            }}
          >
            <Image
              className='rounded-full'
              style={withSize(size)}
              source={SafeLogo}
            />
          </Badge>
        </View>
      </View>
    );
  },
);
