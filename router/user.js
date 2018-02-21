const Observable = require('rxjs').Observable;
const router = require('express').Router();
const db = require('../module/DatabaseModule');
const iamport = require('../module/PaymentModule');
const event = require('../module/EventModule');
const dateformat = require('../module/DateConvertModule');
const uuid = require('uuid/v4');
const cleanArray = require('clean-array');
const IamportError = require('iamporter').IamporterError;

// 회원정보 가져오기
router.get('/:id', (req, res) => {
    // 회원아이디
    let id = req.params.id;

    let query = `SELECT * FROM Users WHERE id = ?`;

    db.query(query, [id], '유저 없음')
        .take(1)
        .subscribe(
            user => { res.json(user); },
            err => { res.json(err); }
        );
});

router.post('/login', (req, res) => {
    // 로그인 플래폼
    let flatform = req.body.flatform;
    // 플래폼 인증 토큰
    let token = req.body.token;

    getUser(flatform, token)
        .subscribe(
            user => {
                // 로그인 정보와 회원정보가 둘다 있는 경우
                res.status(200).json(user);
            },
            err => {
                if (err == 'Not Access User') {
                    // 로그인 정보가 없는 경우
                    res.status(403).json({ message: 'Not Access User' });
                } else if (err == 'NotSigned User') {
                    // 로그인 정보는 있지만 회원가입이 이루어지지 않은 경우
                    res.status(404).json({ message: 'Not Signed User' });
                } else {
                    // 서버의 오류가 발생한 경우
                    res.status(500).json({ message: 'Server Error' });
                }
            });
});

// 플래폼과 토큰으로 사용자정보 가져오기
function getUser(flatform, token) {
    // 회원 로그인 정보
    let signinQuery = `SELECT userId FROM SocialLogin WHERE hash = ?`;
    let queryParams = `${flatform}:${token}`;

    // 회원 상세 정보
    let userColums = db.colum('*')
    let userFindQuery = `SELECT ${userColums} FROM Users WHERE id = ?`;

    // 회원 카드 정보
    let cardColums = db.colum('*');
    let cardFindQuery = `SELECT * FROM Cards WHERE userId = ?`;

    // DB에서 회원 로그인 정보를 찾고,
    return db.query(signinQuery, [queryParams], 'Not Access User')
        .flatMap(sign => {
            // 로그인 정보가 있다면 추가 회원정보를 로드
            let userId = sign.userId;

            return db.query(userFindQuery, [userId], 'Not Signed User');
        })
        .flatMap(user => {
            // 회원정보와 카드정보를 병합
            return Observable.zip(
                Observable.of(user),
                db.query(cardFindQuery, [user.id]).toArray(),
                (user, cards) => {
                    return {
                        user: user,
                        cards: cards
                    }
                }
            )
        });
}

// 회원가입
router.post('/', (req, res) => {
    // 회원 상세정보 등록
    let insertColums = db.colum('email', 'name', 'gender', 'profileImage', 'thumbnailImage', 'create_at');
    let insertQuery = `INSERT INTO Users (${insertColums}) VALUES ?`;
    let insertValue = [
        req.body.email, req.body.name, req.body.gender,
        req.body.profileImage, req.body.thumbnailImage,
        'NOW()'
    ];

    // 회원 로그인 정보 등록
    let insertLoginColums = db.colum('hash', 'flatform', 'userId', 'create_at');
    let insertLoginQuery = `INSERT INTO SocialLogin (${insertLoginColums}) VALUES ?`;

    // 회원 정보를 등록 이후
    db.update(insertQuery, insertValue)
        .flatMap(info => {
            // 로그인 상태정보를 등록한다
            let insertId = info.insertId;
            let insertLoginValue = [
                `${req.body.flatform}:${req.body.token}`, req.body.flatform,
                insertId, 'NOW()'
            ];

            let inserLoginObserver = db.update(insertLoginQuery, insertLoginValue);
            return Observable.zip(Observable.of(insertId), inserLoginObserver, (userId, inserted) => {
                return userId;
            });
        })
        .flatMap(userId => {
            // 등록 이후 회원정보를 로드
            return getUser(req.body.flatform, req.body.token);
        })
        .subscribe(
            user => {
                // 사용자 정보를 출력한다
                res.status(200).json(user);
            },
            err => {
                res.status(500).json({ message: 'Server Error' });
            }
        );
});

