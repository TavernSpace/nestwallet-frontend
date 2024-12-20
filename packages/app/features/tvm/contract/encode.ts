import { Address, beginCell, Cell } from '@ton/ton';
import nacl from 'tweetnacl';

export const getCommentBody = (comment: string) => {
  return beginCell()
    .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
    .storeStringTail(comment) // write our text comment
    .endCell();
};

export const getJettonTransferBody = (
  dest: string,
  src: string,
  amount: bigint,
  queryId: bigint,
  forwardAmount?: bigint,
  forwardPayload?: Cell,
) => {
  // transfer#0f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
  // response_destination:MsgAddress custom_payload:(Maybe ^Cell)
  // forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
  // = InternalMsgBody;
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer op code
    .storeUint(queryId, 64) // query_id:uint64
    .storeCoins(amount) // amount:(VarUInteger 16) -  Jetton amount for transfer (decimals = 6 - jUSDT, 9 - default)
    .storeAddress(Address.parse(dest)) // destination:MsgAddress
    .storeAddress(Address.parse(src)) // response_destination:MsgAddress
    .storeUint(0, 1)
    .storeCoins(forwardAmount ?? 1n) // forward_ton_amount:(VarUInteger 16) - if >0, will send notification message
    .storeMaybeRef(forwardPayload) // forward_payload:(Either Cell ^Cell)
    .endCell();
};

export const getNFTTransferBody = (
  dest: string,
  src: string,
  queryId: bigint,
  forwardAmount?: bigint,
  forwardPayload?: Cell,
) => {
  return beginCell()
    .storeUint(0x5fcc3d14, 32) // nft transfer op code
    .storeUint(queryId, 64)
    .storeAddress(Address.parse(dest))
    .storeAddress(Address.parse(src))
    .storeBit(false)
    .storeCoins(forwardAmount ?? 0n)
    .storeMaybeRef(forwardPayload)
    .endCell();
};

export const generateQueryId = () => {
  return beginCell()
    .storeUint(0x3f5db764, 32) //crc32("nestw")
    .storeBuffer(Buffer.from(nacl.randomBytes(4))) //random 32 bits
    .asSlice()
    .loadIntBig(64);
};
