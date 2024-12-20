import { Option, OptionOrNullable, PublicKey } from '@metaplex-foundation/umi';
import {
  GetDataEnumKindContent,
  Serializer,
  array,
  bool,
  dataEnum,
  mapSerializer,
  option,
  publicKey as publicKeySerializer,
  scalarEnum,
  string,
  struct,
  u16,
  u64,
  u8,
} from '@metaplex-foundation/umi-serializers';

// Using code from @metaplex-foundation/mpl-token-metadata.
// Encountered issues with the package due to its CJS format; it lacks ESM support.
// Related issue: https://github.com/metaplex-foundation/umi/issues/39
// Most of this code was auto-generated with https://github.com/metaplex-foundation/kinobi

type ProgrammableConfig = { __kind: 'V1'; ruleSet: Option<PublicKey> };

type ProgrammableConfigArgs = {
  __kind: 'V1';
  ruleSet: OptionOrNullable<PublicKey>;
};

type MetadataAccountData = {
  key: Key;
  updateAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Option<Array<Creator>>;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: Option<number>;
  tokenStandard: Option<TokenStandard>;
  collection: Option<Collection>;
  uses: Option<Uses>;
  collectionDetails: Option<CollectionDetails>;
  programmableConfig: Option<ProgrammableConfig>;
};

type MetadataAccountDataArgs = {
  updateAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: OptionOrNullable<Array<CreatorArgs>>;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: OptionOrNullable<number>;
  tokenStandard: OptionOrNullable<TokenStandardArgs>;
  collection: OptionOrNullable<CollectionArgs>;
  uses: OptionOrNullable<UsesArgs>;
  collectionDetails: OptionOrNullable<CollectionDetailsArgs>;
  programmableConfig: OptionOrNullable<ProgrammableConfigArgs>;
};

export function getMetadataAccountDataSerializer(): Serializer<
  MetadataAccountDataArgs,
  MetadataAccountData
> {
  return mapSerializer<MetadataAccountDataArgs, any, MetadataAccountData>(
    struct<MetadataAccountData>(
      [
        ['key', getKeySerializer()],
        ['updateAuthority', publicKeySerializer()],
        ['mint', publicKeySerializer()],
        ['name', string()],
        ['symbol', string()],
        ['uri', string()],
        ['sellerFeeBasisPoints', u16()],
        ['creators', option(array(getCreatorSerializer()))],
        ['primarySaleHappened', bool()],
        ['isMutable', bool()],
        ['editionNonce', option(u8())],
        ['tokenStandard', option(getTokenStandardSerializer())],
        ['collection', option(getCollectionSerializer())],
        ['uses', option(getUsesSerializer())],
        ['collectionDetails', option(getCollectionDetailsSerializer())],
        ['programmableConfig', option(getProgrammableConfigSerializer())],
      ],
      { description: 'MetadataAccountData' },
    ),
    (value) => ({ ...value, key: Key.MetadataV1 }),
  ) as Serializer<MetadataAccountDataArgs, MetadataAccountData>;
}

enum Key {
  Uninitialized,
  EditionV1,
  MasterEditionV1,
  ReservationListV1,
  MetadataV1,
  ReservationListV2,
  MasterEditionV2,
  EditionMarker,
  UseAuthorityRecord,
  CollectionAuthorityRecord,
  TokenOwnedEscrow,
  TokenRecord,
  MetadataDelegate,
  EditionMarkerV2,
  HolderDelegate,
}

type KeyArgs = Key;

function getKeySerializer(): Serializer<KeyArgs, Key> {
  return scalarEnum<Key>(Key, { description: 'Key' }) as Serializer<
    KeyArgs,
    Key
  >;
}

type Creator = {
  address: PublicKey;
  verified: boolean;
  share: number;
};

type CreatorArgs = Creator;

function getCreatorSerializer(): Serializer<CreatorArgs, Creator> {
  return struct<Creator>(
    [
      ['address', publicKeySerializer()],
      ['verified', bool()],
      ['share', u8()],
    ],
    { description: 'Creator' },
  ) as Serializer<CreatorArgs, Creator>;
}

enum TokenStandard {
  NonFungible,
  FungibleAsset,
  Fungible,
  NonFungibleEdition,
  ProgrammableNonFungible,
  ProgrammableNonFungibleEdition,
}

type TokenStandardArgs = TokenStandard;

function getTokenStandardSerializer(): Serializer<
  TokenStandardArgs,
  TokenStandard
> {
  return scalarEnum<TokenStandard>(TokenStandard, {
    description: 'TokenStandard',
  }) as Serializer<TokenStandardArgs, TokenStandard>;
}

type Collection = { verified: boolean; key: PublicKey };

type CollectionArgs = Collection;

function getCollectionSerializer(): Serializer<CollectionArgs, Collection> {
  return struct<Collection>(
    [
      ['verified', bool()],
      ['key', publicKeySerializer()],
    ],
    { description: 'Collection' },
  ) as Serializer<CollectionArgs, Collection>;
}

enum UseMethod {
  Burn,
  Multiple,
  Single,
}

type UseMethodArgs = UseMethod;

function getUseMethodSerializer(): Serializer<UseMethodArgs, UseMethod> {
  return scalarEnum<UseMethod>(UseMethod, {
    description: 'UseMethod',
  }) as Serializer<UseMethodArgs, UseMethod>;
}

type Uses = { useMethod: UseMethod; remaining: bigint; total: bigint };

type UsesArgs = {
  useMethod: UseMethodArgs;
  remaining: number | bigint;
  total: number | bigint;
};

function getUsesSerializer(): Serializer<UsesArgs, Uses> {
  return struct<Uses>(
    [
      ['useMethod', getUseMethodSerializer()],
      ['remaining', u64()],
      ['total', u64()],
    ],
    { description: 'Uses' },
  ) as Serializer<UsesArgs, Uses>;
}

type CollectionDetails =
  | { __kind: 'V1'; size: bigint }
  | { __kind: 'V2'; padding: Array<number> };

type CollectionDetailsArgs =
  | { __kind: 'V1'; size: number | bigint }
  | { __kind: 'V2'; padding: Array<number> };

function getCollectionDetailsSerializer(): Serializer<
  CollectionDetailsArgs,
  CollectionDetails
> {
  return dataEnum<CollectionDetails>(
    [
      [
        'V1',
        struct<GetDataEnumKindContent<CollectionDetails, 'V1'>>([
          ['size', u64()],
        ]),
      ],
      [
        'V2',
        struct<GetDataEnumKindContent<CollectionDetails, 'V2'>>([
          ['padding', array(u8(), { size: 8 })],
        ]),
      ],
    ],
    { description: 'CollectionDetails' },
  ) as Serializer<CollectionDetailsArgs, CollectionDetails>;
}

function getProgrammableConfigSerializer(): Serializer<
  ProgrammableConfigArgs,
  ProgrammableConfig
> {
  return dataEnum<ProgrammableConfig>(
    [
      [
        'V1',
        struct<GetDataEnumKindContent<ProgrammableConfig, 'V1'>>([
          ['ruleSet', option(publicKeySerializer())],
        ]),
      ],
    ],
    { description: 'ProgrammableConfig' },
  ) as Serializer<ProgrammableConfigArgs, ProgrammableConfig>;
}
