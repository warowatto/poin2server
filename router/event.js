const router = require('express').Router();

// 이벤트 목록
router.get(['/', '/:id'], (req, res) => {
    
    let id = req.params.id;

    if(id) {
        res.json(`이벤트 : ${id}`);
    } else { 
        res.json('이벤트 목록');
    }
});
// 이벤트 단일 목록

module.exports = router;