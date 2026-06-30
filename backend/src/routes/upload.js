const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato no soportado, solo se permiten imágenes.'));
        }
    }
});

router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, error: 'No se subió ninguna imagen' });
    }
    // Remove "http://localhost:4000" in production if needed, but for now absolute is fine or just relative:
    const host = req.protocol + '://' + req.get('host');
    const imageUrl = `${host}/uploads/${req.file.filename}`;
    res.json({ ok: true, imageUrl, message: 'Imagen subida exitosamente' });
});

module.exports = router;
