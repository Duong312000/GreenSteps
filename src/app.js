const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const { sequelize } = require('./config/db.config');

const app = express();
let isDbConnected = false;

// Enable standard middlewares
app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Database connection check middleware
app.use(async (req, res, next) => {
  try {
    if (!isDbConnected) {
      await sequelize.authenticate();
      isDbConnected = true;
    }
    next();
  } catch (err) {
    isDbConnected = false;
    return res.status(503).json({
      success: false,
      error: 'DatabaseUnavailable',
      message: 'Không thể kết nối đến cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra lại cấu hình!',
      details: err.message
    });
  }
});

// Mount upload-base64 endpoint directly on app to avoid routes nesting complexities
const fs = require('fs');
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.post('/api/upload-base64', (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, message: 'No base64 data provided' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 format' });
    }

    const contentType = matches[1];
    const rawData = matches[2];
    const buffer = Buffer.from(rawData, 'base64');

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let ext = '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('gif')) ext = '.gif';

    const filename = `upload_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Base64 upload failed:', err);
    res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  }
});

// Mount all modular routes under both v1 and legacy prefixes for 100% compatibility
app.use('/api/v1', routes);
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
