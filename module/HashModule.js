const crypto = require('crypto');

crypto.createHash('sha1');

module.exports = function (text) {
    crypto.update(text);
    return crypto.digest('hex');
}