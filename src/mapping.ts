import { log, BigInt, Bytes } from "@graphprotocol/graph-ts"
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
import { Order, Message } from "../generated/schema"
import * as help from './help'
import * as message from './message'
import * as tools from './tools'
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


// address swap ,address user,address referer
// 支付保证金（正面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Head(event: E_Claim_For_Head): void {
}

// address swap ,address user,address referer
// 支付保证金（反面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Tail(event: E_Claim_For_Tail): void {
}


// address swap ,address user,address swap_owner ,address token_head,address token_tail,uint256 sys_reward
// 创建交易对 参数为 交易对合约地址，操作用户，交易对合约拥有人， 代币地址（正面），代币地址（反面）, 赏金。注意，创建交易对之后需要对其初始化
export function handleE_Create(event: E_Create): void {
  log.info("create message:{}", [event.block.number.toString()])
  // let entity = Create.load(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let order = new Order(event.params.swap.toHex())
  var BigIntZero = BigInt.fromI32(0);
  order.orderNum = event.params.swap
  order.contractCreateTime = event.block.timestamp.toString()
  order.contractCreatorAddr = event.params.user
  order.buyerSubjectMatterAddr = event.params.token_tail
  order.sellerSubjectMatterAddr = event.params.token_head
  order.moneyReward = event.params.sys_reward
  order.contractCreateBlockNumber = event.block.number
  order.orderStatus = 0
  order.buyerPaid = BigIntZero
  order.sellerPaid = BigIntZero
  order.buyerMakeUp = BigIntZero
  order.sellerMakeUp = BigIntZero
  order.contractStatus = 0
  order.depositStatus = 0
  order.recommendOrderStatus = 0
  order.save()
  return
}


// // 支付代币（正面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Head(event: E_Deposit_For_Head): void {

}

// // 支付代币（反面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Tail(event: E_Deposit_For_Tail): void {

}

// // 合约双方保证金全部完成 参数为 交易对合约地址，操作用户 ,权益代币地址（正面）权益代币地址（反面）
export function handleE_Entanglement(event: E_Entanglement): void {

}


// address swap ,address user,uint256 total_amount_head ,uint256 total_amount_tail ,uint256 limit_head ,uint256 limit_tail ,address rival_head,address rival_tail , uint256 pair_dlo ,uint256 option_dlo
// // 初始化 参数为 交易对合约地址，操作用户 ，正面代币合约总量 ， 反面代币合约总量 ，正面代币保证金量 ，反面代币保证金量 ，指定的正面用户（为0则不指定），指定的反面用户 （为0则不指定），成对截止区块间隔    ，合约截止区块间隔
export function handleE_Initialize(event: E_Initialize): void {
  log.info("initialize orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.info("order not null initialize orderNum:{}", [order.orderNum.toString()])
    order.contractInitializeTime = event.block.timestamp.toString()
    order.buyerDeliveryQuantity = event.params.total_amount_tail
    order.sellerDeliveryQuantity = event.params.total_amount_head
    order.buyerEarnestMoney = event.params.limit_tail
    order.sellerEarnestMoney = event.params.limit_head
    order.buyerAddr = event.params.rival_tail
    order.sellerAddr = event.params.rival_head
    order.effectiveHeight = event.params.pair_dlo
    order.deliveryHeight = event.params.option_dlo
    order.contractInitializeBlockNumber = event.block.number
    order.orderTakeEffectTime = tools.formatDateTimeTS(order.effectiveHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    order.orderDeliveryTime = tools.formatDateTimeTS(order.deliveryHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = help.OrderStatus.INITIALIZE
    } else if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = help.OrderStatus.WAIT_BUYER
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.CREATE_ORDER.toString(), message.createOrderMessage(order.orderNum.toHex()));
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.EARNEST_MONEY.toString(), message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = help.OrderStatus.WAIT_SELLER
      createMessage(order.orderNum, order.buyerAddr, help.MessageType.CREATE_ORDER.toString(), message.createOrderMessage(order.orderNum.toHex()));
      createMessage(order.orderNum, order.buyerAddr, help.MessageType.EARNEST_MONEY.toString(), message.buyerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = help.OrderStatus.BUYER_SELLER
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.CREATE_ORDER.toString(), message.createOrderMessage(order.orderNum.toHex()));
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.EARNEST_MONEY.toString(), message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.CREATE_ORDER.toString(), message.createOrderMessage(order.orderNum.toHex()));
      createMessage(order.orderNum, order.sellerAddr, help.MessageType.EARNEST_MONEY.toString(), message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    }
    order.earnestMoneyStatus = help.EarnestMoneyStatus.NOT_PAY
    createMessage(order.orderNum, order.contractCreatorAddr, help.MessageType.CREATE_ORDER.toString(), message.createOrderMessage(order.orderNum.toHex()));
    order.save()
  }
}

// // 领取应得代币（正面） 参数为 交易对合约地址，操作用户 ，状态 （1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行)
export function handleE_Withdraw_Head(event: E_Withdraw_Head): void {
}

// // 领取应得代币（反面） 参数为 交易对合约地址，操作用户 ，状态 1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行）
export function handleE_Withdraw_Tail(event: E_Withdraw_Tail): void {
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
}


function createMessage(orderNum: Bytes, userAddr: Bytes, messageTypeName: string, messageContext: string) {
  let data = new Date()
  let message = new Message(data.getTime() + orderNum.toHex())
  message.orderNum = orderNum
  message.userAddr = userAddr
  message.messageTypeName = messageTypeName
  message.messageContext = messageContext
  message.save()
}

function listenerRecommendOrderAdd(msg: string) {
  

}