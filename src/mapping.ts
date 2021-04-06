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
import { Order, Message, RecommendOrder, LockAll, LockCurr } from "../generated/schema"
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
  order.contractCreateTime = event.block.timestamp
  order.contractCreatorAddr = event.params.user
  order.buyerSubjectMatterAddr = event.params.token_tail
  order.sellerSubjectMatterAddr = event.params.token_head
  order.moneyReward = event.params.sys_reward.toBigDecimal()
  order.contractCreateBlockNumber = event.block.number
  order.orderStatus = help.ZERO_BI
  order.buyerPaid = help.ZERO_BD
  order.sellerPaid = help.ZERO_BD
  order.buyerMakeUp = help.ZERO_BD
  order.sellerMakeUp = help.ZERO_BD
  order.buyerEarnestMoney = help.ZERO_BD
  order.sellerEarnestMoney = help.ZERO_BD
  order.buyerDeliveryQuantity = help.ZERO_BD
  order.sellerDeliveryQuantity = help.ZERO_BD
  order.contractStatus = help.ZERO_BI
  order.depositStatus = help.ZERO_BI
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
    order.contractInitializeTime = event.block.timestamp
    order.buyerDeliveryQuantity = event.params.total_amount_tail.toBigDecimal()
    order.sellerDeliveryQuantity = event.params.total_amount_head.toBigDecimal()
    log.warning("order not null initialize orderNum:{} buyer:{}", [order.orderNum.toHex(), event.params.total_amount_head.toString()])
    order.buyerEarnestMoney = event.params.limit_tail.toBigDecimal()
    order.sellerEarnestMoney = event.params.limit_head.toBigDecimal()
    order.buyerAddr = event.params.rival_tail
    order.sellerAddr = event.params.rival_head
    order.effectiveHeight = event.params.pair_dlo
    order.deliveryHeight = event.params.option_dlo
    order.effective = event.params.pair_dlo.plus(event.block.number)
    order.delivery = event.params.option_dlo.plus(event.block.number)
    order.contractInitializeBlockNumber = event.block.number
    let takeEff = event.block.timestamp.toI32() + (order.effectiveHeight.toI32() * help.BLOCK_NUMBER_TIME);
    // order.orderTakeEffectTime = tools.formatDateTimeTS(order.effectiveHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    // order.orderDeliveryTime = tools.formatDateTimeTS(order.deliveryHeight.toI32() * help.BLOCK_NUMBER_TIME + "",tools.DT_FMT.default);
    if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.INITIALIZE)
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
    } else if (order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000" && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_BUYER)
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), takeEff.toString()));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000") {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_SELLER)
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "保证金消息", message.buyerEarnestMoneyTime(order.orderNum.toHex(), takeEff.toString()));
    } else if (!(order.buyerAddr.toHex() == "0x0000000000000000000000000000000000000000") && !(order.sellerAddr.toHex() == "0x0000000000000000000000000000000000000000")) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.BUYER_SELLER)
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(event.params.swap.toHex()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), takeEff.toString()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "订单消息", message.createOrderMessage(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.sellerEarnestMoneyTime(order.orderNum.toHex(), takeEff.toString()));
    }
    order.earnestMoneyStatus = BigInt.fromI32(help.EarnestMoneyStatus.NOT_PAY)
    createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "订单消息", message.createOrderMessage(order.orderNum.toHex()));
    order.save()
  }
}

// address swap ,address user,address referer
// 支付保证金（正面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Head(event: E_Claim_For_Head): void {
  log.warning("seller claim orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
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

    let lockAll = LockAll.load(order.sellerSubjectMatterAddr.toHex());
    if (lockAll == null) {
      lockAll = new LockAll(order.sellerSubjectMatterAddr.toHex());
      lockAll.number = order.sellerEarnestMoney
      lockAll.save()
    } else {
      lockAll.number = lockAll.number.plus(order.sellerEarnestMoney)
      lockAll.save()
    }
    
    let lockCurr =LockCurr.load(order.sellerSubjectMatterAddr.toHex());
    if (lockCurr == null) {
      lockCurr = new LockCurr(order.sellerSubjectMatterAddr.toHex());
      lockCurr.number = order.sellerEarnestMoney
      lockCurr.save()
    } else {
      lockCurr.number = lockCurr.number.plus(order.sellerEarnestMoney)
      lockCurr.save()
    }

    log.warning("sellerEarnestMoney:{} sellerMakeUp:{} ", [order.sellerEarnestMoney.toString(), order.sellerMakeUp.toString()])
    createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.buyerEarnestMoney(order.orderNum.toHex(), order.sellerEarnestMoney.toString()));
    createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.creatorBuyerEarnestMoney(order.sellerAddr.toHex(), order.orderNum.toHex(), order.sellerEarnestMoney.toString()));
    if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)) {
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    } else {
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.waitBuyerPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.waitBuyerPayEarnestMoney(order.orderNum.toHex()));
    }
  }
}

