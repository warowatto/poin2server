"use strict";

const Rx = require('rxjs');
const mysql = require('mysql');
const serviceQuery = require('./query');
const enc = require('./encrypt');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'poin'
});

// db 질의 요청
function dbQuery(query, params, callback) {
    pool.getConnection((err, connect) => {
        connect.query(query, [params], (err, results) => {
            callback(err, results);
            connect.release();
        });
    });
}

function queryObserver(query, params, nullToError) {
    return Rx.Observable.create(e => {
        // 질의를 할때는 암호화 하여 동일한 값을 찾기
        params = enc.object(params, enc.encrypt);
        dbQuery(query, params, (err, rows) => {
            if (err) e.error(err);
            else {
                if (rows == null || rows.length == 0) {
                    if (nullToError != null) e.error(nullToError);
                    else e.next(null);
                } else {
                    rows.forEach(element => {
                        e.next(enc.object(element, enc.decrypt));
                    });
                }
            }
            e.complete();
        });
    });
}

function updateObserver(query, params) {
    return Rx.Observable.create(e => {
        parmas = enc.object(params, enc.encrypt);
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