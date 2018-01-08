const router = require('express').Router();

// 업체 정보 가져오기
router.get('/:id', (req, res) => {
    console.log('call company get');
    console.log(req.params.id);
    res.json('업체 정보 가져오기')
});

// 업체 회원 가입
router.post('/', (req, res) => {
    res.json('업체 회원 가입');
});

// 업체 회원 수정
router.put('/', (req, res) => {
    res.json('업체 정보 수정');
});

// 업체 장치 정보 가져오기
router.get('/:id/machines', (req, res) => {
    res.json('업체 장치정보 가져오기');
});


module.exports = router;