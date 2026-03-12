const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'algoritmos_secret_2024';

module.exports = function authRoutes(db) {
    const router = express.Router();

    // POST /api/auth/register
    router.post('/register', (req, res) => {
        const { email, password, name, lastname } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (!name || !lastname) return res.status(400).json({ error: 'Name and lastname required' });
        if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const hash = bcrypt.hashSync(password, 10);
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, email, password_hash, role, name, lastname) VALUES (?, ?, ?, ?, ?, ?)').run(
            id, email, hash, 'user', name.trim(), lastname.trim()
        );

        return res.status(201).json({ message: 'User registered successfully' });
    });

    // POST /api/auth/login
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name, lastname: user.lastname },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role, name: user.name, lastname: user.lastname }
        });
    });

    return router;
};
