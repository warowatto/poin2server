const Observable = require('rxjs').Observable;
const router = require('express').Router();
const db = require('../module/DatabaseModule');

// 회원정보 가져오기
router.get('/:id', (req, res) => {
    // 회원아이디
    let id = req.params.id;
    res.json('회원정보');
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

    // 회원 로그인 정보가 없으면
    if (!authType) res.status(400).json('error');
    let query = { email: req.params.email };

    // DB에서 회원 로그인 정보를 찾고,
    return db.query(query, [queryParams], 'Not Access User')
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
    // 회원정보
    let user = req.body;

    // 회원정보에 아이디가 없으면
    if (!user.id) res.status(400).json('error');

    let target = { _id: db.ObjectId(user.id) };
    db.user.update(target, (err, result) => {
        if (err) res.status(500).json(err);
        else res.status(200).json(result);
    });
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

module.exports = router;