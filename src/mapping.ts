import { log, BigInt, Value, Bytes, BigDecimal} from "@graphprotocol/graph-ts"
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
import { Order, Message, RecommendOrder } from "../generated/schema"
// import { JSON } from "../node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts"
import * as help from './help'
import * as message from './message'
// import * as tools from './tools'
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

// address swap ,address user,address swap_owner ,address token_head,address token_tail,uint256 sys_reward
// 创建交易对 参数为 交易对合约地址，操作用户，交易对合约拥有人， 代币地址（正面），代币地址（反面）, 赏金。注意，创建交易对之后需要对其初始化
export function handleE_Create(event: E_Create): void {
  // log.warning("create message:{}", [event.block.number.toString()])
  // let entity = Create.load(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  let order = new Order(event.params.swap.toHex())
  order.orderNum = event.params.swap
  order.contractCreateTime = event.block.timestamp.toString()
  order.contractCreatorAddr = event.params.user
  order.buyerSubjectMatterAddr = event.params.token_tail
  order.sellerSubjectMatterAddr = event.params.token_head
  order.moneyReward = help.convertTokenToDecimal(event.params.sys_reward, help.BI_18)
  order.contractCreateBlockNumber = event.block.number
  order.orderStatus = help.ZERO_BI
  order.buyerPaid = help.ZERO_BD
  order.sellerPaid = help.ZERO_BD
  order.buyerMakeUp = help.ZERO_BD
  order.sellerMakeUp = help.ZERO_BD
  order.contractStatus = help.ZERO_BI
  order.depositStatus = help.ZERO_BI
  order.recommendOrderStatus = help.ZERO_BI
  order.chainType = BigInt.fromI32(3)
  order.save()
}

// address swap ,address user,uint256 total_amount_head ,uint256 total_amount_tail ,uint256 limit_head ,uint256 limit_tail ,address rival_head,address rival_tail , uint256 pair_dlo ,uint256 option_dlo
// // 初始化 参数为 交易对合约地址，操作用户 ，正面代币合约总量 ， 反面代币合约总量 ，正面代币保证金量 ，反面代币保证金量 ，指定的正面用户（为0则不指定），指定的反面用户 （为0则不指定），成对截止区块间隔    ，合约截止区块间隔
export function handleE_Initialize(event: E_Initialize): void {
  log.warning("initialize orderNum:{} limit_tail:{}", [event.params.swap.toHex(), event.params.limit_tail.toString()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null initialize orderNum:{}", [order.orderNum.toHex()])
    order.contractInitializeTime = event.block.timestamp.toString()
    order.buyerDeliveryQuantity = help.convertTokenToDecimal(event.params.total_amount_tail, help.BI_18)
    order.sellerDeliveryQuantity = help.convertTokenToDecimal(event.params.total_amount_head, help.BI_18)
    log.warning("order not null initialize orderNum:{} buyer:{}", [order.orderNum.toHex(), event.params.total_amount_head.toString()])
    order.buyerEarnestMoney = help.convertTokenToDecimal(event.params.limit_tail, help.BI_18)
    order.sellerEarnestMoney = help.convertTokenToDecimal(event.params.limit_head, help.BI_18)
    order.buyerAddr = event.params.rival_tail
    order.sellerAddr = event.params.rival_head
    order.effectiveHeight = event.params.pair_dlo
    order.deliveryHeight = event.params.option_dlo
    // order.effective = event.params.pair_dlo.plus(event.block.number)
    // order.delivery = event.params.option_dlo.plus(event.block.number)
    order.contractInitializeBlockNumber = event.block.number
    // order.orderTakeEffectTime = tools.formatDateTimeTS(order.effectiveHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    // order.orderDeliveryTime = tools.formatDateTimeTS(order.deliveryHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.INITIALIZE)
      // createMessage(order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
    } else if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_BUYER)
      // createMessage(order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      // createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_SELLER)
      // createMessage(order.orderNum, order.buyerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      // createMessage(order.orderNum, order.buyerAddr, "保证金消息", message.buyerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.BUYER_SELLER)
      // createMessage(order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      // createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
      // createMessage(order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(order.orderNum.toHex()));
      // createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), order.orderTakeEffectTime));
    }
    order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.NOT_PAY)
    // createMessage(order.orderNum, order.contractCreatorAddr, "订单消息", message.createOrderMessage(order.orderNum.toHex()));
    order.save()
  }
}

