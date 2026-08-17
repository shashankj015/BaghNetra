const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const tigerRoutes = require('./routes/tigerRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const imageRoutes = require('./routes/imageRoutes');
const runRoutes = require('./routes/runRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const alertRoutes = require('./routes/alertRoutes');
const modelRoutes = require('./routes/modelRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static serving for uploads & quarantine previews
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads'));
const QUARANTINE_DIR = path.resolve(process.env.QUARANTINE_DIR || path.join(__dirname, '../../quarantine'));
const SAMPLE_DIR = path.resolve(path.join(__dirname, '../../sample-data'));
const DATASETS_DIR = path.resolve(path.join(__dirname, '../../datasets'));
const REID_DIR = path.resolve(path.join(__dirname, '../../re id'));

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/quarantine', express.static(QUARANTINE_DIR));
app.use('/sample-data', express.static(SAMPLE_DIR));
app.use('/datasets', express.static(DATASETS_DIR));
app.use('/re-id', express.static(REID_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tigers', tigerRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/models', modelRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    service: 'BaghNetra-Backend-API',
    status: 'online',
    jurisdiction: 'Pench Tiger Reserve',
    timestamp: new Date()
  });
});

module.exports = app;
