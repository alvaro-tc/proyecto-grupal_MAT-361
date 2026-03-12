const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

module.exports = function canvasRoutes(db) {
    const router = express.Router();
    router.use(authMiddleware);

    // GET /api/canvases - list user's canvases
    router.get('/', (req, res) => {
        const canvases = db.prepare(
            'SELECT id, name, created_at FROM canvases WHERE user_id = ? ORDER BY created_at DESC'
        ).all(req.user.id);
        res.json(canvases);
    });

    // POST /api/canvases - save a canvas
    router.post('/', (req, res) => {
        const { name, nodes, edges, config } = req.body;
        if (!name) return res.status(400).json({ error: 'Canvas name is required' });

        const id = uuidv4();
        const data = JSON.stringify({ nodes, edges, config });
        db.prepare('INSERT INTO canvases (id, user_id, name, data) VALUES (?, ?, ?, ?)').run(id, req.user.id, name, data);

        res.status(201).json({ id, name, message: 'Canvas saved' });
    });

    // GET /api/canvases/:id - load a single canvas
    router.get('/:id', (req, res) => {
        const canvas = db.prepare('SELECT * FROM canvases WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

        res.json({ ...canvas, data: JSON.parse(canvas.data) });
    });

    // DELETE /api/canvases/:id - delete a canvas
    router.delete('/:id', (req, res) => {
        const canvas = db.prepare('SELECT id FROM canvases WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

        db.prepare('DELETE FROM canvases WHERE id = ?').run(req.params.id);
        res.json({ message: 'Canvas deleted' });
    });

    return router;
};
