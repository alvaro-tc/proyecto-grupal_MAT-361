const express = require('express');
const authMiddleware = require('../middleware/auth');

module.exports = function usersRoutes(db) {
    const router = express.Router();

    // All routes require authentication and admin role
    router.use(authMiddleware);
    router.use((req, res, next) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
    });

    // GET /api/users - list all users
    router.get('/', (req, res) => {
        const users = db.prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at ASC').all();
        res.json(users);
    });

    // DELETE /api/users/:id - delete a user
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        res.json({ message: 'User deleted' });
    });

    return router;
};
