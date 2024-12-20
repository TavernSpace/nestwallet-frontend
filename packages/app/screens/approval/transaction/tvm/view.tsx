import { faBolt } from '@fortawesome/pro-solid-svg-icons';
import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { Loadable, Origin } from '../../../../common/types';
import { convertWalletTypeToLabel } from '../../../../common/utils/types';
import { WarningBanner } from '../../../../components/banner/warning';
import { TextButton } from '../../../../components/button/text-button';
import { ScrollView } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { isHardwareWallet } from '../../../../features/wallet/utils';
import {
  IContact,
  ITransactionEvents,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import {
  GeneralInfoCard,
  WalletChangeCard,
} from '../../../../molecules/transaction/card';
import { useLanguageContext } from '../../../../provider/language';
import { RequestHeader } from '../../header';
import { ConnectionType } from '../../types';
import { localization } from '../localization';

interface ApprovalTvmTransactionViewProps {
  origin?: Origin;
  wallet: IWallet;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
  chainId: number;
  missingKeyring: boolean;
  simulatedEvents: Loadable<ITransactionEvents>;
  connectionType: ConnectionType;
  onCancel: VoidFunction;
  onExecute: VoidFunction;
}

export function ApprovalTvmTransactionView(
  props: ApprovalTvmTransactionViewProps,
) {
  const {
    origin,
    wallet,
    wallets,
    contacts,
    chainId,
    missingKeyring,
    simulatedEvents,
    connectionType,
    onExecute,
    onCancel,
  } = props;
  const { language } = useLanguageContext();

  const isMobileHardware = isHardwareWallet(wallet) && Platform.OS !== 'web';
  const viewOnlyWallet = missingKeyring || isMobileHardware;
  const isDisabled = viewOnlyWallet;

  return (
    <View className='bg-background absolute h-full w-full'>
      <ViewWithInset
        className='flex h-full w-full flex-col'
        hasBottomInset={true}
      >
        <RequestHeader
          origin={origin}
          connectionType={connectionType}
          icon={faBolt}
          text={localization.transactionRequest[language]}
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex flex-col space-y-3 px-4 pt-3'>
            {viewOnlyWallet && (
              <WarningBanner
                title={
                  isMobileHardware
                    ? localization.viewOnly(
                        convertWalletTypeToLabel(wallet.type),
                      )[language]
                    : localization.missingImport[language]
                }
                body={
                  isMobileHardware
                    ? localization.mobileHardwareWarning[language]
                    : localization.importedOnAnotherDeviceWarning[language]
                }
              />
            )}
            <GeneralInfoCard
              type='proposal'
              wallet={wallet}
              chainId={chainId}
              gasData={
                simulatedEvents.data?.refund
                  ? {
                      gasFee: simulatedEvents.data.refund.quantity.startsWith(
                        '-',
                      )
                        ? simulatedEvents.data.refund.quantity.slice(1)
                        : simulatedEvents.data.refund.quantity,
                      gasToken: simulatedEvents.data.refund.tokenMetadata,
                      gasFeeInUSD:
                        parseFloat(
                          ethers.formatUnits(
                            simulatedEvents.data.refund.quantity,
                            simulatedEvents.data.refund.tokenMetadata.decimals,
                          ),
                        ) *
                        parseFloat(
                          simulatedEvents.data.refund.tokenMetadata.price,
                        ),
                    }
                  : undefined
              }
              initialCollapsed={false}
            />
            <WalletChangeCard
              wallet={wallet}
              wallets={wallets}
              contacts={contacts.data ?? []}
              chainId={chainId}
              type='proposal'
              events={simulatedEvents}
              isComplete={false}
            />
          </View>
        </ScrollView>
        <View className='flex flex-row items-center justify-between space-x-4 px-4 pt-2'>
          <TextButton
            className='flex-1'
            onPress={onCancel}
            type='tertiary'
            text={localization.cancel[language]}
          />
          <TextButton
            className='flex-1'
            onPress={onExecute}
            disabled={isDisabled}
            text={localization.confirm[language]}
          />
        </View>
      </ViewWithInset>
    </View>
  );
}
