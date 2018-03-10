const Observable = require('rxjs').Observable;
const router = require('express').Router();
const db = require('../module/DatabaseModule');
const hash = require('../module/password');

router.get('/types', (req, res) => {
    let query = `SELECT * FROM MachineTypes`;

    db.query(query, [])
        .subscribe(
            result => {
                res.status(200).json(result);
            },
            err => {
                res.status(500).json({ message: err });
            });
});

router.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    let findCompany = `SELECT * FROM Companys WHERE email = ?;`;
    let findUser = db.query(findCompany, [email]);

    findUser.flatMap(result => {
        let salt = result.salt;
        let dbpassword = result.password;
        return hash.getHash(password, salt)
            .map(resultHash => {
                return {
                    saveHash: dbpassword,
                    nowHash: resultHash,
                    company: result
                }
            })
    }).subscribe(
        result => {
            res.status(200).json(result);
        },
        err => {
            res.status(404).json({ message: err })
        }
    )
});

router.post('/machine', (req, res) => {
    let companyId = req.body.companyId;
    let macAddress = req.body.macAddress;
    let deviceName = req.body.deviceName;
    let displayName = req.body.displayName;
    let typeId = req.body.typeId;
    let description = req.body.description;

    let insertMachineQuery = `INSERT INTO Machines SET ?;`;
    let machineParams = {
        companyId: companyId,
        macAddress: macAddress,
        deviceName: deviceName,
        displayName: displayName,
        typeId: typeId,
        description: description,
        create_at: new Date()
    }

    db.query(insertMachineQuery, [machineParams])
        .flatMap(result => {
            let insertId = result.insertId;
            let query = `SELECT * FROM Machines WHERE id = ?;`;
            return db.query(query, [insertId])
        })
        .subscribe(
            result => {
                res.status(200).json(result);
            },
            err => {
                res.status(404).json({ message: err });
            }
        )
});

module.exports = router;