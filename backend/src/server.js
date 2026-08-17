require('dotenv').config();
const path = require('path');
const fs = require('fs');
const app = require('./app');
const { connectDB } = require('./config/db');
const CameraStation = require('./models/CameraStation');
const Tiger = require('./models/Tiger');
const User = require('./models/User');

const MovementRecord = require('./models/MovementRecord');
const occupancyService = require('./services/occupancyService');

const PORT = process.env.PORT || 5000;

const seedInitialData = async () => {
  try {
    // 1. Seed Pench Camera Stations if empty
    const stationCount = await CameraStation.countDocuments();
    if (stationCount === 0) {
      console.log('[BaghNetra-Seed] Seeding Pench Tiger Reserve camera network...');
      const stations = [
        { stationId: 'PTR-C-01', name: 'Karmajhiri Core Waterhole', latitude: 21.6842, longitude: 79.3124, zone: 'CORE' },
        { stationId: 'PTR-C-02', name: 'Turia Gate River Crossing', latitude: 21.6521, longitude: 79.3451, zone: 'CORE' },
        { stationId: 'PTR-C-03', name: 'Gumtara Core Meadow', latitude: 21.7214, longitude: 79.2890, zone: 'CORE' },
        { stationId: 'PTR-C-04', name: 'Alikatta Fireline Junction', latitude: 21.6980, longitude: 79.3280, zone: 'CORE' },
        { stationId: 'PTR-B-01', name: 'Rukhad Buffer Ridge', latitude: 21.7850, longitude: 79.4120, zone: 'BUFFER' },
        { stationId: 'PTR-B-02', name: 'Jamtara Buffer Corridor', latitude: 21.6110, longitude: 79.4210, zone: 'BUFFER' },
        { stationId: 'PTR-V-01', name: 'Khawasa Village Boundary', latitude: 21.5950, longitude: 79.3510, zone: 'VILLAGE_ADJACENT' },
        { stationId: 'PTR-V-02', name: 'Ari Village Agricultural Border', latitude: 21.8120, longitude: 79.4650, zone: 'VILLAGE_ADJACENT' }
      ];
      await CameraStation.insertMany(stations);
      console.log(`[BaghNetra-Seed] Seeded ${stations.length} Pench camera stations.`);
    }

    // 2. Seed Tigers directly from dataset if available
    const datasetTigersPath = path.join(__dirname, 'utils/dataset_tigers.json');
    if (fs.existsSync(datasetTigersPath)) {
      try {
        const datasetTigers = JSON.parse(fs.readFileSync(datasetTigersPath, 'utf8'));
        const currentCount = await Tiger.countDocuments();
        if (currentCount < datasetTigers.length) {
          await Tiger.deleteMany({});
          await Tiger.insertMany(datasetTigers);
          console.log(`[BaghNetra-Seed] Seeded ${datasetTigers.length} real wild tigers directly from dataset.`);
        }
      } catch (err) {
        console.warn(`[BaghNetra-Seed] Error loading dataset tigers: ${err.message}`);
      }
    } else {
      const tigerCount = await Tiger.countDocuments();
      if (tigerCount === 0) {
        console.log('[BaghNetra-Seed] Seeding default tiger catalog...');
        const tigers = [
          {
            tigerId: 'TIGER_001',
            name: 'Wild Tiger #001',
            sex: 'FEMALE',
            estimatedAge: 6.5,
            status: 'RESIDENT',
            healthNotes: 'Wild individual with distinct flank stripe pattern.'
          }
        ];
        await Tiger.insertMany(tigers);
      }
    }

    // 3. Seed Grounded Historical Movement Telemetry if empty
    const movementCount = await MovementRecord.countDocuments();
    if (movementCount === 0) {
      console.log('[BaghNetra-Seed] Seeding baseline historical movement records for catalog tigers...');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      const sampleMovements = [
        // BT001 (Collarwali) - Core stations
        { tigerId: 'BT001', stationId: 'PTR-C-01', zone: 'CORE', latitude: 21.6842, longitude: 79.3124, timestamp: new Date(now - 30 * dayMs), confidence: 0.94 },
        { tigerId: 'BT001', stationId: 'PTR-C-04', zone: 'CORE', latitude: 21.6980, longitude: 79.3280, timestamp: new Date(now - 18 * dayMs), confidence: 0.96 },
        { tigerId: 'BT001', stationId: 'PTR-C-02', zone: 'CORE', latitude: 21.6521, longitude: 79.3451, timestamp: new Date(now - 5 * dayMs), confidence: 0.92 },
        { tigerId: 'BT001', stationId: 'PTR-C-01', zone: 'CORE', latitude: 21.6842, longitude: 79.3124, timestamp: new Date(now - 1 * dayMs), confidence: 0.95 },

        // BT002 (Langdi) - Core stations
        { tigerId: 'BT002', stationId: 'PTR-C-02', zone: 'CORE', latitude: 21.6521, longitude: 79.3451, timestamp: new Date(now - 22 * dayMs), confidence: 0.91 },
        { tigerId: 'BT002', stationId: 'PTR-C-03', zone: 'CORE', latitude: 21.7214, longitude: 79.2890, timestamp: new Date(now - 12 * dayMs), confidence: 0.89 },
        { tigerId: 'BT002', stationId: 'PTR-C-04', zone: 'CORE', latitude: 21.6980, longitude: 79.3280, timestamp: new Date(now - 3 * dayMs), confidence: 0.93 },

        // BT003 (Raiyyakassa) - Northern core territory
        { tigerId: 'BT003', stationId: 'PTR-C-03', zone: 'CORE', latitude: 21.7214, longitude: 79.2890, timestamp: new Date(now - 28 * dayMs), confidence: 0.95 },
        { tigerId: 'BT003', stationId: 'PTR-C-01', zone: 'CORE', latitude: 21.6842, longitude: 79.3124, timestamp: new Date(now - 14 * dayMs), confidence: 0.96 },
        { tigerId: 'BT003', stationId: 'PTR-C-04', zone: 'CORE', latitude: 21.6980, longitude: 79.3280, timestamp: new Date(now - 2 * dayMs), confidence: 0.97 },

        // BT004 (Charger) - Southern core / Jamtara buffer
        { tigerId: 'BT004', stationId: 'PTR-C-02', zone: 'CORE', latitude: 21.6521, longitude: 79.3451, timestamp: new Date(now - 20 * dayMs), confidence: 0.90 },
        { tigerId: 'BT004', stationId: 'PTR-B-02', zone: 'BUFFER', latitude: 21.6110, longitude: 79.4210, timestamp: new Date(now - 4 * dayMs), confidence: 0.92 },

        // BT005 (Bikram) - Rukhad Buffer
        { tigerId: 'BT005', stationId: 'PTR-B-01', zone: 'BUFFER', latitude: 21.7850, longitude: 79.4120, timestamp: new Date(now - 10 * dayMs), confidence: 0.88 },
        { tigerId: 'BT005', stationId: 'PTR-C-03', zone: 'CORE', latitude: 21.7214, longitude: 79.2890, timestamp: new Date(now - 1 * dayMs), confidence: 0.85 }
      ];
      await MovementRecord.insertMany(sampleMovements);
      console.log(`[BaghNetra-Seed] Seeded ${sampleMovements.length} baseline movement records.`);
    }

    // 4. Synchronize tiger occupancy metrics dynamically from telemetry
    const allTigers = await Tiger.find({});
    for (const t of allTigers) {
      await occupancyService.regenerateTigerOccupancy(t.tigerId);
    }
    console.log('[BaghNetra-Seed] Regenerated dynamic telemetry-derived occupancy for all catalogue tigers.');

    // 3. Seed Default Admin User if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const admin = new User({
        username: 'admin',
        email: 'officer@penchtigerreserve.gov.in',
        password: 'password123',
        name: 'Divisional Forest Officer',
        role: 'admin',
        badgeNumber: 'PTR-DFO-01'
      });
      await admin.save();
      console.log('[BaghNetra-Seed] Seeded default admin user (admin / password123)');
    }
  } catch (err) {
    console.error(`[BaghNetra-Seed] Seeding notice: ${err.message}`);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  BAGHNETRA BACKEND API SERVER RUNNING ON PORT ${PORT} `);
      console.log(`  Jurisdiction: Pench Tiger Reserve               `);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error(`Failed to start BaghNetra backend: ${err.message}`);
    process.exit(1);
  }
};

startServer();
