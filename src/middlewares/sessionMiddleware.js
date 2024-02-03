const { loadDataAuth, saveDataAuth } = require("../helpers/helpers");

const sessionMiddleware = async (req, res, next) => {
    let activeSessions = await loadDataAuth();

    const clientIP = req.header('x-forwarded-for') || req.connection.remoteAddress;

    if (activeSessions.includes(clientIP)) {
        return res.redirect('/login');
    }

    activeSessions.push(clientIP);
    await saveDataAuth(activeSessions);

    next();
}

module.exports = { sessionMiddleware };