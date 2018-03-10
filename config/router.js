module.exports = app => {
    app.use('/user', require('../router/user'));
    app.use('/company', require('../router/company'));
    app.use('/machine', require('../router/machine'));
    app.use('/event', require('../router/event'));
    app.use('/install', require('../router/install'));
};