import {
  ILootboxReward,
  ILootboxRewardType,
} from '../../../graphql/client/generated/graphql';

export interface IRewardQuantities {
  rewardType: ILootboxRewardType;
  quantity: number;
}

export interface IGroupedRewards {
  claimed: IRewardQuantities[];
  distributed: IRewardQuantities[];
}
export interface IRewardRarity {
  name: string;
  color: string;
}

export type ILootboxRewardWithMetadata = {
  name: string;
  image: ImageData;
  rarity: IRewardRarity;
  description: string;
} & ILootboxReward;
