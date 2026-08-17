const Tiger = require('../models/Tiger');
const CameraStation = require('../models/CameraStation');
const MovementRecord = require('../models/MovementRecord');
const ProcessingRun = require('../models/ProcessingRun');
const occupancyService = require('../services/occupancyService');

const TIGER_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

/**
 * Export complete Tiger Reserve Spatial FeatureCollection in GeoJSON format.
 * Usable directly in QGIS, ArcGIS, and Google Earth Pro.
 */
exports.exportReserveGeoJSON = async (req, res) => {
  try {
    const [tigers, stations, overlaps, movementRecords] = await Promise.all([
      Tiger.find({ status: { $ne: 'DECEASED' } }),
      CameraStation.find({}),
      occupancyService.calculateTerritorialOverlaps(),
      MovementRecord.find({}).sort({ timestamp: -1 }).limit(1000)
    ]);

    const features = [];

    // 1. Home Range Polygons
    tigers.forEach((tiger, idx) => {
      const color = TIGER_COLORS[idx % TIGER_COLORS.length];
      if (tiger.homeRange && tiger.homeRange.coordinates && tiger.homeRange.coordinates[0]?.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: tiger.homeRange,
          properties: {
            layerType: 'HOME_RANGE',
            tigerId: tiger.tigerId,
            name: tiger.name,
            sex: tiger.sex,
            status: tiger.status,
            occupiedAreaKm2: tiger.occupiedArea,
            totalCaptures: tiger.totalCaptures,
            stationsVisited: (tiger.stations || []).join(', '),
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.25
          }
        });
      }

      // 2. Activity Centroids
      if (tiger.activityCentroid?.latitude && tiger.activityCentroid?.longitude) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [tiger.activityCentroid.longitude, tiger.activityCentroid.latitude]
          },
          properties: {
            layerType: 'ACTIVITY_CENTROID',
            tigerId: tiger.tigerId,
            name: tiger.name,
            sex: tiger.sex,
            latitude: tiger.activityCentroid.latitude,
            longitude: tiger.activityCentroid.longitude,
            markerColor: color
          }
        });
      }
    });

    // 3. Territorial Overlap Conflict Zones
    overlaps.forEach((ov, idx) => {
      if (ov.intersectionPolygon && ov.intersectionPolygon.coordinates?.[0]?.length >= 3) {
        const isConflict = ov.interactionType === 'HIGH_CONFLICT_RISK' || ov.interactionType === 'RESOURCE_COMPETITION';
        const color = isConflict ? '#ef4444' : '#ec4899';

        features.push({
          type: 'Feature',
          geometry: ov.intersectionPolygon,
          properties: {
            layerType: 'TERRITORIAL_OVERLAP',
            tiger1Id: ov.tiger1.tigerId,
            tiger1Name: ov.tiger1.name,
            tiger2Id: ov.tiger2.tigerId,
            tiger2Name: ov.tiger2.name,
            overlapAreaKm2: ov.overlapAreaKm2,
            tiger1OverlapPct: ov.tiger1.overlapPercentage,
            tiger2OverlapPct: ov.tiger2.overlapPercentage,
            interactionType: ov.interactionType,
            managementSignal: ov.managementSignal,
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.45
          }
        });
      }
    });

    // 4. Camera Trap Stations
    stations.forEach(st => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [st.longitude, st.latitude]
        },
        properties: {
          layerType: 'CAMERA_STATION',
          stationId: st.stationId,
          name: st.name,
          zone: st.zone,
          status: st.status
        }
      });
    });

    // 5. Recent Sightings
    movementRecords.forEach(rec => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [rec.longitude, rec.latitude]
        },
        properties: {
          layerType: 'CAPTURE_SIGHTING',
          tigerId: rec.tigerId,
          stationId: rec.stationId,
          zone: rec.zone,
          timestamp: rec.timestamp,
          confidence: rec.confidence,
          runId: rec.runId
        }
      });
    });

    const geoJson = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
      },
      metadata: {
        title: 'Pench Tiger Reserve - Individual Home Range & Territorial Overlap Intelligence',
        generatedAt: new Date().toISOString(),
        totalTigers: tigers.length,
        totalOverlaps: overlaps.length,
        totalStations: stations.length,
        totalCaptures: movementRecords.length
      },
      features
    };

    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename=Pench_Tiger_Territory_Intelligence_${Date.now()}.geojson`);
    res.json(geoJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Export NTCA (National Tiger Conservation Authority) Standard CSV.
 */
exports.exportNTCA_CSV = async (req, res) => {
  try {
    const [tigers, overlaps] = await Promise.all([
      Tiger.find({ status: { $ne: 'DECEASED' } }).sort({ totalCaptures: -1 }),
      occupancyService.calculateTerritorialOverlaps()
    ]);

    const header = [
      'Tiger_ID',
      'Name',
      'Sex',
      'Status',
      'Total_Captures',
      'First_Seen',
      'Last_Seen',
      'Stations_Visited',
      'Centroid_Latitude',
      'Centroid_Longitude',
      'Occupied_Area_SqKm',
      'Overlapping_Individuals',
      'Management_Signal'
    ];

    const rows = tigers.map(t => {
      // Find all overlapping tigers for this individual
      const relatedOverlaps = overlaps.filter(ov => ov.tiger1.tigerId === t.tigerId || ov.tiger2.tigerId === t.tigerId);
      const overlappingNames = relatedOverlaps.map(ov => {
        const other = ov.tiger1.tigerId === t.tigerId ? ov.tiger2 : ov.tiger1;
        return `${other.tigerId}(${ov.overlapAreaKm2}km²)`;
      }).join('; ') || 'None';

      const signals = [...new Set(relatedOverlaps.map(ov => ov.managementSignal))].join('; ') || 'STABLE';

      return [
        t.tigerId,
        `"${(t.name || '').replace(/"/g, '""')}"`,
        t.sex || 'UNKNOWN',
        t.status || 'RESIDENT',
        t.totalCaptures || 0,
        t.firstSeen ? new Date(t.firstSeen).toISOString().split('T')[0] : 'N/A',
        t.lastSeen ? new Date(t.lastSeen).toISOString().split('T')[0] : 'N/A',
        `"${(t.stations || []).join(', ')}"`,
        t.activityCentroid?.latitude ? t.activityCentroid.latitude.toFixed(6) : '',
        t.activityCentroid?.longitude ? t.activityCentroid.longitude.toFixed(6) : '',
        t.occupiedArea || 0,
        `"${overlappingNames}"`,
        `"${signals}"`
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=NTCA_Tiger_Territory_Report_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Export Run-Specific GeoJSON FeatureCollection.
 */
