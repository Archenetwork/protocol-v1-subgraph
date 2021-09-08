import { log, BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import {
  Contract,
  E_Claim_For_Delivery,
  E_Claim_For_Head,
  E_Create,
  E_Deposit_For_Head,
  E_Deposit_For_Tail,
  E_Initialize,
  E_Permit_User,
  E_Token_Price,
  E_Withdraw_Head,
  E_Withdraw_Tail,
  OwnershipTransferred,
  E_Token_Info
} from "../generated/Contract/Contract"
import {  ChildOrder, Order, ClaimRecord } from "../generated/schema"
import * as help from './help'

/// 创建交易对 参数为 交易对合约地址，操作用户，交易对合约拥有人， 代币地址（正面），代币地址（反面）, 赏金ERC合约地址，赏金数量。注意，创建交易对之后需要对其初始化
export function handleE_Create(event: E_Create): void {
  let order = new Order(event.params.swap.toHex())
  order.orderNum = event.params.swap.toHexString()
  order.contractCreateTime = event.block.timestamp
  order.contractCreatorAddr = event.params.user
  order.buyerSubjectMatterAddr = event.params.token_tail
  order.sellerSubjectMatterAddr = event.params.token_head
  order.contractCreateBlockNumber = event.block.number
  order.orderStatus = help.ZERO_BI
  order.buyerDeliveryQuantity = help.ZERO_BD
  order.sellerDeliveryQuantity = help.ZERO_BD
  order.sellerCount = help.ZERO_BD
  order.buyerCount = help.ZERO_BD
  order.buyerResidueCount = help.ZERO_BD
  order.sellerResidueCount = help.ZERO_BD
  order.parities = help.ZERO_BD
  order.myCreateParities = help.ZERO_BD
  order.ratio = help.ZERO_BD
  order.sysRewardAddr = event.params.sys_reward_addr
  order.sysReward = event.params.sys_reward.toBigDecimal()
  order.residueSysReward = event.params.sys_reward.toBigDecimal()
  order.whiteAddr = ""
  order.futureBlockOffset = help.ZERO_BI
  order.deliveryBlokcNumber = help.ZERO_BI
  order.buyerUnReceiver = help.ZERO_BD
  order.sellerUnReceiver = help.ZERO_BD
  order.orderStatus = BigInt.fromI32(help.OrderStatus.WAIT_INITIALIZE)
  order.childOrders = new Array<string>(0)
  order.childOrderPks = new Array<string>(0)
  order.save()
}

/// 初始化 参数为 交易对合约地址，操作用户 ，正面代币合约总量 ， 反面代币合约总量 
export function handleE_Initialize(event: E_Initialize): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null initialize orderNum:{}", [order.orderNum])
    order.buyerDeliveryQuantity = event.params.total_amount_tail.toBigDecimal()
    order.sellerDeliveryQuantity = event.params.total_amount_head.toBigDecimal()
    order.buyerResidueCount = order.buyerDeliveryQuantity
    order.sellerResidueCount = order.sellerDeliveryQuantity
    order.contractInitializeBlockNumber = event.block.number
    order.futureBlockOffset = event.params.future_block_offset
    order.deliveryBlokcNumber = order.contractInitializeBlockNumber.plus(order.futureBlockOffset)
    order.slogan = event.params.slogan
    
    order.orderStatus = BigInt.fromI32(help.OrderStatus.INITIALIZE)
    order.save()
  }
}

/// 设置白名单事件，参数为 交易对合约地址，操作用户 ，白名单地址，若一次设置了多个白名单地址则产生多个本事件
export function handleE_Permit_User(event: E_Permit_User): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null permitUser orderNum:{}", [order.orderNum])
    order.whiteAddr = order.whiteAddr + event.params.target.toHex() + ","
    order.save()
  }
}

/// 子合约创建者支付代币（正面） 参数为 交易对合约地址，操作用户
export function handleE_Claim_For_Head(event: E_Claim_For_Head): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null claimForHead orderNum:{}", [order.orderNum])
    order.orderStatus = BigInt.fromI32(help.OrderStatus.CREATE_PAY)
    order.save()
  }
}

