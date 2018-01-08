const passport = require('passport');
const router = require('express').Router();

router.get('/:id', (req, res) => {
    let id = req.params.id;

    req.json('장치 정보 반환');
});

// 장치 등록
router.post('/', (req, res) => {
    // 업체 정보
    let company = req.body.company.id;
    // 장치 정보
    let machine = req.body.machine;
    req.json('장치 등록');
});

// 장치 정보 수정
router.put('/', (req, res) => {
    // 장치 정보
    let machine = req.body.machine;
    req.json('장치 정보 수정');
});

module.exports = router;