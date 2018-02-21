const Observable = require('rxjs').Observable;
const router = require('express').Router();
const cleanArray = require('clean-array');

const db = require('../module/DatabaseModule');

// 사용가능한 장치인지 확인
router.get('/:macAddress', (req, res) => {
    // MAC AA:BB:CC:DD:EE
    let macAddress = req.params.macAddress;

    // 장비조회
    let machineColums = db.colum('*');
    let machineFindQuery = `SELECT ${machineColums} FROM Machines WHERE macAddress = ?;`;

    // 업체 조회
    let companyColums = db.colum('tel', 'name', 'email');
    let companyFindQuery = `SELECT ${companyColums} FROM Companys WHERE id = ?;`;

    // 장비 상품조회
    let productsColums = db.colum('productId, name, description, serviceTime, price');
    let productsFindQuery = `SELECT ${productsColums} FROM MachineProducts 
    LEFT JOIN Products ON MachineProducts.productId = Products.Id
    WHERE machineId = ?`;

    // 장비 타입조회
    let typeColums = db.colum('*');
    let typeFindQuery = `SELECT ${typeColums} FROM MachineTypes WHERE id = ?`;

    // 현 장비의 이벤트 목록
    // let eventColums = db.colum('id, title, description, start_at, end_at');
    // let evnetFindQuery = `SELECT ${eventColums} FROM Events WHERE machineType = ? OR machineType = -1`;

    // 장비 데이터 가져오기
    db.query(machineFindQuery, [macAddress], 'NOT FOUND DEVICE')
        .flatMap(device => {
            return Observable.zip(
                // 업체검색
                db.query(companyFindQuery, [device.companyId]),
                // 상품검색
                db.query(productsFindQuery, [device.id]).toArray(),
                // 장치타입 조회
                db.query(typeFindQuery, [device.typeId]),
                // 이벤트 목록 조회
                // db.query(evnetFindQuery, [device.typeId])
                //     .toArray()
                //     .map(events => cleanArray(events))
                //     .map(events => { if(events.length == 0) { return null } else { return events; } }),
                (company, products, type) => {
                    delete device.companyId;
                    delete device.typeId;
                    
                    let running = device.isRunning;
                    device.type = type.name;

                    delete device.isRunning;
                    return {
                        company: company,
                        machine: device,
                        products: products,
                        isRunning: running
                    }
                })
        })
        .subscribe(
            results => { res.status(200).json(results); },
            err => { res.status(500).json(err); }
        );
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
            return db.update(machineConfigQuery, machineConfigParams);
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