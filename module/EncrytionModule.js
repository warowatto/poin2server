"use strict";

const crypto = require('crypto');
const key = 'payot_encrypt_key';

// 암호화
function encrypt(text) {
    let cipher = crypto.createCipher('aes-256-cbc', key);
    cipher.update(text, 'utf8', 'base64');
    return cipher.final('base64');
}

// 복호화
function decrypt(text) {
    let decipher = crypto.createDecipher('aes-256-cbc', key);
    decipher.update(text, 'base64', 'utf8');
    return decipher.final('utf8');
}

// 객체안에 포함된 모든 문자열 정보를 암/복호화
function propertyChange(object, change) {
    let newObject = object;
    Object.getOwnPropertyNames(object)
        .filter(name => { 
            return typeof object[name] == 'string'; 
        })
        .forEach(name => {
            return newObject[name] = change(object[name]);
        });
    return newObject;
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    propertyChange: propertyChange
}