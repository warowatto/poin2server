const passport = require('passport');
const DigestStrategy = require('passport-http').DigestStrategy;
const userList = require('../config/RestApiAuth');

passport.use(new DigestStrategy({ qop: 'auth' },
    (username, done) => {
        let user = userList.filter(apiUser => { return apiUser.name == username; })[0];
        console.log(username);
        if (user) {
            done(null, user.name, user.password);
        } else {
            done(null, false);
        }
    },
    (params, done) => {
        console.log(params);
        done(null, true);
    }
));

module.exports = app => {
    app.use(passport.authenticate('digest', { session: false }));
}