export const getNestNftImage = (level: number, transparentBg?: boolean) => {
  if (transparentBg) {
    return `https://storage.googleapis.com/nestwallet-public-resource-bucket/nft/nest/nest-level${level}-noBG.png`;
  } else {
    return `https://storage.googleapis.com/nestwallet-public-resource-bucket/nft/nest/nest-level${level}.png`;
  }
};
