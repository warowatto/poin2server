const format = require('dateformat');

// 날짜 변환
function dateFormat(date) {
    return format(date, 'yyyy-mm-dd');
}

// 날짜시간 변환
function dateTimeFormat(date) {
    return format(date, 'yyyy-mm-dd HH:MM:ss');
}

module.exports = {
    dateFormat: dateFormat,
    dateTimeFormat: dateTimeFormat
}