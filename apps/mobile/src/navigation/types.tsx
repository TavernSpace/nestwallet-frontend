import {
  AssetTransfer,
  IKeyring,
  RecipientAccount,
  SeedPhrase,
} from '@nestwallet/app/common/types';
import { RedeploySafeInput } from '@nestwallet/app/features/safe/types';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  INftBalance,
  IOAuthProvider,
  ITransaction,
  IUpsertWalletInput,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { SecretType } from '@nestwallet/app/screens/signer/reveal-key/types';
import {
  WalletDetailsTabParamList,
  WalletDetailsTab as _WalletDetailsTab,
} from '@nestwallet/app/screens/wallet-details/navigation/types';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Web3WalletTypes } from '@walletconnect/web3wallet';
import {
  ConnectionRequest,
  MessageRequest,
  TransactionRequest,
} from '../common/service/types';
import { EncryptionMetadata } from '../common/service/wallet-service';

export const Stack = createNativeStackNavigator<RootStackParamList>();
export const AuthStack = createNativeStackNavigator<AuthStackParamList>();
export const AddWalletStack =
  createNativeStackNavigator<AddWalletStackParamList>();
export const CreateSafeStack =
  createNativeStackNavigator<CreateSafeStackParamList>();
export const OnboardingStack =
  createNativeStackNavigator<OnboardingStackParamList>();
export const AppStack = createNativeStackNavigator<AppStackParamList>();
export const InternalConnectionApprovalStack =
  createNativeStackNavigator<InternalConnectionApprovalStackParamList>();
export const InternalMessageApprovalStack =
  createNativeStackNavigator<InternalMessageApprovalStackParamList>();
export const InternalTransactionApprovalStack =
  createNativeStackNavigator<InternalTransactionApprovalStackParamList>();

export const WalletStack = createNativeStackNavigator<WalletStackParamList>();
export const QuestStack = createNativeStackNavigator<QuestStackParamList>();
export const SettingsStack =
  createNativeStackNavigator<SettingsStackParamList>();

export const ProposalStack =
  createNativeStackNavigator<ProposalStackParamList>();

export const WalletDetailsTab = _WalletDetailsTab;

export type RootStackParamList = {
  app: NavigatorScreenParams<AppStackParamList>;
  internalConnectionApproval: NavigatorScreenParams<InternalConnectionApprovalStackParamList>;
  internalMessageApproval: NavigatorScreenParams<InternalMessageApprovalStackParamList>;
  internalTransactionApproval: NavigatorScreenParams<InternalTransactionApprovalStackParamList>;

  // Popup window approval screens
  auth: NavigatorScreenParams<AuthStackParamList>;
  onboarding: NavigatorScreenParams<OnboardingStackParamList>;
};

export type AuthStackParamList = {
  login: undefined;
  code: {
    email: string;
  };
  private: undefined;
};

export type OnboardingStackParamList = {
  addReferrer: {
    referralCode: string;
  };
};

export type AppStackParamList = {
  notifications: undefined;
  walletSelector: undefined;

  // wallets
  walletDetails?: {
    walletId?: string;
  } & ({} | NavigatorScreenParams<WalletDetailsTabParamList>);
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

  // modals
  addWallet: NavigatorScreenParams<AddWalletStackParamList>;
  wallet: NavigatorScreenParams<WalletStackParamList>;
  internalConnectionApproval: NavigatorScreenParams<InternalConnectionApprovalStackParamList>;
  internalMessageApproval: NavigatorScreenParams<InternalMessageApprovalStackParamList>;
  internalTransactionApproval: NavigatorScreenParams<InternalTransactionApprovalStackParamList>;
  quest: NavigatorScreenParams<QuestStackParamList>;
  onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type SettingsStackParamList = {
  index: { walletId?: string };

  // social settings
  promocode: undefined;
  addReferrer: { referralCode: string };

  // general settings
  backupWallet: undefined;
  uploadBackup: {
    passkey: boolean;
  };
  restoreBackup: {
    encryptionMetadata: EncryptionMetadata;
    passkey: boolean;
  };
  backupSuccess: {
    isRestore: boolean;
  };
  editProfile: undefined;
  updateEmail: undefined;
  updateEmailCode: { email: string };
  contacts: undefined;
  upsertContact: {
    contact?: IContact;
  };
  notificationSettings: undefined;
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
  };
  transferReview: {
    transfers: AssetTransfer[];
    walletId: string;
  };
  swapAsset: {
    walletId: string;
  };
  swap: {
    walletId: string;
    initialAsset?: ICryptoBalance;
  };
  receive: { walletId: string };
  transactionProposal: {
    proposalId: string;
    walletId: string;
  };
};

export type ProposalStackParamList = {
  transactionProposal: {
    proposalId: string;
    walletId: string;
  };
};

export type QuestStackParamList = {
  questGroupDetails: { groupID: string };
  questDetails: { walletId: string; questId: string };
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
  importWalletExistingSafe: undefined;
  importWalletAddSafe: undefined;
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
  importWalletSeedType: {
    blockchain: IBlockchainType;
    seed: string;
  };
  importWalletChooseAddresses: {
    blockchain: IBlockchainType;
    keyring?: IKeyring;
    walletType: IWalletType;
  };
  importWalletChooseName: {
    keyring: IKeyring;
    input: Partial<IUpsertWalletInput>;
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

export type InternalConnectionApprovalStackParamList = {
  connection: ApprovalParam<ConnectionRequest>;
};

export type InternalMessageApprovalStackParamList = {
  message: ApprovalParam<MessageRequest>;
  messageProposal: {
    messageId: string;
    walletId: string;
    dappData?: DappData;
  };
};

export type InternalTransactionApprovalStackParamList = {
  transaction: ApprovalParam<TransactionRequest>;
  transactionProposal: {
    proposalId: string;
    walletId: string;
    dappData?: DappData;
  };
};

///////////////////////////////////////////////////////////////////////////////
// Other Types
///////////////////////////////////////////////////////////////////////////////

export type DappData = {
  requestId: string;
  tabId?: number | undefined;
  isInternal?: boolean;
  walletConnect?: Web3WalletTypes.SessionRequest;
};

export type ApprovalParam<T> = {
  payload: T;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
