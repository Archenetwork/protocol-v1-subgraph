import { BigInt } from "@graphprotocol/graph-ts"
import {
  Contract,
  E_Claim_For_Head,
  E_Claim_For_Tail,
  E_Create,
  E_Deposit_For_Head,
  E_Deposit_For_Tail,
  E_Entanglement,
  E_Initialize,
  E_Withdraw_Head,
  E_Withdraw_Tail,
  OwnershipTransferred
} from "../generated/Contract/Contract"
import { ExampleEntity } from "../generated/schema"

// 支付保证金（正面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Head(event: E_Claim_For_Head): void {
  let entity = ExampleEntity.load(event.transaction.from.toHex())
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())
    entity.count = BigInt.fromI32(0)
  }
  entity.count = entity.count + BigInt.fromI32(1)
  entity.swap = event.params.swap
  entity.user = event.params.user
  entity.save()
}

/**
  event E_Create(address swap ,address user,address swap_owner ,address token_head,address token_tail,uint256 sys_reward);
  event E_Entanglement(address swap ,address user ,address op_token_head,address op_token_tail);
  event E_Initialize(address swap ,address user,uint256 total_amount_head ,uint256 total_amount_tail ,uint256 limit_head ,uint256 limit_tail ,address rival_head,address rival_tail , uint256 pair_dlo ,uint256 option_dlo);
  event E_Claim_For_Head(address swap ,address user,address referer);
  event E_Claim_For_Tail(address swap ,address user,address referer);
  event E_Deposit_For_Head(address swap ,address user, uint256 amount,uint256 deposited_amount);
  event E_Deposit_For_Tail(address swap ,address user, uint256 amount,uint256 deposited_amount);
  event E_Withdraw_Head(address swap ,address user ,uint256 status);
  event E_Withdraw_Tail(address swap ,address user ,uint256 status);
*/  
// // 支付保证金（反面） 参数为 交易对合约地址，操作用户 ，邀请人
// export function handleE_Claim_For_Tail(event: E_Claim_For_Tail): void {
//   event.params.referer
  
// }

// 创建交易对 参数为 交易对合约地址，操作用户，交易对合约拥有人， 代币地址（正面），代币地址（反面）, 赏金。注意，创建交易对之后需要对其初始化
export function handleE_Create(event: E_Create): void {

}

// // 支付代币（正面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
// export function handleE_Deposit_For_Head(event: E_Deposit_For_Head): void {

// }

// // 支付代币（反面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
// export function handleE_Deposit_For_Tail(event: E_Deposit_For_Tail): void {

// }

// // 合约双方保证金全部完成 参数为 交易对合约地址，操作用户 ,权益代币地址（正面）权益代币地址（反面）
// export function handleE_Entanglement(event: E_Entanglement): void {

// }

// // 初始化 参数为 交易对合约地址，操作用户 ，正面代币合约总量 ， 反面代币合约总量 ，正面代币保证金量 ，反面代币保证金量 ，指定的正面用户（为0则不指定），指定的反面用户 （为0则不指定），成对截止区块间隔    ，合约截止区块间隔
// export function handleE_Initialize(event: E_Initialize): void {

// }

// // 领取应得代币（正面） 参数为 交易对合约地址，操作用户 ，状态 （1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行)
// export function handleE_Withdraw_Head(event: E_Withdraw_Head): void {

// }

// // 领取应得代币（反面） 参数为 交易对合约地址，操作用户 ，状态 1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行）
// export function handleE_Withdraw_Tail(event: E_Withdraw_Tail): void {

// }

// export function handleOwnershipTransferred(event: OwnershipTransferred): void {

// }
