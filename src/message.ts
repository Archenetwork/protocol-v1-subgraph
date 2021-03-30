import { log, BigInt,  BigDecimal, Address} from '@graphprotocol/graph-ts'

export function getPrice(param: string): string {
    let price = BigDecimal.fromString(param)
    let bigDecimal = BigDecimal.fromString("1000000000000000000")
    price = price.div(bigDecimal).truncate(2)
    return price.toString();
}

export function createOrderMessage(orderNum: string): string {
    return "订单创建成功，订单编号为" + orderNum;
}

export function buyerEarnestMoney(orderNum: string, price: string): string {
    return "你已支付订单（" + orderNum+ "）" + getPrice(price) + "保证金";
}

export function creatorBuyerEarnestMoney(userAddr: string, orderNum: string, price: string): string {
   return "买方（" + getUserAddr(userAddr) + "）已支付订单（" + orderNum + "）" + getPrice(price) + "保证金";
}

export function creatorSellerEarnestMoney(userAddr: string, orderNum: string, price: string): string {
    return "卖方（" + getUserAddr(userAddr) + "）已支付订单（" + orderNum + "）" + getPrice(price) + "保证金";
}

export function allPayEarnestMoney(orderNum: string): string {
    return "买/卖双方已支付完成订单（" + orderNum + "）保证金，等待补足剩余数量的代币";
}

export function waitSellerPayEarnestMoney(orderNum: string): string {
    return "等待卖家支付订单（" + orderNum + "）保证金";
}

export function waitBuyerPayEarnestMoney(orderNum: string): string {
    return "等待买家支付订单（" + orderNum + "）保证金";
}

export function buyerEarnestMoneyTime(orderNum: string, time: String): string {
    return "买家加入订单后，提示买家：“你已加入订单（" + orderNum + "），请在  时间（" + time + "）内支付保证金";
}

export function sellerEarnestMoneyTime(orderNum: string, time: String): string {
    return "卖家加入订单后，提示卖家：“你已加入订单（" + orderNum + "），请在  时间（" + time + "）内支付保证金";
}

export function makeUpToken(orderNum: string): string {
    return "你的订单（" + orderNum + "）剩余代币数量已补足，等待交割";
}

export function allMakeUpToken(orderNum: string): string {
    return "买/卖双方已补足订单（" + orderNum + "）的剩余代币，等待交割";
}

export function buyerMakeUpTokenToCreator(userAddr: string, orderNum: string): string {
    return "买家（" + getUserAddr(userAddr) + "）已补足订单（" + orderNum + "）的剩余代币,等待交割";
}

export function waitSellerMakeUpToken(orderNum: string, price: string): string {
    return "等待卖家补足订单（" + orderNum + "）的剩余" + getPrice(price) + "（数量）代币";
}

export function waitBuyerMakeUpToken(orderNum: string, price: string): string {
    return "等待买家补足订单（" + orderNum + "）的剩余" + getPrice(price) + "（数量）代币";
}

export function makeUpToken3(orderNum: string, currentPrice: string, remainPrice: string): string {
    return "你已补足订单（" + orderNum + "）" + getPrice(currentPrice) + "（数量）代币，还剩" + getPrice(remainPrice) + "（数量）代币待补足";
}

export function noPayEarnestMoneyOrderInvalidation(orderNum: string, time: string): string {
    return "你加入的订单（" + orderNum + "）未在  时间（" + time + "）内支付保证金，订单已失效";
}

export function noMakeUpTokenInvalidation(orderNum: string, time: string): string {
    return "你加入的订单（" + orderNum + "）未在  时间（" + time + "）内补足代币，已违约";
}


export function getUserAddr(userAddr: string): string {
    return userAddr.substring(0, 4) + "****" + userAddr.substring(userAddr.length - 4);
}