// 회원정보 수정
router.put('/', (req, res) => {
    // 회원 정보 수정
});

// 회원 탈퇴
router.delete('/:flatform/:token', (req, res) => {
    // 유저 찾기 쿼리
    let userFindQuery = `SELECT userId FROM SocialLogin WHERE hash = ?`;
    let userFindParams = `${req.params.flatform}:${req.params.token}`;

    // 로그인 테이블 탈퇴 등록
    // 소셜로그인의 종류가 많은경우 모두 헤지 처리
    let updateLoginQuery = `UPDATE SocialLogin SET remove_at = 'NOW()' WHERE userId = ?`;

    // 회원정보 테이블 정보 삭제
    let deleteUserQuery = `DELETE FROM Users WHERE id = ?`;

    db.query(userFindQuery, [userFindParams], 'Not Signed User')
        .flatMap(user => {
            let userId = user.userId;
            let updateLoginQuery = db.update(updateLoginQuery, [user.id]);
            let deleteUserQuery = db.update(deleteUserQuery, [userId]);
            return Observable.zip(updateLoginQuery, deleteUserQuery, (uppdateLogin, deleteUser) => {
                return true;
            });
        })
        .subscribe(
            state => {
                res.status(200).json({ result: true });
            },
            err => {
                res.status(500).json({ message: 'Server Error' });
            }
        )
});

// 회원 카드등록
router.post('/:userId/card', (req, res) => {
    let userId = req.params.userId;
    // 등록될 빌링키
    let billingKey = uuid();

    // 아임포트로부터 빌링키 발급
    iamport.registCard(
        billingKey, req.body.card_number,
        req.body.expiry, req.body.birth, req.body.pwd_2digit)
        .flatMap(result => {
            // 빌링키가 성공적으로 발급됬다면
            let cardInsertParams = {
                userId: userId,
                billingKey: billingKey,
                bankName: result.card_name,
                displayName: req.body.displayName,
                create_at: Date()
            }
            let cardInsertQuery = `INSERT INTO Cards SET ?`;

            // 카드테이블에 추가
            return db.update(cardInsertQuery, cardInsertParams)
        })
        .flatMap(result => {
            let insertId = result.insertId;
            let cardSelectQuery = `SELECT * FROM Cards WHERE id = ?`;

            // 카드 정보 가져오기
            return db.query(cardSelectQuery, [insertId], '카드 등록 오류')
        })
        .subscribe(
            card => { res.status(200).json(card); },
            err => { res.status(500).json(err); }
        );
});

// 사용자 카드삭제
router.delete('/card/:cardId', (req, res) => {
    let cardId = req.params.cardId;
    let cardColums = db.colum('userId', 'billingKey');
    let cardSelectQuery = `SELECT ${cardColums} Cards WHERE id = ${cardId}`;

    db.query(cardSelectQuery, null, { message: '등록된 카드가 아닙니다' })
        .flatMap(card => {
            let userId = card.userId;
            let billingKey = card.billingKey;

            return iamport.removeCard(billingKey)
        })
        .flatMap(result => {
            let cardDeleteQuery = `DELETE FROM Cards WHERE id = ${cardId}`;

            return db.update(cardDeleteQuery, null);
        })
        .subscribe(
            result => { res.status(200).json({ message: '카드가 성공적으로 삭제되었습니다' }); },
            err => { res.status(500).json(err); }
        );
});

