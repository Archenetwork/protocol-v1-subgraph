/* eslint-disable prefer-const */
import { log, BigInt, BigDecimal, Address} from '@graphprotocol/graph-ts'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let EIGHTEEN_BD = BigDecimal.fromString('1000000000000000000')
export let BI_18 = BigInt.fromI32(18)
export let BLOCK_NUMBER_TIME = 13;
export enum OrderStatus {
    WAIT_INITIALIZE = 0,
    INITIALIZE,
    CREATE_PAY,
    OVER,
    XXXX
    // WAIT_INITIALIZE 0 等待初始化
    // INITIALIZE 1 初始化
    // CREATE_PAY 2 卖方支付代币
    // OVER 3 订单关闭
    // XXXX 4 交割订单关闭
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

export enum DepositStatus {
    NOT_MAKE_UP = 0,
    BUYER_MAKE_UP,
    SELLER_MAKE_UP,
    ALL_MAKE_UP
    //  NOT_MAKE_UP(0, "双方未补"),
    //  BUYER_MAKE_UP(1, "买方补足"),
    //  SELLER_MAKE_UP(2, "卖方补足"),
    //  ALL_MAKE_UP(3, "双方补足");
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    let bd = BigDecimal.fromString('1')
    for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
      bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
    if (exchangeDecimals == ZERO_BI) {
      return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}
