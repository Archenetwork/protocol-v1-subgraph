/* eslint-disable prefer-const */
import { log, BigInt, BigDecimal, Address} from '@graphprotocol/graph-ts'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let BLOCK_NUMBER_TIME = 13;
export enum OrderStatus {
    WAIT_INITIALIZE = 0,
    INITIALIZE,
    WAIT_BUYER,
    WAIT_SELLER,
    BUYER_SELLER,
    BUYER_RECEIVE,
    SELLER_RECEIVE,
    OVER
    // WAIT_INITIALIZE(0, "等待初始化"),
    // INITIALIZE(1, "初始化"),
    // WAIT_BUYER(2, "等待买家"),
    // WAIT_SELLER(3, "等待卖家"),
    // BUYER_SELLER(4, "买卖家都确定"),
    // BUYER_RECEIVE(5, "买方领取"),
    // SELLER_RECEIVE(6, "卖方领取"),
    // OVER(7, "交割完成");
}

export enum MessageType {
    ALL = 1,
    CREATE_ORDER,
    EARNEST_MONEY,
    DELIVERY,
    TRANSACTION,
    RECEIVER
    // ALL(1, "全部消息"),
    // CREATE_ORDER(2, "订单消息"),
    // EARNEST_MONEY(3, "保证金消息"),
    // DELIVERY(4, "交割消息"),
    // TRANSACTION(5, "违约消息"),
    // RECEIVER(6, "收款消息");
}
export enum EarnestMoneyStatus {
    NOT_PAY = 0,
    BUYER_PAY,
    SELLER_PAY,
    ALL_PAY
    // NOT_PAY(0, "双方未支付"),
    // BUYER_PAY(1, "买方支付"),
    // SELLER_PAY(2, "卖方支付"),
    // ALL_PAY(3, "双方支付");
}