// 사용자 결제
// 사용자의 결제는 포인트 및 현금으로 결제 가능하다.
// 장비가 동작하는 금액과 실제 결제되는 금액은 다를 수 있다.
// 포인트 결제시 포인트누적은 해당되지 않는다.
// 포인트 + 현금을 통한 지불은 (가능)하다
// 포인트 + 이벤트는 (가능)하다
// 포인트는 결제한 현금에 대해 3%로 적용 된다.
router.post('/:userId/payment', (req, res) => {
    // 입력 파라미터 정보
    let userId = req.params.userId;
    let cardId = req.body.cardId;
    let machineId = req.body.machineId;
    let productId = req.body.productId;
    let amount = req.body.amount;

    // 결제번호
    let paymentNumber = uuid();

    // 장치정보 가져오기
    let deviceFindQuery = `SELECT * FROM Machines WHERE id = ?;`;
    let deviceFindObserver = db.query(deviceFindObserver);

    // 카드 정보 가져오기
    let cardSelectQuery = `SELECT * FROM Cards WHERE id = ${cardId}`;
    let cardGetObserver = db.query(cardSelectQuery, null, 'NOT FOUND CARD');

    // 오픈 이벤트 대상자 검색
    let eventTargetQuery = `SELECT COUNT(eventId) as count Payments WHERE userId = ?`;
    let eventTargetObserver = db.query(eventTargetObserver, [userId])
        .map(result => { return result.count < 3; });

    // 결제 내역 등록
    let paymentAppendQuery = `INSERT INTO Payments SET ?`;

    // 포인트 적립
    let pointAppendQuery = `UPDATE Users SET point = point + ? WHERE id = ?`;

    // 결제등록을 위한 정보 가져오기
    Observable.zip(deviceFindObserver, cardGetObserver, eventTargetObserver,
        (device, card, target) => {
            let eventId = target ? 1 : null;
            let eventAmount = target ? 0 : amount;
            return {
                // 결제이후 삭제
                billingKey: card.billingKey,
                // 이벤트 확인 이후 
                target: target,
                ///////////
                userId: userId,
                companyId: device.companyId,
                cardId: card.id,
                eventId: eventId,
                machineId: device.id,
                productId: productId,
                defaultPrice: amount,
                amount: eventAmount,
                pay_at: dateformat.dateFormat(Date())
            };
        })
        .flatMap(info => {
            // 결제하기
            let billingKey = info.billingKey;
            delete info.billingKey;

            info.id = uuid();
            // 이벤트가로 결제를 할 필요가 없다면
            if (info.amount == 0) {
                return Observable.of(info);
            } else {
                return iamport.payment(billingKey, info.id, info.amount)
                    .map(result => {
                        return info;
                    })
            }
        })
        .flatMap(info => {
            let isEvent = info.target;
            // 결제가 완료되었다면 포인트 적립과 DB에 기록을 한다
            let insertDB = db.update(paymentAppendQuery, [info])
            if (target) {
                // 이벤트로 결제된 사항은 포인트를 누적하지 않음
                return insertDB.map(result => { return info });
            } else {
                // 일반결제시에는 포인트 누적 10%
                let point = info.amount * 0.1;
                let pointAppendObserver = db.update(pointAppendQuery, [point]);
                return Observable.zip(insertDB, pointAppendObserver, (payments, points) => {
                    return info;
                });
            }
        })
        .subscribe(
            info => {
                res.status(200).json({ result: 'sucess' });
            },
            err => {
                let code = 500;
                if (err instanceof IamporterError) {
                    code = 400;
                }

                res.status(code).json({
                    result: 'error',
                    message: err
                });
            }
        );
});

// 회원의 결제 내역 가져오기
router.get('/:userId/payment', (req, res) => {
    let userId = req.params.userId;

    // let colum = db.colum('*');
    let colum = db.colum(
        'Payments.amount as amount',
        'Payments.pay_at as pay_at',
        'Machines.displayName as machineName',
        'Products.name as productName'
    );

    let query = `SELECT ${colum} FROM Payments 
    LEFT OUTER JOIN Machines ON Machines.id = Payments.machineId 
    LEFT OUTER JOIN Cards ON Cards.id = Payments.cardId
    LEFT OUTER JOIN Products ON Products.id = Payments.productId
    WHERE Payments.userId = ${userId};`;

    db.query(query)
        .toArray()
        .map(item => { return cleanArray(item); })
        .subscribe(
            item => {
                if (item.length == 0) {
                    res.status(404).json(item);
                } else {
                    res.status(200).json(item);
                }
            },
            err => { res.status(500).json(err); }
        );
});

module.exports = router;