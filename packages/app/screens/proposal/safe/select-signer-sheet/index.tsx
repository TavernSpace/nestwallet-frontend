import { SafeInfoResponse } from '@safe-global/api-kit';
import { Platform } from 'react-native';
import {
  ISignerWallet,
  LoadField,
  Loadable,
  TaggedSafeProposal,
} from '../../../../common/types';
import { onLoadable } from '../../../../common/utils/query';
import { adjust } from '../../../../common/utils/style';
import {
  FlatList,
  RenderItemProps,
} from '../../../../components/flashlist/flat-list';
import { ListItem } from '../../../../components/list/list-item';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { View } from '../../../../components/view';
import {
  SafeSignerInfo,
  useSafeSignerInfo,
} from '../../../../features/proposal/signer';
import { isHardwareWallet } from '../../../../features/wallet/utils';
import { IContact } from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { SafeSignerInfoItem } from '../signing-sheet/signer-info-item';
import { localization } from './localization';

interface SafeSelectSignerContentProps {
  signer?: ISignerWallet;
  signers: ISignerWallet[];
  safeInfo: Loadable<SafeInfoResponse>;
  proposal: TaggedSafeProposal;
  contacts: Loadable<IContact[]>;
  onSelectSigner: (wallet: ISignerWallet) => void;
  onClose: VoidFunction;
}

export function SafeSelectSignerContent(props: SafeSelectSignerContentProps) {
  const { safeInfo, onClose, onSelectSigner } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex h-full w-full flex-col'>
      <ActionSheetHeader
        title={localization.selectSigner[language]}
        onClose={onClose}
        type='fullscreen'
      />
      {onLoadable(safeInfo)(
        () => null,
        () => null,
        (safeInfo) => (
          <SafeSignerList
            {...props}
            safeInfo={safeInfo}
            onSelectSigner={onSelectSigner}
          />
        ),
      )}
    </View>
  );
}

type SafeSignerListProps = LoadField<SafeSelectSignerContentProps, 'safeInfo'>;

function SafeSignerList(props: SafeSignerListProps) {
  const { signer, signers, contacts, safeInfo, proposal, onSelectSigner } =
    props;
  const signerInfo = useSafeSignerInfo(
    signers,
    contacts.data ?? [],
    safeInfo,
    proposal.type === 'transaction' ? proposal.proposal : undefined,
    proposal.type === 'message' ? proposal.proposal : undefined,
  );
  const deviceUnsigned = signerInfo.filter(
    (signerInfo) =>
      signerInfo.signer && !signerInfo.hasSigned && signerInfo.hasKeyring,
  );
  const otherDeviceUnsigned = signerInfo.filter(
    (signerInfo) =>
      signerInfo.signer && !signerInfo.hasSigned && !signerInfo.hasKeyring,
  );
  const externalUnsigned = signerInfo.filter(
    (signerInfo) => !signerInfo.signer && !signerInfo.hasSigned,
  );
  const signed = signerInfo.filter((signerInfo) => signerInfo.hasSigned);

  const isDisabled = (signerInfo: SafeSignerInfo) => {
    return (
      !signerInfo.signer ||
      signerInfo.hasSigned ||
      !signerInfo.hasKeyring ||
      signed.length >= safeInfo.threshold ||
      (Platform.OS !== 'web' && isHardwareWallet(signerInfo.signer))
    );
  };

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<SafeSignerInfo, ISignerWallet | undefined>) => (
    <ListItem
      disabled={isDisabled(item)}
      onPress={() => onSelectSigner({ ...item.signer!, hasKeyring: true })}
    >
      <SafeSignerInfoItem
        signerInfo={item}
        isSelected={extraData?.address === item.address}
      />
    </ListItem>
  );

  return (
    <View className='flex flex-1 flex-col'>
      <FlatList
        data={deviceUnsigned
          .concat(otherDeviceUnsigned)
          .concat(externalUnsigned)
          .concat(signed)}
        extraData={signer}
        estimatedItemSize={adjust(64)}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}