// address swap ,address user,address referer
// 支付保证金（反面） 参数为 交易对合约地址，操作用户 ，邀请人
export function handleE_Claim_For_Tail(event: E_Claim_For_Tail): void {
  log.warning("buyer claim orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex());
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

    let lockAll = LockAll.load(order.buyerSubjectMatterAddr.toHex());
    if (lockAll == null) {
      lockAll = new LockAll(order.buyerSubjectMatterAddr.toHex());
      lockAll.number = order.buyerEarnestMoney
      lockAll.save()
    } else {
      lockAll.number = lockAll.number.plus(order.buyerEarnestMoney)
      lockAll.save()
    }

    let lockCurr = LockCurr.load(order.buyerSubjectMatterAddr.toHex());
    if (lockCurr == null) {
      lockCurr = new LockCurr(order.buyerSubjectMatterAddr.toHex());
      lockCurr.number = order.buyerEarnestMoney
      lockCurr.save()
    } else {
      lockCurr.number = lockCurr.number.plus(order.buyerEarnestMoney)
      lockCurr.save()
    }
    createMessage(event.block.number,order.orderNum, order.buyerAddr, "保证金消息", message.buyerEarnestMoney(order.orderNum.toHex(), order.buyerEarnestMoney.toString()));
    createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.creatorBuyerEarnestMoney(order.buyerAddr.toHex(), order.orderNum.toHex(), order.buyerEarnestMoney.toString()));
    if (order.earnestMoneyStatus == BigInt.fromI32(help.EarnestMoneyStatus.ALL_PAY)) {
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "保证金消息", message.allPayEarnestMoney(order.orderNum.toHex()));
    } else {
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "保证金消息", message.waitSellerPayEarnestMoney(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "保证金消息", message.waitSellerPayEarnestMoney(order.orderNum.toHex()));
    }
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

// // 支付代币（正面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Head(event: E_Deposit_For_Head): void {
  log.warning("DepositForHead orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.sellerMakeUp = event.params.deposited_amount.toBigDecimal()
    if (order.sellerDeliveryQuantity.equals(event.params.deposited_amount.toBigDecimal())) {
      order.depositStatus = BigInt.fromI32(help.DepositStatus.SELLER_MAKE_UP)
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.makeUpToken(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.buyerMakeUpTokenToCreator(order.sellerAddr.toHex(), order.orderNum.toHex()));
      if (order.sellerMakeUp == order.buyerDeliveryQuantity) {
        createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
      }
    } else {
        let price = order.sellerDeliveryQuantity.minus(order.sellerMakeUp);
        createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.waitBuyerMakeUpToken(order.orderNum.toHex(), price.toString()));
        createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.waitBuyerMakeUpToken(order.orderNum.toHex(), price.toString()));
        createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.makeUpToken3(order.orderNum.toHex(), order.sellerMakeUp.toString(), price.toString()));
    }
    if (!(order.sellerMakeUp.equals(order.sellerDeliveryQuantity))) {
      let price = order.buyerDeliveryQuantity.minus(order.buyerMakeUp);
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.waitSellerMakeUpToken(order.orderNum.toHex(), price.toString()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.waitSellerMakeUpToken(order.orderNum.toHex(), price.toString()));
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.makeUpToken3(order.orderNum.toHex(), order.buyerMakeUp.toString(), price.toString()));
    }
    if (order.depositStatus == BigInt.fromI32(help.DepositStatus.BUYER_MAKE_UP) && order.sellerMakeUp.equals(order.sellerDeliveryQuantity)) {
      order.depositStatus = BigInt.fromI32(help.DepositStatus.ALL_MAKE_UP)
    }
    order.save()
    let lockAll = LockAll.load(order.sellerSubjectMatterAddr.toHex());
    lockAll.number = lockAll.number.plus(event.params.amount.toBigDecimal())

    let lockCurr = LockCurr.load(order.sellerSubjectMatterAddr.toHex());
    lockCurr.number = lockCurr.number.plus(event.params.amount.toBigDecimal())
    lockCurr.save()
  }
}

