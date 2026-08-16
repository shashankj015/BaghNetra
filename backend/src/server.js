require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const CameraStation = require('./models/CameraStation');
const Tiger = require('./models/Tiger');
const User = require('./models/User');

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

    // 2. Seed Resident Tigers if empty
    const tigerCount = await Tiger.countDocuments();
    if (tigerCount === 0) {
      console.log('[BaghNetra-Seed] Seeding Pench resident tiger catalog...');
      const tigers = [
        {
          tigerId: 'BT001',
          name: 'Collarwali / Baghin (PTR-T-15)',
          sex: 'FEMALE',
          estimatedAge: 6.5,
          status: 'RESIDENT',
          stations: ['PTR-C-01', 'PTR-C-02', 'PTR-C-04'],
          activityCentroid: { latitude: 21.6780, longitude: 79.3280 },
          occupiedArea: 28.4,
          healthNotes: 'Legendary matriarch of Pench. Consistent core territory usage.'
        },
        {
          tigerId: 'BT002',
          name: 'Langdi / T-20',
          sex: 'FEMALE',
          estimatedAge: 5.0,
          status: 'RESIDENT',
          stations: ['PTR-C-02', 'PTR-C-03'],
          activityCentroid: { latitude: 21.6860, longitude: 79.3170 },
          occupiedArea: 22.1,
          healthNotes: 'Dominant core female with distinctive right flank stripes.'
        },
        {
          tigerId: 'BT003',
          name: 'Raiyyakassa Male (PTR-T-30)',
          sex: 'MALE',
          estimatedAge: 7.0,
          status: 'RESIDENT',
          stations: ['PTR-C-01', 'PTR-C-03', 'PTR-C-04'],
          activityCentroid: { latitude: 21.7010, longitude: 79.3100 },
          occupiedArea: 48.5,
          healthNotes: 'Large territorial prime breeding male covering northern core.'
        },
        {
          tigerId: 'BT004',
          name: 'Charger / T-40',
          sex: 'MALE',
          estimatedAge: 4.5,
          status: 'RESIDENT',
          stations: ['PTR-C-02', 'PTR-B-02'],
          activityCentroid: { latitude: 21.6310, longitude: 79.3830 },
          occupiedArea: 35.2,
          healthNotes: 'Southern sector male active near Jamtara buffer boundary.'
        },
        {
          tigerId: 'BT005',
          name: 'Bikram / T-50',
          sex: 'MALE',
          estimatedAge: 3.5,
          status: 'DISPERSING',
          stations: ['PTR-B-01'],
          activityCentroid: { latitude: 21.7850, longitude: 79.4120 },
          occupiedArea: 19.8,
          healthNotes: 'Young dispersing sub-adult male monitored along Rukhad buffer ridge.'
        }
      ];
      await Tiger.insertMany(tigers);
      console.log(`[BaghNetra-Seed] Seeded ${tigers.length} Pench resident tigers.`);
    }

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
