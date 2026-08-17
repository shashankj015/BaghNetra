const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const { 
  computeCentroid, 
  computeConvexHull, 
  computePolygonAreaKm2, 
  computePolygonIntersection, 
  haversineDistance 
} = require('../utils/geoUtils');

class OccupancyService {
  /**
   * Generates a realistic 3-4 point patrol trail around a primary camera station for realistic home range estimation.
   */
  generateTerritoryWaypoints(stationLat, stationLon, stationId, sex = 'MALE') {
    const lat = stationLat || 21.6842;
    const lon = stationLon || 79.3124;
    const spread = sex === 'FEMALE' ? 0.015 : 0.022; // Tight local territory ~1.5 - 2.4 km

    return [
      { latitude: lat, longitude: lon, stationId: stationId || 'PTR-C-01', confidence: 1.0 },
      { latitude: Number((lat + spread * 0.90).toFixed(4)), longitude: Number((lon + spread * 0.70).toFixed(4)), stationId: stationId || 'PTR-C-01', confidence: 0.96 },
      { latitude: Number((lat - spread * 0.70).toFixed(4)), longitude: Number((lon + spread * 0.80).toFixed(4)), stationId: stationId || 'PTR-C-01', confidence: 0.94 },
      { latitude: Number((lat - spread * 0.80).toFixed(4)), longitude: Number((lon - spread * 0.75).toFixed(4)), stationId: stationId || 'PTR-C-01', confidence: 0.95 },
      { latitude: Number((lat + spread * 0.60).toFixed(4)), longitude: Number((lon - spread * 0.65).toFixed(4)), stationId: stationId || 'PTR-C-01', confidence: 0.97 }
    ];
  }

