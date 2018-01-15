const router = require('express').Router();
const db = require('../utils/database');

// 업체 정보 가져오기
router.get('/:id', (req, res) => {
    let id = req.params.id;
    let query = { _id: db.ObjectId(id) };
    let feild = { machines: false };

    db.company.find(query, (err, results) => {
        if (err) {
            res.status(500).json(err);
        } else {
            if (results) res.status(200).json(results[0]);
            else res.status(400).json(results[0]);
        }
    });
});

// 업체 회원 가입
router.post('/', (req, res) => {
    let company = req.body;

    db.company.insert(company, (err, results) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(results);
        }
    });
});

// 업체 회원 수정
router.put('/:id', (req, res) => {
    let id = req.params.id;
    let data = req.body;

    let target = { _id: db.ObjectId(id) };
    let updateData = { $set: data };

    db.company.update(target, updateData, (err, results) => {
        if (err) res.status(500).json(err);
        else {
            if (results) res.status(200).json(results[0]);
            else res.status(400).json(results);
        }
    });
});

// 업체 회원정보 추가
router.put('/:id/append', (req, res) => {
    let id = req.params.id;
    let data = req.body;

    let target = { _id: db.ObjectId(id) };
    let updateData = { $set: data };

    db.company.update(target, updateData, (err, results) => {
        if (err) res.status(500).json(err);
        else if (results) res.status(200).json(results);
        else res.status(400).json(results);
    });
});

// 업체 장치 정보 가져오기
router.get('/:id/machines', (req, res) => {
    let id = req.params.id;

    res.json('업체 장치정보 가져오기');
});

module.exports = router;