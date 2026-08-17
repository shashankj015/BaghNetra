const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Test runner for BaghNetra backend & intelligence engine
async function runTests() {
  console.log('==================================================');
  console.log('    BAGHNETRA INTEGRATION & ACCEPTANCE TESTS      ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('[\x1b[32mPASSED\x1b[0m]');
      passed++;
    } catch (err) {
      console.log('[\x1b[31mFAILED\x1b[0m]');
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  };

  const { connectDB, disconnectDB } = require('../src/config/db');
  await connectDB();

  const User = require('../src/models/User');
  const Tiger = require('../src/models/Tiger');
  const CameraStation = require('../src/models/CameraStation');
  const Image = require('../src/models/Image');
  const Alert = require('../src/models/Alert');
  const MovementRecord = require('../src/models/MovementRecord');
  const movementService = require('../src/services/movementAnalysisService');
  const occupancyService = require('../src/services/occupancyService');
  const quarantineService = require('../src/services/quarantineService');
  const geoUtils = require('../src/utils/geoUtils');

  // Test 1: User Auth & Password Hash
  await test('User Registration & Password Hashing', async () => {
    const testUser = new User({
      username: `test_bio_${Date.now()}`,
      email: `bio_${Date.now()}@pench.gov.in`,
      password: 'FieldPassword@2026',
      name: 'Dr. Ramesh Sharma (Biologist)',
      role: 'biologist'
    });
    await testUser.save();
    assert(testUser.password !== 'FieldPassword@2026', 'Password should be hashed');
    const isMatch = await testUser.comparePassword('FieldPassword@2026');
    assert(isMatch === true, 'Password comparison should match');
  });

  // Test 2: Camera Station Spatial Validation
  await test('Camera Station Zoning & CRUD', async () => {
    const st = new CameraStation({
      stationId: `TEST-ST-${Date.now().toString().slice(-4)}`,
      name: 'Pench Test Waterhole',
      latitude: 21.6842,
      longitude: 79.3124,
      zone: 'CORE',
      status: 'ACTIVE'
    });
    await st.save();
    assert(st.zone === 'CORE');
  });

  // Test 3: Spatial Calculations (Haversine, Centroid, Convex Hull)
  await test('Spatial GeoMath (Haversine Distance & Convex Hull)', async () => {
    // Distance between Karmajhiri (21.6842, 79.3124) and Turia (21.6521, 79.3451)
    const dist = geoUtils.haversineDistance(21.6842, 79.3124, 21.6521, 79.3451);
    assert(dist > 3.0 && dist < 7.0, `Calculated distance ${dist}km should be ~4.9km`);

    // Convex Hull of 4 points
    const points = [
      { latitude: 21.68, longitude: 79.31 },
      { latitude: 21.72, longitude: 79.29 },
      { latitude: 21.69, longitude: 79.33 },
      { latitude: 21.65, longitude: 79.34 }
    ];
    const hull = geoUtils.computeConvexHull(points);
    assert(hull.length >= 4, 'Convex hull should contain closed polygon coordinates');
    const area = geoUtils.computePolygonAreaKm2(hull);
    assert(area > 10.0, `Calculated area ${area} km² should be realistic territory size`);
  });

  // Test 4: Tiger Territory & Occupancy Calculation
  await test('Tiger Occupancy Regeneration & Centroid Calculation', async () => {
    const tid = `BT_TEST_${Date.now().toString().slice(-4)}`;
    const tiger = new Tiger({
      tigerId: tid,
      name: 'Test Collarwali Subadult',
      sex: 'FEMALE',
      status: 'RESIDENT'
    });
    await tiger.save();

    // Create 3 movement records
    const m1 = new MovementRecord({ tigerId: tid, stationId: 'PTR-C-01', latitude: 21.6842, longitude: 79.3124, timestamp: new Date(Date.now() - 3600000 * 48) });
    const m2 = new MovementRecord({ tigerId: tid, stationId: 'PTR-C-02', latitude: 21.6521, longitude: 79.3451, timestamp: new Date(Date.now() - 3600000 * 24) });
    const m3 = new MovementRecord({ tigerId: tid, stationId: 'PTR-C-04', latitude: 21.6980, longitude: 79.3280, timestamp: new Date() });
    await Promise.all([m1.save(), m2.save(), m3.save()]);

    const updated = await occupancyService.regenerateTigerOccupancy(tid);
    assert(updated.totalCaptures === 3, 'Should have 3 total captures');
    assert(updated.stations.length === 3, 'Should visit 3 unique stations');
    assert(updated.occupiedArea > 0, 'Occupied area should be computed');
    assert(updated.activityCentroid.latitude > 21.6, 'Centroid latitude should be valid');
  });

  // Test 5: Movement Deviation & Alert Engine
  await test('Movement Deviation Engine (Village Incursion & Centroid Shift Alert)', async () => {
    const tid = 'BT_DEV_01';
    const tiger = new Tiger({
      tigerId: tid,
      name: 'Test Dispersing Male',
      stations: ['PTR-C-01', 'PTR-C-02'],
      activityCentroid: { latitude: 21.6840, longitude: 79.3120 },
      occupiedArea: 25.0,
      status: 'RESIDENT'
    });
    await tiger.save();

    // Create new capture at Village-Adjacent station (Khawasa Border)
    const newCaptures = [
      {
        tigerId: tid,
        stationId: 'PTR-V-01',
        latitude: 21.5950,
        longitude: 79.3510,
        timestamp: new Date()
      }
    ];

    const alerts = await movementService.analyzeRunMovement('RUN_TEST_DEV', newCaptures);
    assert(alerts.length >= 1, 'Should generate deviation alert');
    const villageAlert = alerts.find(a => a.type === 'VILLAGE_ADJACENT_RISK' || a.type === 'FIRST_STATION_CAPTURE');
    assert(villageAlert !== undefined, 'Should flag high priority village border encroachment');
  });

  // Test 6: Safe Blank Quarantine Handling
  await test('Safe Blank Quarantine Staging (No Permanent Deletion)', async () => {
    const dummyPath = path.join(__dirname, 'dummy_blank.jpg');
    fs.writeFileSync(dummyPath, 'SIMULATED_BLANK_IMAGE_PAYLOAD_BUFFER');

    const imgDoc = new Image({
      fileName: 'dummy_blank.jpg',
      filePath: dummyPath,
      cameraStation: 'PTR-C-01',
      blank: true,
      blankConfidence: 0.94
    });
    await imgDoc.save();

    const qRes = await quarantineService.stageBlankImage(imgDoc, dummyPath);
    assert(qRes.quarantined === true, 'Image should be staged into quarantine directory');
    assert(imgDoc.isQuarantined === true, 'Document flag isQuarantined should be true');

    // Test restore
    const restored = await quarantineService.restoreFromQuarantine(imgDoc._id);
    assert(restored.image.isQuarantined === false, 'Image should be restored from quarantine upon review');

    // Clean up
    if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    if (fs.existsSync(qRes.quarantinePath)) fs.unlinkSync(qRes.quarantinePath);
  });

  console.log(`\nTest Results: ${passed} Passed, ${failed} Failed`);
  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
