const passport = require('passport');
const DigestStrategy = require('passport-http').DigestStrategy;

// production
// var user = {
//     payot: process.env.DIGEST_SUPER_ADMIN,
//     mobile: process.env.DIGEST_MOBILE_CLIENT,
//     company: process.env.DIGEST_COMPANY_CLIENT
// }

// development
var user = {
    payot: '71511b9ea252',
    mobile: process.env.DIGEST_MOBILE_CLIENT,
    company: process.env.DIGEST_COMPANY_CLIENT
}

passport.use(new DigestStrategy({ qop: 'auth' },
    (username, done) => {
        if (username in user) {
            done(null, username, user[username]);
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