const {verifytoken} = require('../utils/auth');
function checkauthcookie(cookie) {
    return function (req, res, next) {
        const tokencookievalue = req.cookies[cookie];
        if (!tokencookievalue) {
            return next();
        }

        try {
            const userpayload = verifytoken(tokencookievalue);
                req.user = userpayload;
                res.locals.user = userpayload;
        } catch(error){}
        return next();
    };
}
module.exports = checkauthcookie;