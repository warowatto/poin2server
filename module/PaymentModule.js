"use strict";
// https://github.com/posquit0/node-iamporter
// https://api.iamport.kr/#/

/**
 * 용어 정리
 * merchant_uid : PayOT에서 관리하게되는 거래번호 (PayOT에서 지정) / String(40)
 * customer_uid : BillingKey == 카드를 구분하는 결제인증키 (PayOT에서 지정) / String(80)
 * imp_uid : 거래번호 (Iamport에서 지정)
 * reason : 결제 취소 사유 (PayOT에서 지정)
 */

const Observable = require('rxjs').Observable;
const Iamport = require('iamporter');
const IamporterError = Iamport.IamporterError;

const apiKey = '';
const secret = '';

// To Services
// const iamporter = new Iamport.Iamporter({
//     apiKey: apiKey,
//     secret: secret
// });

const iamporter = new Iamport.Iamporter();

// 빌링키 생성
function registCard(customer_uid, card_number, expiry, birth, pwd_2digit) {
    return Observable.create(e => {
        let cardNumberReg = /\d{4}-\d{4}-\d{4}-\d{4}/;
        let expiryReg = /\d{4}-\d{2}/;
        let birthReg = /\d{6}/;

        let validation = cardNumberReg.exec(card_number)
            && expiryReg.exec(expiry) 
            && birthReg.exec(birth);
        
        // 입력폼이 맞지 않는경우
        if (!validation) {
            e.error('Validation Execption');
            e.complete();
        } else {
            iamporter.createSubscription({
                'customer_uid': customer_uid,
                'card_number': card_number,
                'expiry': expiry,
                'birth': birth,
                'pwd_2digit': pwd_2digit
            }).then(result => {
                e.next(result);
                e.complete();
            }).catch(err => {
                e.error(err);
                e.complete();
            });
        }
    });
}

// 빌링키 삭제 (카드정보 삭제)
// 빌링키를 통한 빌링키 삭제 및 카드정보 iamport에서 삭제
function removeCard(customer_uid) {
    return Observable.create(e => {
        iamporter.deleteSubscription(customer_uid)
            .then(result => {
                e.next(result);
                e.complete();
            }).catch(err => {
                e.error(err);
                e.complete();
            });
    });
}

// 결제하기
// 빌링키와, PayOT에서 지정한 거래번호, 가격정보를 통하여 결제를 진행
function payment(customer_uid, merchant_uid, amount) {
    return Observable.create(e => {
        // 비인증 결제 (빌링키 이용)
        iamporter.paySubscription({
            'customer_uid': customer_uid,
            'merchant_uid': merchant_uid,
            'amount': amount
        }).then(result => {
            e.next(result);
            e.complete();
        }).catch(err => {
            e.error(err);
            e.complete();
        });
    });
}

// 결제 취소 후 계좌 환불
// iamport의 거래번호와 사유입력
function payback(merchant_uid, reason) {
    return Observable.create(e => {
        iamporter.cancel({
            'merchant_uid': merchant_uid,
            'reason': reason
        }).then(result => {
            e.next(result);
            e.complete();
        }).catch(err => {
            e.error(err);
            e.complete();
        });
    });
}

module.exports = {
    registCard: registCard,
    removeCard: removeCard,
    payment: payment,
    payback: payback
}
