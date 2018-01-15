const Observable = require('rxjs').Observable;
const passport = require('passport');
const router = require('express').Router();

const db = require('../module/DatabaseModule');

// 사용가능한 장치인지 확인
router.get('/:macAddress', (req, res) => {
    // MAC AA:BB:CC:DD:EE
    let id = req.params.macAddress;

    // 장비조회
    let machineColums = db.colum('*');
    let machineFindQuery = `SELECT ${machineColums} FROM Machines WHERE macAddress = ? AND isRunning = ?`;

    // 장비 상품조회
    let productsColums = db.colum('*');
    let productsFindQuery = `SELECT ${productsColums} FROM Products WHERE machineId = ?`;

    // 장비 타입조회
    let typeColums = db.colum('*');
    let typeFindQuery = `SELECT ${typeColums} FROM MachineTypes WHERE id = ?`;

    // 현 장비의 이벤트 목록
    let eventColums = db.colum('*');
    let evnetFindQuery = `SELECT ${eventColums} FROM Events WHERE `

    // 장치 DB 조회
    db.query(machineFindQuery, [id, true], 'Not Service Machine')
        // 장치정보를 찾았다면
        .flatMap(machine => {
            let productsObserver = db.query(productsFindQuery, [machine.id]);
            let typeObserver = db.query(typeFindQuery, [machine.typeId]).toArray();
            let eventsObserver = db.query(evnetFindQuery, [machine.id]).toArray();
            return Observable.zip(productsObserver, typeObserver, eventsObserver,
                (products, type, events) => {
                machine.type = type;
                delete machine.prodcutId;
                return {
                    machine: machine,
                    products: products,
                    events: events
                }
            });
        })
        .subscribe(
        results => {
            res.status(200).json(results);
        },
        err => {
            if (err == 'Not Service Machine') {
                let error = {
                    message: '등록된 장치가 없습니다'
                }
                res.status(404).json({ message: '서비스 가능한 장치가 아닙니다' });
            } else {
                res.status(500).json({ message: '서버 동작 에러' });
            }
        }
        );
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