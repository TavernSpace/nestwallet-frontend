import Transport from '@ledgerhq/hw-transport';
import type {
  AssetTransfer,
  IKeyring,
  RecipientAccount,
  SeedPhrase,
} from '@nestwallet/app/common/types';
import type { TrezorRequest } from '@nestwallet/app/features/keyring/trezor/types';
import type { RedeploySafeInput } from '@nestwallet/app/features/safe/types';
import type {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  INftBalance,
  IOAuthProvider,
  ITransaction,
  IUpsertWalletInput,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import type { SecretType } from '@nestwallet/app/screens/signer/reveal-key/types';
import { WalletDetailsTab as _WalletDetailsTab } from '@nestwallet/app/screens/wallet-details/navigation/types';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo';
import { createStackNavigator } from '@react-navigation/stack';

export const Stack = createStackNavigator<RootStackParamList>();
export const AuthStack = createStackNavigator<AuthStackParamList>();
export const AppStack = createStackNavigator<AppStackParamList>();
export const AddWalletStack = createStackNavigator<AddWalletStackParamList>();
export const CreateSafeStack = createStackNavigator<CreateSafeStackParamList>();
export const WalletStack = createStackNavigator<WalletStackParamList>();
export const QuestStack = createStackNavigator<QuestStackParamList>();

export const ApprovalStack = createStackNavigator<ApprovalStackParamList>();
export const IntroStack = createStackNavigator<IntroStackParamList>();
export const SettingsStack = createStackNavigator<SettingsStackParamList>();

export const InternalConnectionApprovalStack =
  createStackNavigator<InternalConnectionApprovalStackParamList>();
export const InternalChainApprovalStack =
  createStackNavigator<InternalChainApprovalStackParamList>();
export const InternalTransactionApprovalStack =
  createStackNavigator<InternalTransactionApprovalStackParamList>();
export const InternalMessageApprovalStack =
  createStackNavigator<InternalMessageApprovalStackParamList>();
export const InternalChooseProviderStack =
  createStackNavigator<InternalChooseProviderStackParamList>();

export const WalletDetailsTab = _WalletDetailsTab;

export type RootStackParamList = {
  intro: NavigatorScreenParams<IntroStackParamList>;
  app: NavigatorScreenParams<AppStackParamList>;
  auth: NavigatorScreenParams<AuthStackParamList>;

  // Popup window approval screens
  approval: NavigatorScreenParams<ApprovalStackParamList>;
  chooseProvider: RoutePayloadParam;
};

export type AuthStackParamList = {
  login?: {
    redirect?: RedirectType;
  };
  code: {
    email: string;
    redirect?: RedirectType;
  };
  private: {
    redirect?: RedirectType;
  };
};

export type AppStackParamList = {
  // organization
  notifications: undefined;
  walletSelector: undefined;

  // wallets
  walletDetails?: { walletId: string };
  nftDetails: { walletId: string; nft: INftBalance };
  transaction: { walletId: string; transaction: ITransaction | string };
  activateSafe: { walletId: string };
  editWallet: { walletId: string };
  walletProposals: { walletId: string };
  trade: {
    walletId: string;
    initialAsset: ICryptoBalance;
  };

  // proposal
  transactionProposal: {
    proposalId: string;
    walletId: string;
    dappData?: DappData;
  };
  messageProposal: {
    messageId: string;
    walletId: string;
    dappData?: DappData;
  };
  trezorRequest: {
    walletId: string;
    request: TrezorRequest;
    payload: string;
  };

  // modals
  addWallet: NavigatorScreenParams<AddWalletStackParamList>;
  settings: NavigatorScreenParams<SettingsStackParamList>;
  wallet: NavigatorScreenParams<WalletStackParamList>;
  quest: NavigatorScreenParams<QuestStackParamList>;

  // sidepanel dapp requests
  // each one needs a separate navigator so we can nest modals on them properly
  // Note: we keep these here instead of in a seperate navigator so they share a lockContext
  internalConnectionApproval: NavigatorScreenParams<InternalConnectionApprovalStackParamList>;
  internalTransactionApproval: NavigatorScreenParams<InternalTransactionApprovalStackParamList>;
  internalMessageApproval: NavigatorScreenParams<InternalMessageApprovalStackParamList>;
};

export type SettingsStackParamList = {
  index: { walletId?: string };

  // social settings
  promocode: undefined;

  // general settings
  editProfile: undefined;
  updateEmail: undefined;
  updateEmailCode: { email: string };
  contacts: undefined;
  upsertContact: {
    contact?: IContact;
  };
  notificationSettings: undefined;
  changePassword: undefined;
  setNewPassword: {
    reset: boolean;
  };
  setAutoLockTimer: undefined;
  setLanguage: undefined;

  // wallet settings
  editWallet: { walletId: string };
  editWalletSigners: { walletId: string };
  deriveMoreWallets: { walletId: string };
  revealKey: { walletId: string; data: string; secretType: SecretType };
  revealKeyWarning: { walletId: string; secretType: SecretType };
  multichainDeployChain: { walletId: string };
  multichainDeployExecute: { walletId: string; input: RedeploySafeInput };
  closeEmptyTokenAccounts: { walletId: string };
  walletVersion: { walletId: string };
};

export type WalletStackParamList = {
  transferAsset: {
    walletId: string;
    initialAsset?: ICryptoBalance | INftBalance;
    transfers?: AssetTransfer[];
    payload?: string;
  };
  transferReview: {
    transfers: AssetTransfer[];
    walletId: string;
    isRedirectedFromPopup?: boolean;
  };
  swapAsset: {
    walletId: string;
    payload?: string;
  };
  swap: {
    walletId: string;
    initialAsset?: ICryptoBalance;
    payload?: string;
  };
  receive: { walletId: string };
  transactionProposal: {
    proposalId: string;
    walletId: string;
    dappData?: DappData;
  };
};

export type QuestStackParamList = {
  questDetails: { walletId: string; questId: string };
  questGroupDetails: { groupID: string };
  connectOAuth: { oAuthProvider: IOAuthProvider };
  badges: undefined;
  skills: undefined;
  rewards: undefined;
  referral: undefined;
  updateReferralCode: undefined;
  referralDetails: undefined;
};

export type AddWalletStackParamList = {
  importWalletBlockchainType: undefined;
  importWalletType: {
    blockchain: IBlockchainType;
  };
  importWalletAddSafe: undefined;
  importWalletExistingSafe: undefined;
  importWalletPersonal: {
    blockchain: IBlockchainType;
  };
  importWalletCreateSeed: {
    blockchain: IBlockchainType;
    seedPhrase: SeedPhrase;
  };
  importWalletImportSeed: {
    blockchain: IBlockchainType;
  };
  importWalletPrivateKey: {
    blockchain: IBlockchainType;
  };
  importWalletChooseName: {
    keyring: IKeyring;
    input: Partial<IUpsertWalletInput>;
  };
  importWalletHardware: {
    blockchain: IBlockchainType;
  };
  importHardwareConnectLedger: {
    blockchain: IBlockchainType;
    action: 'import' | 'connect';
  };
  importWalletSeedType: {
    blockchain: IBlockchainType;
    seed: string;
  };
  importWalletChooseAddresses: {
    blockchain: IBlockchainType;
    transport?: Transport;
    keyring?: IKeyring;
    walletType: IWalletType;
  };
  importWalletChooseNames: {
    keyring?: IKeyring;
    inputs: IUpsertWalletInput[];
    walletType: IWalletType;
  };
  importSignerSuccess: {
    walletType: IWalletType;
  };
  createSafe: NavigatorScreenParams<CreateSafeStackParamList>;
  quickStart: undefined;
};

export type CreateSafeStackParamList = {
  signers: undefined;
  selectChain: {
    signers: RecipientAccount[];
  };
  safeSummary: {
    signers: RecipientAccount[];
    chainId: number;
    nonce: string;
    metadata: {
      name: string;
    };
  };
};

export type IntroStackParamList = {
  introInfo: undefined;
  introDapp: undefined;
};

export type ApprovalStackParamList = {
  connection: RoutePayloadParam;
  transaction: RoutePayloadParam;
  message: RoutePayloadParam;
};

export type InternalConnectionApprovalStackParamList = {
  connection: RoutePayloadParam;
};

export type InternalChainApprovalStackParamList = {
  chain: RoutePayloadParam;
};

export type InternalTransactionApprovalStackParamList = {
  transaction: RoutePayloadParam;
  transactionProposal: {
    proposalId: string;
    walletId: string;
    dappData?: DappData;
  };
};

export type InternalMessageApprovalStackParamList = {
  message: RoutePayloadParam;
  messageProposal: {
    messageId: string;
    walletId: string;
    dappData?: DappData;
  };
};

export type InternalChooseProviderStackParamList = {
  chooseProvider: RoutePayloadParam;
};

///////////////////////////////////////////////////////////////////////////////
// Other Types
///////////////////////////////////////////////////////////////////////////////

export type RoutePayloadParam = {
  payload: string;
  isInternal?: boolean;
};

export type DappData = {
  requestId: string;
  tabId?: number | undefined;
  isInternal?: boolean;
};

type RedirectType = To<
  ReactNavigation.RootParamList,
  keyof ReactNavigation.RootParamList
>;

///////////////////////////////////////////////////////////////////////////////
// Global Declarations
///////////////////////////////////////////////////////////////////////////////

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