exports.exportRunGeoJSON = async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ProcessingRun.findOne({ runId });
    if (!run) {
      return res.status(404).json({ error: 'Processing run not found' });
    }

    const dossier = run.spatialSummary || await occupancyService.generateRunSpatialDossier(runId);
    const features = [];

    // Individual Ranges & Centroids
    (dossier.individuals || []).forEach((ind, idx) => {
      const color = TIGER_COLORS[idx % TIGER_COLORS.length];

      // Home range polygon
      if (ind.homeRange && ind.homeRange.coordinates && ind.homeRange.coordinates[0]?.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: ind.homeRange,
          properties: {
            layerType: 'HOME_RANGE',
            tigerId: ind.tigerId,
            name: ind.name,
            sex: ind.sex,
            occupiedAreaKm2: ind.occupiedAreaKm2,
            capturesInRun: ind.capturesInRun,
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.3
          }
        });
      }

      // Centroid
      if (ind.activityCentroid?.latitude && ind.activityCentroid?.longitude) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [ind.activityCentroid.longitude, ind.activityCentroid.latitude]
          },
          properties: {
            layerType: 'ACTIVITY_CENTROID',
            tigerId: ind.tigerId,
            name: ind.name,
            latitude: ind.activityCentroid.latitude,
            longitude: ind.activityCentroid.longitude,
            markerColor: color
          }
        });
      }

      // Captures in this run
      (ind.captureLocations || []).forEach(cap => {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [cap.longitude, cap.latitude]
          },
          properties: {
            layerType: 'RUN_CAPTURE',
            tigerId: ind.tigerId,
            stationId: cap.stationId,
            zone: cap.zone,
            timestamp: cap.timestamp,
            confidence: cap.confidence
          }
        });
      });
    });

    // Overlaps in this run
    (dossier.overlaps || []).forEach(ov => {
      if (ov.intersectionPolygon && ov.intersectionPolygon.coordinates?.[0]?.length >= 3) {
        const isConflict = ov.interactionType === 'HIGH_CONFLICT_RISK' || ov.interactionType === 'RESOURCE_COMPETITION';
        const color = isConflict ? '#ef4444' : '#ec4899';

        features.push({
          type: 'Feature',
          geometry: ov.intersectionPolygon,
          properties: {
            layerType: 'TERRITORIAL_OVERLAP',
            tiger1Id: ov.tiger1.tigerId,
            tiger2Id: ov.tiger2.tigerId,
            overlapAreaKm2: ov.overlapAreaKm2,
            interactionType: ov.interactionType,
            managementSignal: ov.managementSignal,
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.5
          }
        });
      }
    });

    const geoJson = {
      type: 'FeatureCollection',
      metadata: {
        runId,
        generatedAt: dossier.generatedAt || new Date().toISOString(),
        totalIndividualsDetected: dossier.individualCount || 0
      },
      features
    };

    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename=Run_${runId}_Spatial_Dossier.geojson`);
    res.json(geoJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Export Run-Specific CSV.
 */
exports.exportRunCSV = async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ProcessingRun.findOne({ runId });
    if (!run) {
      return res.status(404).json({ error: 'Processing run not found' });
    }

    const dossier = run.spatialSummary || await occupancyService.generateRunSpatialDossier(runId);

    const header = [
      'Run_ID',
      'Tiger_ID',
      'Name',
      'Sex',
      'Captures_In_This_Run',
      'Stations_In_This_Run',
      'Centroid_Latitude',
      'Centroid_Longitude',
      'Updated_Occupied_Area_SqKm',
      'Active_Overlaps',
      'Signals'
    ];

    const rows = (dossier.individuals || []).map(ind => {
      const relatedOverlaps = (dossier.overlaps || []).filter(ov => 
        ov.tiger1.tigerId === ind.tigerId || ov.tiger2.tigerId === ind.tigerId
      );
      const overlappingNames = relatedOverlaps.map(ov => {
        const other = ov.tiger1.tigerId === ind.tigerId ? ov.tiger2 : ov.tiger1;
        return `${other.tigerId}(${ov.overlapAreaKm2}km²)`;
      }).join('; ') || 'None';

      const signals = [...new Set(relatedOverlaps.map(ov => ov.managementSignal))].join('; ') || 'NORMAL';

      return [
        runId,
        ind.tigerId,
        `"${(ind.name || '').replace(/"/g, '""')}"`,
        ind.sex || 'UNKNOWN',
        ind.capturesInRun || 0,
        `"${(ind.runStations || []).join(', ')}"`,
        ind.activityCentroid?.latitude ? ind.activityCentroid.latitude.toFixed(6) : '',
        ind.activityCentroid?.longitude ? ind.activityCentroid.longitude.toFixed(6) : '',
        ind.occupiedAreaKm2 || 0,
        `"${overlappingNames}"`,
        `"${signals}"`
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Run_${runId}_Spatial_Summary.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
