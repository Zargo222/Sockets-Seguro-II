const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/config');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }

        req.username = decoded.username;
        next();
    });
}

module.exports = { verifyToken };