const Observable = require('rxjs').Observable;
const db = require('./DatabaseModule');
const dateFormat = require('./DateConvertModule');

function eventCheck(productId, eventId, userId) {
    // 현재 날짜
    let now = dateFormat.dateFormat(Date());

    // 상품 기본가 가져오기
    let prodcutQuery = `SELECT defaultPrice FROM Products WHERE id = ${productId}`;
    let productNotFoundError = { message: '존재하지 않는 상품입니다' };
    let productObserver = db.query(prodcutQuery, null, productNotFoundError).take(1);

    // 이벤트 정보 가져오기
    let eventColum = db.colum(
        'Events.productId as productId',
        'EventType.targetUser as targetUser',
        'EventType.repeatCount as repeatCount',
        'EventType.discount as discount');
    let eventQuery =
        `SELECT ${eventColum} FROM Events 
        LEFT JOIN EventType ON Events.eventType = EventType.id
        WHERE 
        Events.start_at <= '${now}' 
            AND
        Events.end_at >= '${now}'`;
    let eventNotFoundError = { message: '존재하지 않는 이벤트 입니다' }
    let eventObserver = db.query(eventQuery, null, eventNotFoundError).take(1);

    // 사용자 이벤트 참여횟수 가져오기
    let userUseEventColum = db.colum('COUNT(id) as count');
    let userUseEventCountQuery =
        `SELECT ${userUseEventColum} FROM Payments 
        WHERE 
            userId = ${userId} 
        AND
            eventId = ${eventId}`;
    let userUseEventCountObserver = db.query(userUseEventCountQuery, null).take(1);

    // 반환 (실제가격, 할인금액)
    return Observable.zip(eventObserver, productObserver, userUseEventCountQuery,
        (event, product, use) => {
            if (use.count == null || use.count < event.repeatCount) {
                // 이벤트 참여기록이 없거나 이벤트 참여횟수 미달인 사용자에 한해
                // 이벤트 대상자로 취급
                return {
                    discount: event.discount,
                    defaultPrice: product.defaultPrice,
                    totalAmount: product.defaultPrice - event.discount
                };
            } else {
                // 이벤트 대상자가 아닌 경우
                return {
                    discount: 0,
                    defaultPrice: product.defaultPrice,
                    totalAmount: product.defaultPrice
                };
            }
        });
}

module.exports = {
    eventCheck: eventCheck
};