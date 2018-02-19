const router = require('express').Router();
const hash = require('../module/EncrytionModule');
const db = require('../module/DatabaseModule');

// 업체 정보 가져오기
router.get('/:id', (req, res) => {
    let id = req.params.id;

    let colum = db.colum('*')
    let query = `SELECT ${colum} FROM Companys WHERE id = ?`;

    db.query(query, [id], 'Not Signed Company')
        .subscribe(
        company => { res.status(200).json(company); },
        err => { res.status(500).json(err); }
        );
});

// 업체 회원 가입
router.post('/', (req, res) => {
    let company = req.body;

    let colum = db.colum(
        'email', 'password',
        'name', 'tel', 'phone',
        'fax', 'address', 'bankName',
        'accountNumber', 'accountName', 'paymentInfo',
        'create_at'
    );

    let params = [
        req.body.email, hash.encrypt(req.body.password),
        req.body.name, req.body.tel, req.body.phone,
        req.body.fax, req.body.address, req.body.bankName,
        req.body.accountNumber, req.body.accountName, req.body.paymentInfo,
        'NOW()'
    ];

    let query = `INSERT INTO Companys (${colum}) VALUES ?`;

    db.update(query, [params], 'Company Signed Error')
        .flatMap(result => {
            let insertId = result.insertId;
            let findCompanyQuery = `SELECT * FROM Companys WHERE id = ?`;
            return db.query(findCompanyQuery, [insertId]);
        })
        .subscribe(
        company => { res.status(200).json(company); },
        err => { res.status(500).json(err); }
        );
});

// 업체 회원 수정
router.put('/:id', (req, res) => {
    let id = req.params.id;

    let colum = db.colum(
        'name', 'tel', 'phone',
        'fax', 'address', 'bankName',
        'accountNumber', 'accountName', 'paymentInfo',
        'create_at'
    );

    let updateData = {
        tel: req.body.tel,
        phone: req.body.phone,
        fax: req.body.fax,
        address: req.body.address,
        bankName: req.body.bankName,
        paymentInfo: req.body.paymentInfo
    }

    let params = [
        req.body.name, req.body.tel, req.body.phone,
        req.body.fax, req.body.address, req.body.bankName,
        req.body.accountNumber, req.body.accountName, req.body.paymentInfo,
        Date.now()
    ];

    let query = `UPDATE Companys SET ? WHERE id = ${id}`

    db.update(query, updateData)
        .subscribe(
        result => { res.status(200).json('OK'); },
        err => { res.status(500).json(err); }
        );
});

// 업체 회원정보 추가
router.put('/:id/append', (req, res) => {
    res.json('회원정보 추가');
});

// 업체 장치 정보 가져오기
router.get('/:id/machines', (req, res) => {

    res.json('업체 장치정보 가져오기');
});

module.exports = router;