///其他用户交易，支付代币（反面） 参数为 交易对合约地址，操作用户，本次Tail交易数量，总Tail交易数量 , 赏金邀请人地址 
export function handleE_Deposit_For_Tail(event: E_Deposit_For_Tail): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null depositForTail orderNum:{}", [order.orderNum])
    order.orderStatus = BigInt.fromI32(help.OrderStatus.CREATE_PAY)
    // 正面代币可交易剩余数量
    let head_remaining = event.params.head_remaining
    // 反面代币可交易剩余数量
    let tail_remaining = event.params.tail_remaining
    // 本次卖出
    let sell = order.sellerResidueCount.minus(head_remaining.toBigDecimal())
    let buy = event.params.amount.toBigDecimal()
    // 卖方卖出数量计算 曾卖出 + 本次卖出 (上次剩余- 本次剩余)
    order.sellerCount = order.sellerCount.plus(sell)
    // 买方买入计算 曾买入 + 本次买方买入
    order.buyerCount = order.buyerCount.plus(buy)
    // 卖方剩余数量 总数量 - 卖出
    order.sellerResidueCount = head_remaining.toBigDecimal()
    // 买方剩余数量 总数量 - 进入
    order.buyerResidueCount = tail_remaining.toBigDecimal()


    
    // 赏金计算公式 本次买入 / 池子买方总额 * 总赏金 剩余赏金计算公式 剩余赏金 - 本次赏金
    // 本次赏金
    let the = event.params.amount.toBigDecimal().div(order.buyerDeliveryQuantity)
    .times(order.sysReward)
    if (order.buyerResidueCount.equals(help.ZERO_BD) && order.futureBlockOffset.toI32() == 0) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.OVER)
    }
    order.residueSysReward = order.residueSysReward.minus(the); // 计算剩余赏金
    // 比例 卖出数量 / 总数量 * 100
    order.ratio = order.sellerCount.div(order.sellerDeliveryQuantity).times(BigDecimal.fromString('100'))

    // 当前区块高度 <= 指定区块高度
    if (event.block.number.toI32() <= order.deliveryBlokcNumber.toI32()) {
      // 买方待领取 曾待领取 + 本次卖方卖出
      order.buyerUnReceiver = order.buyerUnReceiver.plus(sell)
      // 卖方待领取 曾待领取 + 本次买方买入
      order.sellerUnReceiver = order.sellerUnReceiver.plus(buy)
      let childOrders = order.childOrders
      childOrders.push(event.transaction.hash.toHex())
      order.childOrders = childOrders
  
      let childOrderPks = order.childOrderPks;
      childOrderPks.push(event.params.user.toHex())
      order.childOrderPks = childOrderPks


    }
    order.save()

    let childOrder = new ChildOrder(event.transaction.hash.toHex())
    childOrder.userAddr = event.params.user
    childOrder.buyCount = buy
    childOrder.sellCount = sell
    childOrder.transactionHash = event.transaction.hash.toHex()
    childOrder.refererAddr = event.params.referer
    childOrder.refererCount = the
    childOrder.orderNum = order.orderNum
    childOrder.buyerSubjectMatterAddr = order.buyerSubjectMatterAddr
    childOrder.sellerSubjectMatterAddr = order.sellerSubjectMatterAddr
    childOrder.contractCreatorAddr = order.contractCreatorAddr
    childOrder.sysRewardAddr = order.sysRewardAddr
    childOrder.blockNumber = event.block.number
    childOrder.parities = order.parities
    childOrder.myCreateParities = order.myCreateParities
    childOrder.buyerReceiver = help.ZERO_BD
    childOrder.sellerReceiver = help.ZERO_BD
    childOrder.buyerUnReceiver = sell
    childOrder.sellerUnReceiver = buy
    childOrder.deliveryBlokcNumber = order.deliveryBlokcNumber
    childOrder.futureBlockOffset = order.futureBlockOffset
    childOrder.contractInitializeBlockNumber = order.contractInitializeBlockNumber
    childOrder.buyDecimal = order.buyDecimal
    childOrder.buyName = order.buyName
    childOrder.sellDecimal = order.sellDecimal
    childOrder.sellName = order.sellName
    childOrder.rewardDecimal = order.rewardDecimal
    childOrder.rewardName = order.rewardName
    childOrder.save()
  }
}

/// 结束订单 参数为 交易对合约地址，操作用户 ，状态 （0 未定义，该字段无意义）
export function handleE_Withdraw_Head(event: E_Withdraw_Head): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null withdrawHead orderNum:{}", [order.orderNum])
    order.sellerResidueCount = help.ZERO_BD
    order.buyerResidueCount = help.ZERO_BD
    // if (order.futureBlockOffset.toI32() > 0 && order.sellerResidueCount.equals(help.ZERO_BD) && order.sellerUnReceiver.equals(help.ZERO_BD)) {
    if (order.futureBlockOffset.toI32() > 0 && order.sellerResidueCount.equals(help.ZERO_BD) && order.sellerUnReceiver.equals(help.ZERO_BD)) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.XXXX)
    }
    if (order.futureBlockOffset.toI32() == 0) {
      order.orderStatus = BigInt.fromI32(help.OrderStatus.OVER)
    }
    order.save()
  }
}

// 获取汇率
export function handleE_Token_Price(event: E_Token_Price): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    log.warning("order not null tokenPrice orderNum:{}", [order.orderNum])
    // order.parities = event.params.price.toBigDecimal().div(help.EIGHTEEN_BD)
    // order.paritiesForWeb = order.parities
    // order.save()
  }
}

