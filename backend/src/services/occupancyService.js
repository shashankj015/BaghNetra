const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const { computeCentroid, computeConvexHull, computePolygonAreaKm2 } = require('../utils/geoUtils');

class OccupancyService {
  /**
   * Regenerates area occupancy, centroid, convex hull home range, and area (km²) for a tiger.
   */
  async regenerateTigerOccupancy(tigerId) {
    const tiger = await Tiger.findOne({ tigerId });
    if (!tiger) return null;

    // Fetch all movement records for this tiger
    const records = await MovementRecord.find({ tigerId }).sort({ timestamp: 1 });
    if (records.length === 0) return tiger;

    const points = records.map(r => ({
      latitude: r.latitude,
      longitude: r.longitude,
      stationId: r.stationId,
      timestamp: r.timestamp
    }));

    // 1. Calculate Activity Centroid
    const centroid = computeCentroid(points);

    // 2. Calculate Home Range Minimum Convex Polygon (MCP)
    const hullCoords = computeConvexHull(points);

    // 3. Calculate Estimated Area in km²
    const occupiedAreaKm2 = computePolygonAreaKm2(hullCoords);

    // 4. Extract unique stations visited
    const stationSet = [...new Set(records.map(r => r.stationId))];

    // Update Tiger record
    tiger.activityCentroid = centroid;
    tiger.homeRange = {
      type: 'Polygon',
      coordinates: [hullCoords]
    };
    tiger.occupiedArea = round(occupiedAreaKm2, 2);
    tiger.stations = stationSet;
    tiger.totalCaptures = records.length;
    tiger.firstSeen = records[0].timestamp;
    tiger.lastSeen = records[records.length - 1].timestamp;

    await tiger.save();
    return tiger;
  }

  /**
   * Calculates territorial overlap between all resident tigers.
   */
  async calculateTerritorialOverlaps() {
    const tigers = await Tiger.find({ status: { $ne: 'DECEASED' } });
    const overlaps = [];

    for (let i = 0; i < tigers.length; i++) {
      for (let j = i + 1; j < tigers.length; j++) {
        const t1 = tigers[i];
        const t2 = tigers[j];

        // Check station overlap
        const sharedStations = (t1.stations || []).filter(s => (t2.stations || []).includes(s));
        
        // Calculate centroid distance
        const { haversineDistance } = require('../utils/geoUtils');
        const centroidDist = haversineDistance(
          t1.activityCentroid.latitude,
          t1.activityCentroid.longitude,
          t2.activityCentroid.latitude,
          t2.activityCentroid.longitude
        );

        if (sharedStations.length > 0 || centroidDist < 12.0) {
          overlaps.push({
            tiger1: { tigerId: t1.tigerId, name: t1.name, sex: t1.sex },
            tiger2: { tigerId: t2.tigerId, name: t2.name, sex: t2.sex },
            sharedStations,
            centroidDistanceKm: round(centroidDist, 2),
            interactionType: (t1.sex !== t2.sex) ? 'MATING_PAIR_OVERLAP' : 'TERRITORIAL_COMPETITION'
          });
        }
      }
    }

    return overlaps;
  }
}

function round(val, decimals = 2) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

module.exports = new OccupancyService();
