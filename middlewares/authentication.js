const { validateToken } = require('../services/authentication');
function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        console.log("🔍 Checking for auth cookie...");
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return next();
        }

        try {
            const userPayLoad = validateToken(tokenCookieValue);
            req.user = userPayLoad;
            console.log("Decoded user:", req.user);
        } catch (error) { }
        return next();

    };
}

module.exports = {
    checkForAuthenticationCookie,
}