// address swap ,address user,address referer
// 支付保证金（正面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Head(event: E_Claim_For_Head): void {
  log.warning("seller claim orderNum:{}", [event.params.swap.toHex()])
  let order = new Order(event.params.swap.toHex())
  log.warning("sellerEarnestMoney:{}", [order.sellerEarnestMoney.toString()])
  if (order != null) { 
    order.sellerAddr = event.params.user
    order.sellerReferer = event.params.referer
    order.sellerMakeUp = order.sellerEarnestMoney
    if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.BUYER_PAY)) {
      order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY) 
    } else {
      order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.SELLER_PAY)
    }
    if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_BUYER)
    } else {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.BUYER_SELLER)
    }
    log.warning("sellerEarnestMoney:{} sellerMakeUp:{} ", [order.sellerEarnestMoney.toString(), order.sellerMakeUp.toString()])
    order.sellerPaid = order.sellerEarnestMoney
    order.save()
    log.warning("sellerEarnestMoney:{} sellerMakeUp:{} ", [order.sellerEarnestMoney.toString(), order.sellerMakeUp.toString()])
    // createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.buyerEarnestMoney(order.orderNum.toHex(), order.sellerEarnestMoney.toString()));
    // createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.creatorBuyerEarnestMoney(order.sellerAddr.toHex(), order.orderNum.toHex(), order.sellerEarnestMoney.toString()));
    // if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)) {
    //   createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.buyerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    // } else {
    //   createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.waitBuyerPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.waitBuyerPayEarnestMoney(order.orderNum.toHex()));
    // }
  }
}

// address swap ,address user,address referer
// 支付保证金（反面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Tail(event: E_Claim_For_Tail): void {
  log.warning("buyer claim orderNum:{}", [event.params.swap.toHex()])
  let order = new Order(event.params.swap.toHex());
  if (order != null) { 
    order.buyerAddr = event.params.user
    order.buyerReferer = event.params.referer 
    order.buyerMakeUp = order.buyerEarnestMoney
    log.warning("buyer claim earnestMoneyStatus:{}  consts:{}", [order.earnestMoneyStatus.toString(), BigInt.fromI32(help.EarnestMoneyStatus.SELLER_PAY).toString()])
    if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.SELLER_PAY)) {
      order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)
    } else {
      order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.BUYER_PAY)
    }
    if (order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_SELLER)
    } else {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.BUYER_SELLER)
    }
    log.warning("buyerEarnestMoney:{}", [order.buyerEarnestMoney.toString()])
    order.buyerPaid = order.buyerEarnestMoney
    order.save()
    // createMessage(order.orderNum, order.buyerAddr, "保证金消息", message.buyerEarnestMoney(order.orderNum.toHex(), order.buyerEarnestMoney.toString()));
    // createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.creatorBuyerEarnestMoney(order.buyerAddr.toHex(), order.orderNum.toHex(), order.buyerEarnestMoney.toString()));
    // if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)) {
    //   createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.buyerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.sellerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    // } else {
    //   createMessage(order.orderNum, order.buyerAddr, "保证金消息", message.waitSellerPayEarnestMoney(order.orderNum.toHex()));
    //   createMessage(order.orderNum, order.contractCreatorAddr, "保证金消息", message.waitSellerPayEarnestMoney(order.orderNum.toHex()));
    // }
  }
}




// // 支付代币（正面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Head(event: E_Deposit_For_Head): void {
  log.warning("DepositForHead orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  
}

// address swap ,address user, uint256 amount,uint256 deposited_amount
// // 支付代币（反面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Tail(event: E_Deposit_For_Tail): void {
  log.warning("DepositForTail orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.buyerMakeUp = help.convertTokenToDecimal(event.params.deposited_amount, help.BI_18)
    if (order.buyerDeliveryQuantity.equals(help.convertTokenToDecimal(event.params.deposited_amount, help.BI_18))) {
      order.depositStatus = BigInt.fromI32(help.DepositStatus.BUYER_MAKE_UP)
      // createMessage(order.orderNum, order.buyerAddr, "交割消息", message.makeUpToken(order.orderNum.toHex()));
      // createMessage(order.orderNum, order.contractCreatorAddr, "交割消息", message.buyerMakeUpTokenToCreator(order.buyerAddr.toHex(), order.orderNum.toHex()));
      // if (order.sellerMakeUp == order.sellerDeliveryQuantity) {
      //   createMessage(order.orderNum, order.buyerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
      //   createMessage(order.orderNum, order.sellerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
      //   createMessage(order.orderNum, order.contractCreatorAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
      // }
    } else {
        // let price = new BigDecimal(order.buyerDeliveryQuantity).minus(new BigDecimal(order.buyerMakeUp));
        // createMessage(order.orderNum, order.buyerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        // createMessage(order.orderNum, order.sellerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        // createMessage(order.orderNum, order.contractCreatorAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
    }
    order.save()
  }
}

// address swap ,address user ,address op_token_head,address op_token_tail
// // 合约双方保证金全部完成 参数为 交易对合约地址，操作用户 ,权益代币地址（正面）权益代币地址（反面）
export function handleE_Entanglement(event: E_Entanglement): void {
  log.warning("Entanglement orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.buyerTokenAddr = event.params.op_token_tail
    order.sellerTokenAddr = event.params.op_token_head
    order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)
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


export function createMessage(orderNum: Bytes | null, userAddr: Bytes | null, messageTypeName: string, messageContext: string): void {
  log.warning("message:{}", ["msg"])
  let message = new Message(orderNum.toHex() + messageTypeName)
  message.orderNum = orderNum
  message.userAddr = userAddr
  message.messageTypeName = messageTypeName.toString()
  message.messageContext = messageContext.toString()
  message.save()
}
