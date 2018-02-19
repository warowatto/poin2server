const Rx = require('rxjs');
const mysql = require('mysql');

// production
// const pool = mysql.createPool({
//     host: process.env.RDS_HOSTNAME,
//     user: process.env.RDS_USERNAME,
//     password: process.env.RDS_PASSWORD,
//     database: process.env.RDS_DATABASE,
//     port: process.env.RDS_PORT
// });

// development
const pool = mysql.createPool({
    host: 'aa11kbqrhpc77vp.cjdio7be0ee3.ap-northeast-2.rds.amazonaws.com',
    user: 'payot',
    password: 'Vpdldhxl2017',
    database: 'Poin',
    port: 3306
});

function dbQuery(query, params, callback) {
    pool.getConnection((err, connect) => {
        if (err) console.log(err);
        else {
            connect.query(query, [params], (err, results) => {
                callback(err, results);
                connect.release();
            });
        }
    });
}

function queryObserver(query, params, nullToError) {
    return Rx.Observable.create(e => {
        dbQuery(query, params, (err, rows) => {
            if (err) e.error(err);
            else {
                if (rows == null || rows.length == 0) {
                    if (nullToError != null) e.error(nullToError);
                    else e.next();
                } else {
                    rows.forEach(element => {
                        e.next(element);
                    });
                }
            }
            e.complete();
        });
    });
}

function updateObserver(query, params) {
    return Rx.Observable.create(e => {
        dbQuery(query, params, (err, result) => {
            if (err) {
                e.error(err);
            } else {
                e.next(result);
            }
            e.complete();
        });
    });
}

function colum() {
    let array = [];
    for (var i = 0; i < arguments.length; i++) {
        array.push(arguments[i]);
    }
    return array.reduce((v1, v2) => { return `${v1}, ${v2}`; });
}

module.exports = {
    colum: colum,
    query: queryObserver,
    update: updateObserver
}