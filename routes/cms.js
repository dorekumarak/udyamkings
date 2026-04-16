const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/' + (req.query.folder || '');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only image, PDF and Word documents are allowed!');
        }
    }
});

// Get all pages
router.get('/api/cms/pages', (req, res) => {
    // In a real app, this would query your database
    const pages = [
        { id: 1, title: 'Homepage', slug: '/', status: 'published', updatedAt: '2023-12-06' },
        { id: 2, title: 'About Us', slug: '/about', status: 'published', updatedAt: '2023-12-05' },
        { id: 3, title: 'Services', slug: '/services', status: 'draft', updatedAt: '2023-12-04' }
    ];
    res.json(pages);
});

// Create a new page
router.post('/api/cms/pages', (req, res) => {
    // In a real app, this would save to your database
    const newPage = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    res.status(201).json(newPage);
});

// Get all blog posts
router.get('/api/cms/posts', (req, res) => {
    // In a real app, this would query your database
    const posts = [
        { 
            id: 1, 
            title: 'Getting Started with UdyamKings', 
            slug: 'getting-started', 
            author: 'Admin', 
            status: 'published', 
            publishedAt: '2023-12-06',
            excerpt: 'Learn how to get started with UdyamKings platform.'
        }
    ];
    res.json(posts);
});

// Upload media
router.post('/api/cms/media', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileData = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: '/uploads/' + (req.query.folder ? req.query.folder + '/' : '') + req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
    };
    
    res.status(201).json(fileData);
});

// Get media library
router.get('/api/cms/media', (req, res) => {
    // In a real app, this would query your database or filesystem
    const media = [
        {
            id: 1,
            filename: 'sample.jpg',
            path: '/uploads/sample.jpg',
            size: 102400, // 100KB
            type: 'image/jpeg',
            dimensions: { width: 800, height: 600 },
            uploadedAt: '2023-12-06T10:30:00Z'
        }
    ];
    res.json(media);
});

// Delete media
router.delete('/api/cms/media/:id', (req, res) => {
    // In a real app, this would delete the file and its database record
    res.json({ success: true, message: 'Media deleted successfully' });
});

module.exports = router;
