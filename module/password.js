const Observable = require('rxjs').Observable
const pbkdf2 = require('pbkdf2-password')
const hasher = pbkdf2()

function getHash(password, salt) {
    return Observable.create(emit => {
        let opt = {
            password: password,
            salt: salt
        }
        console.log('get : ', opt)
        hasher(opt, (err, password, salt, hash) => {
            if (err) {
                emit.error(err)
            } else {
                emit.next(hash)
            }
        })
    })
}

function create(password) {
    let opt = { password: password }
    console.log('create : ', opt)
    return Observable.create(emit => {
        hasher(opt, (err, password, salt, hash) => {
            if (err) {
                emit.error(err)
            } else {
                emit.next({ hash: hash, salt: salt, password: password })
            }
        })
    })
}

module.exports = {
    getHash: getHash,
    create: create
}