// 领取事件 买方卖方都可以触发
export function handleE_Claim_For_Delivery(event: E_Claim_For_Delivery): void {
  // 通过订单id获取订单中交易记录id和交易用户id 
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    // 领取人为创建者
    if (order.contractCreatorAddr.equals(event.params.user)) {
      // 卖方待领取归零
      let childOrders = order.childOrders
      for (let i = 0; i < childOrders.length; i++) {
        let childOrder = ChildOrder.load(childOrders[i])
        childOrder.sellerUnReceiver = help.ZERO_BD
        childOrder.save()
      }
      order.sellerUnReceiver = help.ZERO_BD
      if (order.futureBlockOffset.toI32() > 0 && order.buyerResidueCount.equals(help.ZERO_BD) && order.sellerUnReceiver.equals(help.ZERO_BD)) {
        order.orderStatus = BigInt.fromI32(help.OrderStatus.XXXX)
      }
      order.save()

      let claimRecord = new ClaimRecord(event.transaction.hash.toHex())
      claimRecord.orderNum = order.orderNum
      claimRecord.userAddr = event.params.user
      claimRecord.blockNumber = event.block.number
      claimRecord.save()
    } else {
      let childOrders = order.childOrders
      let childOrderPks = order.childOrderPks
      let userId = event.params.user.toHex()
      let childOrderIds = new Array<string>(0)
      for (let i = 0; i < childOrders.length; i++) {
        if (userId == childOrderPks[i]) {
          childOrderIds.push(childOrders[i]);
        }
      }
      // 订单买方领取数量
      let buyer = BigDecimal.fromString('0')
      // 订单卖方领取数量
      let seller = BigDecimal.fromString('0')
      for (let i = 0; i < childOrderIds.length; i++) {
        /**
         *  买方已领取为买方待领取 买方待领取归零  
         *  卖方已领取为卖方待领取 卖方待领取归零  
         */
        let childOrder = ChildOrder.load(childOrderIds[i]);
        let buyerUnReceiver = childOrder.buyerUnReceiver
        let sellerUnReceiver = childOrder.sellerUnReceiver
        buyer = buyer.plus(buyerUnReceiver)
        seller = seller.plus(sellerUnReceiver)
        childOrder.buyerReceiver = buyerUnReceiver
        childOrder.sellerReceiver = sellerUnReceiver
        childOrder.buyerUnReceiver = help.ZERO_BD
        childOrder.sellerUnReceiver = help.ZERO_BD
        childOrder.save()
      }
      // 卖方待领取=卖方待领取-卖方领取     买方待领取=买方待领取-买方领取
      order.sellerUnReceiver = order.sellerUnReceiver.minus(seller)
      order.buyerUnReceiver = order.buyerUnReceiver.minus(buyer)
      if (order.futureBlockOffset.toI32() > 0 && order.buyerResidueCount.equals(help.ZERO_BD) && order.sellerUnReceiver.equals(help.ZERO_BD)) {
        order.orderStatus = BigInt.fromI32(help.OrderStatus.XXXX)
      }
      order.save()
    }
  }
 
}


export function handleE_Token_Info(event: E_Token_Info): void {
  let order = Order.load(event.params.swap.toHex())
  if (order != null) {
    order.buyDecimal = event.params.tail_decimal
    order.buyName = bytesToString(event.params.tail_name)
    order.sellDecimal = event.params.head_decimal
    order.sellName = bytesToString(event.params.head_name)
    order.rewardDecimal = event.params.reward_decimal
    order.rewardName = bytesToString(event.params.reward_name)
    let buyDec = Math.pow(10, order.buyDecimal.toI32())
    let buy = order.buyerDeliveryQuantity.div(BigDecimal.fromString(buyDec.toString()));
    let sellDec = Math.pow(10, order.sellDecimal.toI32())
    let sell = order.sellerDeliveryQuantity.div(BigDecimal.fromString(sellDec.toString()));
    // 汇率计算 卖方 / 买方
    order.parities = sell.div(buy)
    order.myCreateParities = buy.div(sell)
    order.paritiesForWeb = order.parities

    order.save()
  }
}
export function bytesToString(number: BigInt): string {
  let xx = number
  let a = true;
  let childOrderIds = new Array<number>(0)
  let i256= BigInt.fromI32(256)
  while (a) {
      if (xx.lt(i256)) {
        a = false;
      }
      let x = xx.mod(i256);
      xx = (xx.minus(x)).div(i256);
      if (x.notEqual(BigInt.fromI32(0))) {
        childOrderIds.push(x.toI32())
      }
  }
  let str = "";
  for(let i = 0; i < childOrderIds.length; i++) {
    str += String.fromCharCode(childOrderIds[childOrderIds.length - i - 1] as i32);
  }
  return str
}
