const router = require('express').Router();

// 회원정보 가져오기
router.use('/:id', (req, res) => {
    // 회원아이디
    let id = req.params.id;
    res.json('회원정보');
});

router.post('/', (req, res) => {
    // 회원정보
    let user = req.body.user;
    res.json('회원가입');
});

// 회원정보 수정
router.put('/', (req, res) => {
    // 회원정보
    let user = req.body.user;
    res.json('회원정보');
});

// 회원 탈퇴
router.delete('/:id', (req, res) => {
    // 회원 아이디
    let id = req.params.id;
    res.json('회원탈퇴 정보')
});

module.exports = router;