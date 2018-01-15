const crypto = require('crypto');
const key = 'payot_encrypt_key';

// 암호화
function encrypt(text) {
    let cipher = crypto.createCipher('aes-256-cbc', key);
    let en = cipher.update(text, 'utf8', 'base64');
    en += cipher.final('base64');
    return en;
}

// 복호화
function decrypt(text) {
    let decipher = crypto.createDecipher('aes-256-cbc', key);
    let de = decipher.update(text, 'base64', 'utf8');
    de += decipher.final('utf8');
    return de;
}

// 암호화 가능한 변수인지 체크
function encryptTypeCheck(object) {
    // 문자열이야 하며 길이가 1보다는 크고 날짜가 아니어야 함
    return typeof object == 'string'
        && object.length > 1
        && !(object instanceof Date)
}

// 객체의 문자열을 암/복호화
function objectEncrypt(object, method) {
    if (Array.isArray(object)) {
        object = object.map(item => { 
            return objectEncrypt(item, method) 
        });
    } else if(typeof object == 'object') {
        Object.getOwnPropertyNames(object).forEach(name => {
            object[name] = objectEncrypt(object[name], method);
        });
    } else {
        if (encryptTypeCheck(object)) object = method(object);
    }
    return object;
}

module.exports = {
    object: objectEncrypt,
    encrypt: encrypt,
    decrypt: decrypt
}