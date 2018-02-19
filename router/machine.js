const Observable = require('rxjs').Observable;
const router = require('express').Router();

const db = require('../module/DatabaseModule');

// 사용가능한 장치인지 확인
router.get('/:macAddress', (req, res) => {
    // MAC AA:BB:CC:DD:EE
    let id = req.params.macAddress;

    // 장비조회
    let machineColums = db.colum('*');
    let machineFindQuery = `SELECT ${machineColums} FROM Machines WHERE macAddress = ? AND isRunning = true`;

    // 장비 상품조회
    let productsColums = db.colum('*');
    let productsFindQuery = `SELECT ${productsColums} FROM MachineProducts 
    LEFT JOIN Products ON MachineProducts.productId = Products.Id
    WHERE machineId = ?`;

    // 장비 타입조회
    let typeColums = db.colum('*');
    let typeFindQuery = `SELECT ${typeColums} FROM MachineTypes WHERE id = ?`;

    // 현 장비의 이벤트 목록
    let eventColums = db.colum('*');
    let evnetFindQuery = `SELECT ${eventColums} FROM Events WHERE machineType = ?`

    // 장치 DB 조회
    db.query(machineFindQuery, [id], 'Not Service Machine')
        // 장치정보를 찾았다면
        .flatMap(machine => {
            let productsObserver = db.query(productsFindQuery, [machine.id]);
            let typeObserver = db.query(typeFindQuery, [machine.typeId]).toArray();
            let eventsObserver = db.query(evnetFindQuery, [machine.typeId]).toArray();
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
                res.status(500).json(err);
            }
        });
});

// 장치 등록
router.post('/', (req, res) => {
    // 장치등록시 입력 컬럼
    let machineInsertColum = db.colum(
        'companyId', 'macAddress', 'deviceName',
        'displayName', 'isRunning', 'create_at'
    );

    // 장치 등록 파라미터
    let machineInsertParams = {
        companyId: req.body.companyId,
        macAddress: req.body.macAddress,
        deviceName: req.body.deviceName,
        displayName: req.body.displayName,
        isRunning: true,
        create_at: Date()
    };
    // 장치 등록 쿼리
    let machineInsertQuery = `INSERT INTO Machines SET ?`;

    db.update(machineInsertQuery, machineInsertParams)
        .flatMap(result => {
            // 기기등록 완료
            let insertId = result.insertId;
            // 장치 설정 추가
            let machineConfigParams = {
                machineId: insertId,
                defaultPrice: req.body.defaultPrice,
                oneTimePrice: req.body.oneTimePrice,
                repeatCount: req.body.repeatCount,
                totalAmount: req.body.totalAmount
            };
            let machineConfigQuery = `INSERT INTO MachineConfig SET ?`;

            // 장치 동작 설정 업데이트
            return db.update(machineConfigQuery, machineConfigParams)
        })
        .subscribe(
        success => { res.status(200).json(success); },
        err => { res.status(500).json(err); }
        );
});

// 장치 정보 수정
router.put('/', (req, res) => {
    // 장치 정보
    let machine = req.body.machine;
    req.json('장치 정보 수정');
});

module.exports = router;