  /**
   * Seeds realistic historical telemetry with only ONE prominent overlap (TIGER_1 & TIGER_2 Mating Pair)
   * while distributing all other individuals sparsely across distinct reserve sectors.
   */
  async seedDefaultTelemetryIfEmpty(forceReseed = false) {
    const DEFAULT_TELEMETRY = {
      // 🌟 TIGER_1 & TIGER_2: Single Prominent Overlap in Karmajhiri Core (Breeding Pair)
      'TIGER_1': {
        sex: 'FEMALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-C-01', latitude: 21.6842, longitude: 79.3124, daysAgo: 14 },
          { stationId: 'PTR-C-04', latitude: 21.6980, longitude: 79.3280, daysAgo: 10 },
          { stationId: 'PTR-C-01', latitude: 21.6760, longitude: 79.3190, daysAgo: 7 },
          { stationId: 'PTR-C-04', latitude: 21.6920, longitude: 79.3040, daysAgo: 4 },
          { stationId: 'PTR-C-01', latitude: 21.6700, longitude: 79.3280, daysAgo: 1 }
        ]
      },
      'TIGER_2': {
        sex: 'MALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-C-01', latitude: 21.6842, longitude: 79.3124, daysAgo: 18 },
          { stationId: 'PTR-C-04', latitude: 21.6980, longitude: 79.3280, daysAgo: 13 },
          { stationId: 'PTR-C-01', latitude: 21.6890, longitude: 79.3360, daysAgo: 9 },
          { stationId: 'PTR-C-04', latitude: 21.7100, longitude: 79.3200, daysAgo: 5 },
          { stationId: 'PTR-C-01', latitude: 21.6750, longitude: 79.3420, daysAgo: 2 }
        ]
      },
      // 🌲 TIGER_3: Isolated in North-West Gumtara Core (Zero overlap)
      'TIGER_3': {
        sex: 'FEMALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-C-03', latitude: 21.7214, longitude: 79.2890, daysAgo: 16 },
          { stationId: 'PTR-C-03', latitude: 21.7450, longitude: 79.2650, daysAgo: 11 },
          { stationId: 'PTR-C-03', latitude: 21.7380, longitude: 79.2850, daysAgo: 6 },
          { stationId: 'PTR-C-03', latitude: 21.7180, longitude: 79.2550, daysAgo: 2 }
        ]
      },
      // 🏔️ TIGER_4: Isolated in Far North-East Rukhad Buffer (Telemetry silence > 45 days for alert demonstration)
      'TIGER_4': {
        sex: 'MALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-B-01', latitude: 21.7850, longitude: 79.4120, daysAgo: 72 },
          { stationId: 'PTR-B-01', latitude: 21.8050, longitude: 79.4350, daysAgo: 65 },
          { stationId: 'PTR-B-01', latitude: 21.7750, longitude: 79.4400, daysAgo: 58 },
          { stationId: 'PTR-B-01', latitude: 21.7950, longitude: 79.3950, daysAgo: 52 }
        ]
      },
      // 🌊 TIGER_5: Isolated in Southern Turia & Khawasa River Valley (Zero overlap)
      'TIGER_5': {
        sex: 'FEMALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-C-02', latitude: 21.6521, longitude: 79.3451, daysAgo: 14 },
          { stationId: 'PTR-V-01', latitude: 21.5950, longitude: 79.3510, daysAgo: 9 },
          { stationId: 'PTR-C-02', latitude: 21.6150, longitude: 79.3250, daysAgo: 5 },
          { stationId: 'PTR-V-01', latitude: 21.6350, longitude: 79.3650, daysAgo: 1 }
        ]
      },
      // 🌿 TIGER_6: Isolated in Far South-East Jamtara Corridor (Zero overlap)
      'TIGER_6': {
        sex: 'MALE',
        status: 'RESIDENT',
        trail: [
          { stationId: 'PTR-B-02', latitude: 21.6110, longitude: 79.4210, daysAgo: 17 },
          { stationId: 'PTR-B-02', latitude: 21.6250, longitude: 79.4600, daysAgo: 12 },
          { stationId: 'PTR-B-02', latitude: 21.5900, longitude: 79.4450, daysAgo: 7 },
          { stationId: 'PTR-B-02', latitude: 21.6050, longitude: 79.4100, daysAgo: 2 }
        ]
      }
    };

    // If forceReseed or first run, clear old historical patrol records for dataset tigers
    if (forceReseed) {
      await MovementRecord.deleteMany({ runId: 'HISTORICAL_PATROL' });
    }

    const allTigers = await Tiger.find({});
    for (const tiger of allTigers) {
      if (DEFAULT_TELEMETRY[tiger.tigerId]) {
        const config = DEFAULT_TELEMETRY[tiger.tigerId];
        tiger.sex = config.sex || tiger.sex;
        tiger.status = config.status || tiger.status;
        tiger.stations = [...new Set(config.trail.map(t => t.stationId))];
        await tiger.save();

        const waypoints = config.trail.map(t => ({
          stationId: t.stationId,
          latitude: t.latitude,
          longitude: t.longitude,
          timestamp: new Date(Date.now() - t.daysAgo * 86400000),
          confidence: 0.95
        }));

        await MovementRecord.deleteMany({ tigerId: tiger.tigerId });

        for (const wp of waypoints) {
          const rec = new MovementRecord({
            tigerId: tiger.tigerId,
            stationId: wp.stationId,
            zone: wp.stationId.includes('-C-') ? 'CORE' : (wp.stationId.includes('-V-') ? 'VILLAGE_ADJACENT' : 'BUFFER'),
            latitude: wp.latitude,
            longitude: wp.longitude,
            timestamp: wp.timestamp || new Date(),
            confidence: wp.confidence || 1.0,
            runId: 'HISTORICAL_PATROL'
          });
          await rec.save();
        }
      } else {
        const existingRecords = await MovementRecord.countDocuments({ tigerId: tiger.tigerId });
        if (existingRecords === 0 || forceReseed) {
          const lat = tiger.activityCentroid?.latitude || 21.6842;
          const lon = tiger.activityCentroid?.longitude || 79.3124;
          const st = tiger.stations?.[0] || 'PTR-C-01';
          const points = this.generateTerritoryWaypoints(lat, lon, st, tiger.sex);
          const waypoints = points.map((p, idx) => ({
            stationId: p.stationId,
            latitude: p.latitude,
            longitude: p.longitude,
            timestamp: new Date(Date.now() - (idx * 2 + 1) * 86400000),
            confidence: p.confidence
          }));

          await MovementRecord.deleteMany({ tigerId: tiger.tigerId });

          for (const wp of waypoints) {
            const rec = new MovementRecord({
              tigerId: tiger.tigerId,
              stationId: wp.stationId,
              zone: wp.stationId.includes('-C-') ? 'CORE' : (wp.stationId.includes('-V-') ? 'VILLAGE_ADJACENT' : 'BUFFER'),
              latitude: wp.latitude,
              longitude: wp.longitude,
              timestamp: wp.timestamp || new Date(),
              confidence: wp.confidence || 1.0,
              runId: 'HISTORICAL_PATROL'
            });
            await rec.save();
          }
        }
      }

      // Recalculate occupancy & polygon
      await this.regenerateTigerOccupancy(tiger.tigerId);
    }
  }



  /**
   * Regenerates area occupancy, centroid, convex hull home range, and area (km²) for a tiger.
   */
  async regenerateTigerOccupancy(tigerId) {
    const tiger = await Tiger.findOne({ tigerId });
    if (!tiger) return null;

    // Fetch all movement records for this tiger
    const records = await MovementRecord.find({ tigerId }).sort({ timestamp: 1 });
    if (records.length === 0) {
      // If 0 movement records, generate baseline waypoints from current centroid/station
      const lat = tiger.activityCentroid?.latitude || 21.6842;
      const lon = tiger.activityCentroid?.longitude || 79.3124;
      const st = tiger.stations?.[0] || 'PTR-C-01';
      const points = this.generateTerritoryWaypoints(lat, lon, st, tiger.sex);
      
      for (const p of points) {
        const rec = new MovementRecord({
          tigerId: tiger.tigerId,
          stationId: p.stationId,
          zone: p.stationId.includes('-C-') ? 'CORE' : (p.stationId.includes('-V-') ? 'VILLAGE_ADJACENT' : 'BUFFER'),
          latitude: p.latitude,
          longitude: p.longitude,
          timestamp: new Date(),
          confidence: p.confidence,
          runId: 'ENROLLMENT'
        });
        await rec.save();
      }
      return this.regenerateTigerOccupancy(tigerId);
    }

    const points = records.map(r => ({
      latitude: r.latitude,
      longitude: r.longitude,
      stationId: r.stationId,
      timestamp: r.timestamp,
      confidence: r.confidence,
      imageId: r.imageId ? r.imageId.toString() : null
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
    tiger.locationHistory = points;

    await tiger.save();
    return tiger;
  }

  /**
   * Calculates territorial overlap between all resident tigers.
   * Computes geometric polygon intersection, overlap area (km²), and management signals.
   */
  async calculateTerritorialOverlaps() {
    const tigers = await Tiger.find({ status: { $ne: 'DECEASED' } });
    const overlaps = [];

    for (let i = 0; i < tigers.length; i++) {
      for (let j = i + 1; j < tigers.length; j++) {
        const t1 = tigers[i];
        const t2 = tigers[j];

        const t1Poly = t1.homeRange?.coordinates?.[0];
        const t2Poly = t2.homeRange?.coordinates?.[0];

        let intersectionCoords = null;
        let overlapAreaKm2 = 0;

        if (t1Poly && t1Poly.length >= 3 && t2Poly && t2Poly.length >= 3) {
          intersectionCoords = computePolygonIntersection(t1Poly, t2Poly);
          if (intersectionCoords) {
            overlapAreaKm2 = round(computePolygonAreaKm2(intersectionCoords), 2);
          }
        }

        // Check station overlap
        const sharedStations = (t1.stations || []).filter(s => (t2.stations || []).includes(s));
        
        // Calculate centroid distance
        const centroidDist = haversineDistance(
          t1.activityCentroid?.latitude || 21.684,
          t1.activityCentroid?.longitude || 79.325,
          t2.activityCentroid?.latitude || 21.684,
          t2.activityCentroid?.longitude || 79.325
        );

        // Only include true active geometric overlaps
        if (overlapAreaKm2 > 0) {
          let interactionType = 'TERRITORIAL_OVERLAP';
          let managementSignal = 'MONITOR';

          if (t1.sex === 'MALE' && t2.sex === 'FEMALE' || t1.sex === 'FEMALE' && t2.sex === 'MALE') {
            interactionType = 'MATING_PAIR_OVERLAP';
            managementSignal = 'BREEDING_MONITORING';
          } else if (t1.sex === 'MALE' && t2.sex === 'MALE') {
            interactionType = 'HIGH_CONFLICT_RISK';
            managementSignal = 'TERRITORIAL_FIGHT_RISK';
          } else if (t1.sex === 'FEMALE' && t2.sex === 'FEMALE') {
            interactionType = 'RESOURCE_COMPETITION';
            managementSignal = 'PREY_BASE_PRESSURE';
          }

          const t1OverlapPct = t1.occupiedArea > 0 ? round((overlapAreaKm2 / t1.occupiedArea) * 100, 1) : 0;
          const t2OverlapPct = t2.occupiedArea > 0 ? round((overlapAreaKm2 / t2.occupiedArea) * 100, 1) : 0;

          overlaps.push({
            tiger1: { 
              tigerId: t1.tigerId, 
              name: t1.name, 
              sex: t1.sex, 
              occupiedArea: t1.occupiedArea,
              overlapPercentage: t1OverlapPct 
            },
            tiger2: { 
              tigerId: t2.tigerId, 
              name: t2.name, 
              sex: t2.sex, 
              occupiedArea: t2.occupiedArea,
              overlapPercentage: t2OverlapPct 
            },
            sharedStations,
            centroidDistanceKm: round(centroidDist, 2),
            overlapAreaKm2,
            intersectionPolygon: intersectionCoords ? {
              type: 'Polygon',
              coordinates: [intersectionCoords]
            } : null,
            interactionType,
            managementSignal
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Generates a spatial intelligence dossier for a completed processing run.
   */
  async generateRunSpatialDossier(runId) {
    const runRecords = await MovementRecord.find({ runId }).sort({ timestamp: 1 });
    const uniqueTigerIds = [...new Set(runRecords.map(r => r.tigerId).filter(Boolean))];

    const individuals = [];
    for (const tigerId of uniqueTigerIds) {
      // Regenerate occupancy to ensure fresh metrics
      const tiger = await this.regenerateTigerOccupancy(tigerId);
      if (!tiger) continue;

      const tigerRunRecords = runRecords.filter(r => r.tigerId === tigerId);
      const runStations = [...new Set(tigerRunRecords.map(r => r.stationId))];
      const captureLocations = tigerRunRecords.map(r => ({
        stationId: r.stationId,
        latitude: r.latitude,
        longitude: r.longitude,
        zone: r.zone,
        timestamp: r.timestamp,
        confidence: r.confidence,
        imageId: r.imageId
      }));

      individuals.push({
        tigerId: tiger.tigerId,
        name: tiger.name,
        sex: tiger.sex,
        status: tiger.status,
        representativeImage: tiger.representativeImage,
        capturesInRun: tigerRunRecords.length,
        totalHistoricalCaptures: tiger.totalCaptures,
        runStations,
        historicalStations: tiger.stations,
        captureLocations,
        activityCentroid: tiger.activityCentroid,
        homeRange: tiger.homeRange,
        occupiedAreaKm2: tiger.occupiedArea,
        firstSeen: tiger.firstSeen,
        lastSeen: tiger.lastSeen
      });
    }

    // Calculate all reserve overlaps and isolate ones involving tigers in this run
    const allOverlaps = await this.calculateTerritorialOverlaps();
    const runOverlaps = allOverlaps.filter(ov => 
      uniqueTigerIds.includes(ov.tiger1.tigerId) || uniqueTigerIds.includes(ov.tiger2.tigerId)
    );

    return {
      runId,
      generatedAt: new Date(),
      totalImagesCaptured: runRecords.length,
      individualCount: individuals.length,
      individuals,
      overlaps: runOverlaps,
      allReserveOverlapsCount: allOverlaps.length
    };
  }
}

function round(val, decimals = 2) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

module.exports = new OccupancyService();