// address swap ,address user, uint256 amount,uint256 deposited_amount
// // 支付代币（反面） 参数为 交易对合约地址，操作用户，本次抵押数量，总抵押数量
export function handleE_Deposit_For_Tail(event: E_Deposit_For_Tail): void {
  log.warning("DepositForTail orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.buyerMakeUp = event.params.deposited_amount.toBigDecimal()
    if (order.buyerDeliveryQuantity.equals(event.params.deposited_amount.toBigDecimal())) {
      order.depositStatus = BigInt.fromI32(help.DepositStatus.BUYER_MAKE_UP)
      createMessage(event.block.number, order.orderNum, order.buyerAddr, "交割消息", message.makeUpToken(order.orderNum.toHex()));
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.buyerMakeUpTokenToCreator(order.buyerAddr.toHex(), order.orderNum.toHex()));
      if (order.sellerMakeUp == order.sellerDeliveryQuantity) {
        createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
        createMessage(event.block.number, order.orderNum, order.contractCreatorAddr, "交割消息", message.allMakeUpToken(order.orderNum.toHex()));
      }
    } else {
        let price = order.buyerDeliveryQuantity.minus(order.buyerMakeUp);
        createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.waitBuyerMakeUpToken(order.orderNum.toHex(), price.toString()));
        createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.waitBuyerMakeUpToken(order.orderNum.toHex(), price.toString()));
        createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.makeUpToken3(order.orderNum.toHex(), order.buyerMakeUp.toString(), price.toString()));
    }
    if (!(order.sellerMakeUp.equals(order.sellerDeliveryQuantity))) {
      let price = order.sellerDeliveryQuantity.minus(order.sellerMakeUp);
      createMessage(event.block.number,order.orderNum, order.contractCreatorAddr, "交割消息", message.waitSellerMakeUpToken(order.orderNum.toHex(), price.toString()));
      createMessage(event.block.number,order.orderNum, order.buyerAddr, "交割消息", message.waitSellerMakeUpToken(order.orderNum.toHex(), price.toString()));
      createMessage(event.block.number,order.orderNum, order.sellerAddr, "交割消息", message.makeUpToken3(order.orderNum.toHex(), order.sellerMakeUp.toString(), price.toString()));
    }
    if (order.depositStatus == BigInt.fromI32(help.DepositStatus.SELLER_MAKE_UP) && order.buyerMakeUp.equals(order.buyerDeliveryQuantity)) {
      order.depositStatus = BigInt.fromI32(help.DepositStatus.ALL_MAKE_UP)
    }
    order.save()

    let lockAll = LockAll.load(order.buyerSubjectMatterAddr.toHex());
    lockAll.number = lockAll.number.plus(event.params.amount.toBigDecimal())
    lockAll.save()
    let lockCurr = LockCurr.load(order.buyerSubjectMatterAddr.toHex());
    lockCurr.number = lockCurr.number.plus(event.params.amount.toBigDecimal())
    lockCurr.save()
  }
}



// // 领取应得代币（正面） 参数为 交易对合约地址，操作用户 ，状态 （1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行)
export function handleE_Withdraw_Head(event: E_Withdraw_Head): void {
  log.warning("E_Withdraw_Head orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.sellerWithdrawStatus = event.params.status
    if (order.orderStatus == BigInt.fromI32(help.OrderStatus.BUYER_RECEIVE)) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.OVER)
    } else {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.SELLER_RECEIVE)
    }
    order.save()

    let lockCurr = LockCurr.load(order.sellerSubjectMatterAddr.toHex());
    // 1 各领各的 2 各领各的 3 自己领 4 别人领
    if (event.params.status == BigInt.fromI32(1) || event.params.status == BigInt.fromI32(2)) {
      lockCurr.number = lockCurr.number.minus(order.sellerMakeUp)
    } else if (event.params.status == BigInt.fromI32(3)){
      lockCurr.number = lockCurr.number.minus(order.sellerMakeUp)
      let lock = LockCurr.load(order.buyerSubjectMatterAddr.toHex());
      if (lock != null) {
        lock.number = lock.number.minus(order.buyerEarnestMoney)
      }
      lock.save()
    } else if (event.params.status == BigInt.fromI32(4)){
      lockCurr.number = lockCurr.number.minus(order.sellerMakeUp.minus(order.sellerEarnestMoney))
    }
    lockCurr.save()
    
  }
}

// // 领取应得代币（反面） 参数为 交易对合约地址，操作用户 ，状态 1：未成对。2：已履行完成合约。3：自己履行而对手未履行。4 自己未履行）
export function handleE_Withdraw_Tail(event: E_Withdraw_Tail): void {
  log.warning("E_Withdraw_Tail orderNum:{}", [event.params.swap.toHex()])
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.sellerWithdrawStatus = event.params.status
    if (order.orderStatus == BigInt.fromI32(help.OrderStatus.SELLER_RECEIVE)) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.OVER)
    } else {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.BUYER_RECEIVE)
    }
    order.save()
    let lockCurr = LockCurr.load(order.buyerSubjectMatterAddr.toHex());
    // 1 各领各的 2 各领各的 3 自己领 4 别人领
    if (event.params.status == BigInt.fromI32(1) || event.params.status == BigInt.fromI32(2)) {
      lockCurr.number = lockCurr.number.minus(order.buyerMakeUp)
    } else if (event.params.status == BigInt.fromI32(3)){
      lockCurr.number = lockCurr.number.minus(order.buyerMakeUp)
      let lock = LockCurr.load(order.sellerSubjectMatterAddr.toHex());
      if (lock != null) {
        lock.number = lock.number.minus(order.sellerEarnestMoney)
      }
      lock.save()
    } else if (event.params.status == BigInt.fromI32(4)){
      lockCurr.number = lockCurr.number.minus(order.buyerMakeUp.minus(order.buyerEarnestMoney))
    }
    lockCurr.save()
  }
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
}


export function createMessage(blockNumber: BigInt,orderNum: Bytes | null, userAddr: Bytes | null, messageTypeName: string, messageContext: string): void {
  log.warning("message:{}", ["msg"])
  let message = new Message(orderNum.toHex() + messageTypeName)
  message.orderNum = orderNum
  message.userAddr = userAddr
  message.messageTypeName = messageTypeName.toString()
  message.messageContext = messageContext.toString()
  message.blockNumber = blockNumber
  message.save()
}
