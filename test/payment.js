const Rx = require('rxjs');
const pay = require('../module/PaymentModule');
const uuid = require('uuid/v4');

function printMessage(methodName, result) {
    console.log(`${methodName} : message : `, result.message);
    console.log(`${methodName} : data : `, result.data.customer_uid);
}

// 상품 아이디 혹은 결제번호
let paymentNumber = uuid();

// customer_uid, card_number, expiry, birth, pwd_2digit

let billingKey = uuid();
let cardNumber = '9420-6110-9453-3079';
let cardExpiry = '2022-02';
let birth = '910711';
let pass = '73';

let testPrice = 1000;

pay.registCard(billingKey, cardNumber, cardExpiry, birth, pass)
    .do(result => console.log('카드 등록완료', result.data.customer_uid))
    .flatMap(result => {
        // 카드 결제
        return pay.payment(result.data.customer_uid, paymentNumber, testPrice);
    })
    .do(result => console.log('결제 완료'))
    .flatMap(result => {
        console.log('결제된 payot측 결제번호 : ', result.data.merchant_uid);
        console.log('결제된 iamport측 결제번호 : ', result.data.imp_uid);
        return pay.payback(result.data.iam_uid);
    })
    .do(result => console.log('결제 취소 : ', result.data.merchant_uid, result.data.amount))
    .flatMap(result => {
        let myBillingKey = result.data.customer_uid;
        return pay.removeCard(myBillingKey);
    })
    .subscribe(
        result => printMessage('카드 삭제', result),
        err => console.log(err)
    );