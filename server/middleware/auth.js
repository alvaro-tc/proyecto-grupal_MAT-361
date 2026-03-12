const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'algoritmos_secret_2024';

module.exports = function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
