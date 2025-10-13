const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// GET /api/knowledge-base - Get all knowledge base articles
router.get('/', isAuthenticated, async (req, res) => {
    const { search, category } = req.query;
    
    try {
        const db = await openDb();
        
        let query = `
            SELECT kb.*, u.username as authorName
            FROM knowledge_base kb
            JOIN users u ON kb.createdBy = u.id
            WHERE kb.isPublic = 1
        `;
        let params = [];
        
        if (search) {
            query += ` AND (kb.title LIKE ? OR kb.content LIKE ? OR kb.tags LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (category) {
            query += ` AND kb.category = ?`;
            params.push(category);
        }
        
        query += ` ORDER BY kb.viewCount DESC, kb.lastUpdated DESC`;
        
        const articles = await db.all(query, params);
        res.json(articles);
    } catch (err) {
        console.error('Error fetching knowledge base:', err);
        res.status(500).json({ message: 'Failed to fetch knowledge base articles.' });
    }
});

// GET /api/knowledge-base/categories - Get all categories
router.get('/categories', isAuthenticated, async (req, res) => {
    try {
        const db = await openDb();
        const categories = await db.all(`
            SELECT DISTINCT category 
            FROM knowledge_base 
            WHERE isPublic = 1 
            ORDER BY category
        `);
        res.json(categories.map(c => c.category));
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Failed to fetch categories.' });
    }
});

// GET /api/knowledge-base/:id - Get a specific article
router.get('/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    
    try {
        const db = await openDb();
        
        const article = await db.get(`
            SELECT kb.*, u.username as authorName
            FROM knowledge_base kb
            JOIN users u ON kb.createdBy = u.id
            WHERE kb.id = ? AND kb.isPublic = 1
        `, id);
        
        if (!article) {
            return res.status(404).json({ message: 'Article not found.' });
        }
        
        // Increment view count
        await db.run('UPDATE knowledge_base SET viewCount = viewCount + 1 WHERE id = ?', id);
        article.viewCount += 1;
        
        res.json(article);
    } catch (err) {
        console.error('Error fetching article:', err);
        res.status(500).json({ message: 'Failed to fetch article.' });
    }
});

// POST /api/knowledge-base - Create a new article (admin/tech only)
router.post('/', hasRole(['admin', 'tech']), async (req, res) => {
    const { title, content, category, tags, isPublic } = req.body;
    const { id: userId } = req.session.user;
    
    if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required.' });
    }
    
    try {
        const db = await openDb();
        const now = new Date().toISOString();
        
        const result = await db.run(`
            INSERT INTO knowledge_base (title, content, category, tags, createdBy, dateCreated, lastUpdated, isPublic)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, content, category, tags || '', userId, now, now, isPublic ? 1 : 0]);
        
        const newArticle = await db.get(`
            SELECT kb.*, u.username as authorName
            FROM knowledge_base kb
            JOIN users u ON kb.createdBy = u.id
            WHERE kb.id = ?
        `, result.lastID);
        
        res.status(201).json(newArticle);
    } catch (err) {
        console.error('Error creating article:', err);
        res.status(500).json({ message: 'Failed to create article.' });
    }
});

// PUT /api/knowledge-base/:id - Update an article (admin/tech only)
router.put('/:id', hasRole(['admin', 'tech']), async (req, res) => {
    const { id } = req.params;
    const { title, content, category, tags, isPublic } = req.body;
    
    if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required.' });
    }
    
    try {
        const db = await openDb();
        const now = new Date().toISOString();
        
        const result = await db.run(`
            UPDATE knowledge_base 
            SET title = ?, content = ?, category = ?, tags = ?, lastUpdated = ?, isPublic = ?
            WHERE id = ?
        `, [title, content, category, tags || '', now, isPublic ? 1 : 0, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Article not found.' });
        }
        
        const updatedArticle = await db.get(`
            SELECT kb.*, u.username as authorName
            FROM knowledge_base kb
            JOIN users u ON kb.createdBy = u.id
            WHERE kb.id = ?
        `, id);
        
        res.json(updatedArticle);
    } catch (err) {
        console.error('Error updating article:', err);
        res.status(500).json({ message: 'Failed to update article.' });
    }
});

// DELETE /api/knowledge-base/:id - Delete an article (admin only)
router.delete('/:id', hasRole(['admin']), async (req, res) => {
    const { id } = req.params;
    
    try {
        const db = await openDb();
        const result = await db.run('DELETE FROM knowledge_base WHERE id = ?', id);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Article not found.' });
        }
        
        res.json({ message: 'Article deleted successfully.' });
    } catch (err) {
        console.error('Error deleting article:', err);
        res.status(500).json({ message: 'Failed to delete article.' });
    }
});

module.exports = router;