const { v4: uuidv4 } = require('uuid');
const Alert = require('../models/Alert');
const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const CameraStation = require('../models/CameraStation');
const occupancyService = require('./occupancyService');
const { haversineDistance } = require('../utils/geoUtils');
const { THRESHOLDS, ALERT_TYPES, ALERT_LABELS, ALERT_STATUS, ALERT_SEVERITY, PENCH_VILLAGES } = require('../config/constants');

class AlertService {
  /**
   * Evaluates all 3 dynamic conditions against database state:
   * 1. Tiger Near Village / Residential Area (<= 2 km) [Human-Wildlife Conflict Risk]
   * 2. Overlapping Tiger Occupancy Areas [Tiger Territory Overlap]
   * 3. No Camera Detection for ~45 Days (Configurable) [No Recent Camera Detection]
   */
  async evaluateAllAlerts() {
    try {
      const allTigers = await Tiger.find({ status: { $ne: 'DECEASED' } });
      const stations = await CameraStation.find({});
      const stationMap = new Map(stations.map(s => [s.stationId, s]));

      // -------------------------------------------------------------
      // 1. Condition 1: Tiger Near Village / Residential Area (<= 2 km)
      // -------------------------------------------------------------
      const villageThresholdKm = THRESHOLDS.VILLAGE_ALERT_KM || 2.0;

      for (const tiger of allTigers) {
        // Get the tiger's latest recorded location
        let latestLat = null;
        let latestLon = null;
        let latestTime = tiger.lastSeen || new Date();
        let latestStation = tiger.stations?.[tiger.stations.length - 1] || 'PTR-V-01';

        const lastRecord = await MovementRecord.findOne({ tigerId: tiger.tigerId }).sort({ timestamp: -1 });
        if (lastRecord) {
          latestLat = lastRecord.latitude;
          latestLon = lastRecord.longitude;
          latestTime = lastRecord.timestamp;
          latestStation = lastRecord.stationId;
        } else if (tiger.activityCentroid?.latitude) {
          latestLat = tiger.activityCentroid.latitude;
          latestLon = tiger.activityCentroid.longitude;
        }

        if (latestLat == null || latestLon == null) continue;

        // Calculate distance from latest position to every registered village
        let closestVillage = null;
        let minDistanceKm = Infinity;

        for (const vil of PENCH_VILLAGES) {
          const dist = haversineDistance(latestLat, latestLon, vil.latitude, vil.longitude);
          if (dist < minDistanceKm) {
            minDistanceKm = dist;
            closestVillage = vil;
          }
        }

        // If distance <= 2.0 km, generate / sync Human-Wildlife Conflict Alert
        if (closestVillage && minDistanceKm <= villageThresholdKm) {
          const fingerprint = `VILLAGE_${tiger.tigerId}_${closestVillage.id}`;
          const isCritical = minDistanceKm <= 1.2;
          const severity = isCritical ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING;
          const roundedDist = round(minDistanceKm, 2);

          const existingAlert = await Alert.findOne({ fingerprint });

          if (!existingAlert) {
            const alertId = `ALT-VIL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            const newAlert = new Alert({
              alertId,
              fingerprint,
              tigerId: tiger.tigerId,
              tigerName: tiger.name,
              type: ALERT_TYPES.VILLAGE_ADJACENT_RISK,
              categoryLabel: ALERT_LABELS.VILLAGE_ADJACENT_RISK,
              status: ALERT_STATUS.ACTIVE,
              severity,
              title: `Human-Wildlife Conflict Risk: ${tiger.name} Near ${closestVillage.name}`,
              description: `Tiger ${tiger.name} (${tiger.tigerId}) detected at ${latestStation} within ${roundedDist} km of ${closestVillage.name} (${closestVillage.type.replace('_', ' ')}). Immediate community buffer protocol activated.`,
              locationName: `${closestVillage.name} (${roundedDist} km)`,
              villageName: closestVillage.name,
              distanceKm: roundedDist,
              stationId: latestStation,
              latitude: latestLat,
              longitude: latestLon,
              targetCoordinates: {
                latitude: closestVillage.latitude,
                longitude: closestVillage.longitude
              },
              detectionTime: latestTime,
              confidence: 0.98,
              newEvidence: {
                nearestVillage: closestVillage.name,
                distanceKm: roundedDist,
                stationId: latestStation,
                coordinates: { latitude: latestLat, longitude: latestLon }
              },
              timestamp: latestTime || new Date()
            });
            await newAlert.save();
          } else {
            // Update details without resetting user review / resolved status
            existingAlert.distanceKm = roundedDist;
            existingAlert.latitude = latestLat;
            existingAlert.longitude = latestLon;
            existingAlert.stationId = latestStation;
            existingAlert.detectionTime = latestTime;
            existingAlert.severity = severity;
            await existingAlert.save();
          }
        }
      }

      // -------------------------------------------------------------
      // 2. Condition 2: Overlapping Tiger Occupancy Areas
      // -------------------------------------------------------------
      const overlaps = await occupancyService.calculateTerritorialOverlaps();

      for (const ov of overlaps) {
        if (ov.overlapAreaKm2 > 0) {
          const t1Id = ov.tiger1.tigerId;
          const t2Id = ov.tiger2.tigerId;
          const pairKey = [t1Id, t2Id].sort().join('_');
          const fingerprint = `OVERLAP_${pairKey}`;

          const existingAlert = await Alert.findOne({ fingerprint });
          const severity = ov.interactionType === 'HIGH_CONFLICT_RISK' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING;
          const sectorName = ov.sharedStations?.length > 0 
            ? `Stations: ${ov.sharedStations.join(', ')}` 
            : 'Karmajhiri Core Crossing';

          if (!existingAlert) {
            const alertId = `ALT-OVL-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            const newAlert = new Alert({
              alertId,
              fingerprint,
              tigerId: `${t1Id} / ${t2Id}`,
              tigerName: `${ov.tiger1.name} & ${ov.tiger2.name}`,
              secondaryTigerId: t2Id,
              secondaryTigerName: ov.tiger2.name,
              type: ALERT_TYPES.TERRITORY_OVERLAP,
              categoryLabel: ALERT_LABELS.TERRITORY_OVERLAP,
              status: ALERT_STATUS.ACTIVE,
              severity,
              title: `Tiger Territory Overlap: ${ov.tiger1.name} & ${ov.tiger2.name} (${ov.overlapAreaKm2.toFixed(2)} km²)`,
              description: `Geometric spatial analysis detected an active ${ov.overlapAreaKm2.toFixed(2)} km² home-range overlap between ${ov.tiger1.name} (${t1Id}) and ${ov.tiger2.name} (${t2Id}) in ${sectorName}. Signal: ${ov.managementSignal || 'MONITOR'}.`,
              locationName: sectorName,
              overlapAreaKm2: ov.overlapAreaKm2,
              stationId: ov.sharedStations?.[0] || 'PTR-C-01',
              latitude: ov.intersectionPolygon?.coordinates?.[0]?.[0]?.[1] || 21.6842,
              longitude: ov.intersectionPolygon?.coordinates?.[0]?.[0]?.[0] || 79.3124,
              detectionTime: new Date(),
              confidence: 0.95,
              newEvidence: {
                tiger1: ov.tiger1,
                tiger2: ov.tiger2,
                overlapAreaKm2: ov.overlapAreaKm2,
                sharedStations: ov.sharedStations,
                centroidDistanceKm: ov.centroidDistanceKm
              },
              timestamp: new Date()
            });
            await newAlert.save();
          } else {
            existingAlert.overlapAreaKm2 = ov.overlapAreaKm2;
            existingAlert.severity = severity;
            await existingAlert.save();
          }
        }
      }

      // -------------------------------------------------------------
      // 3. Condition 3: No Camera Detection for ~45 Days (Configurable)
      // -------------------------------------------------------------
      const prolongedDaysThreshold = THRESHOLDS.PROLONGED_ABSENCE_DAYS || 45;
      const nowMs = Date.now();

      for (const tiger of allTigers) {
        if (!tiger.lastSeen) continue;
        const daysAbsent = (nowMs - new Date(tiger.lastSeen).getTime()) / (1000 * 60 * 60 * 24);

        if (daysAbsent >= prolongedDaysThreshold) {
          const fingerprint = `ABSENCE_${tiger.tigerId}`;
          const roundedDays = Math.floor(daysAbsent);
          const isExtreme = roundedDays >= 75;
          const severity = isExtreme ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING;

          const existingAlert = await Alert.findOne({ fingerprint });
          const lastStation = tiger.stations?.[tiger.stations.length - 1] || 'PTR-B-01';

          if (!existingAlert) {
            const alertId = `ALT-ABS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            const newAlert = new Alert({
              alertId,
              fingerprint,
              tigerId: tiger.tigerId,
              tigerName: tiger.name,
              type: ALERT_TYPES.PROLONGED_ABSENCE,
              categoryLabel: ALERT_LABELS.PROLONGED_ABSENCE,
              status: ALERT_STATUS.ACTIVE,
              severity,
              title: `No Recent Camera Detection: ${tiger.name} (${roundedDays} Days)`,
              description: `Resident tiger ${tiger.name} (${tiger.tigerId}) has not been captured by any active Pench camera trap for ${roundedDays} consecutive days (configured monitoring threshold: ${prolongedDaysThreshold} days). Last confirmed capture at ${lastStation}.`,
              locationName: `Last Station: ${lastStation}`,
              daysAbsent: roundedDays,
              lastSeenDate: tiger.lastSeen,
              stationId: lastStation,
              latitude: tiger.activityCentroid?.latitude || 21.7850,
              longitude: tiger.activityCentroid?.longitude || 79.4120,
              detectionTime: tiger.lastSeen,
              confidence: 0.96,
              newEvidence: {
                daysAbsent: roundedDays,
                thresholdDays: prolongedDaysThreshold,
                lastSeenDate: tiger.lastSeen,
                lastStation
              },
              timestamp: new Date()
            });
            await newAlert.save();
          } else {
            existingAlert.daysAbsent = roundedDays;
            existingAlert.lastSeenDate = tiger.lastSeen;
            existingAlert.severity = severity;
            await existingAlert.save();
          }
        }
      }

      console.log('[AlertService] Successfully synchronized all dynamic alerts.');
    } catch (err) {
      console.error('[AlertService] Error evaluating dynamic alerts:', err);
    }
  }

  /**
   * Updates an alert status with proper audit timestamps and lifecycle tracking.
   * Status lifecycle: ACTIVE -> REVIEWED -> RESOLVED
   */
  async updateAlertStatus(alertId, newStatus, user = null) {
    const validStatuses = Object.values(ALERT_STATUS);
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const alert = await Alert.findOne({ alertId });
    if (!alert) {
      throw new Error(`Alert not found for ID '${alertId}'`);
    }

    const userName = user?.name || user?.username || 'Authorized Officer';
    alert.status = newStatus;

    if (newStatus === ALERT_STATUS.REVIEWED) {
      alert.reviewedAt = new Date();
      alert.reviewedBy = userName;
      alert.acknowledged = true;
      alert.acknowledgedBy = userName;
      alert.acknowledgedAt = alert.reviewedAt;
    } else if (newStatus === ALERT_STATUS.RESOLVED) {
      alert.resolvedAt = new Date();
      alert.resolvedBy = userName;
      alert.acknowledged = true;
      if (!alert.reviewedAt) {
        alert.reviewedAt = alert.resolvedAt;
        alert.reviewedBy = userName;
      }
    } else if (newStatus === ALERT_STATUS.ACTIVE) {
      alert.reviewedAt = null;
      alert.reviewedBy = null;
      alert.resolvedAt = null;
      alert.resolvedBy = null;
      alert.acknowledged = false;
      alert.acknowledgedBy = null;
      alert.acknowledgedAt = null;
    }

    await alert.save();
    return alert;
  }

  /**
   * Retrieves full statistical metrics breakdown for dashboard header.
   */
  async getAlertStats() {
    // Run evaluation to ensure up-to-date stats
    await this.evaluateAllAlerts();

    const [
      total,
      active,
      reviewed,
      resolved,
      critical,
      warning,
      info,
      conflictRisk,
      overlap,
      noDetection
    ] = await Promise.all([
      Alert.countDocuments({}),
      Alert.countDocuments({ status: ALERT_STATUS.ACTIVE }),
      Alert.countDocuments({ status: ALERT_STATUS.REVIEWED }),
      Alert.countDocuments({ status: ALERT_STATUS.RESOLVED }),
      Alert.countDocuments({ severity: ALERT_SEVERITY.CRITICAL, status: { $ne: ALERT_STATUS.RESOLVED } }),
      Alert.countDocuments({ severity: ALERT_SEVERITY.WARNING, status: { $ne: ALERT_STATUS.RESOLVED } }),
      Alert.countDocuments({ severity: ALERT_SEVERITY.INFO, status: { $ne: ALERT_STATUS.RESOLVED } }),
      Alert.countDocuments({ type: ALERT_TYPES.VILLAGE_ADJACENT_RISK }),
      Alert.countDocuments({ type: ALERT_TYPES.TERRITORY_OVERLAP }),
      Alert.countDocuments({ type: ALERT_TYPES.PROLONGED_ABSENCE })
    ]);

    return {
      totalAlerts: total,
      activeAlerts: active,
      reviewedAlerts: reviewed,
      resolvedAlerts: resolved,
      critical,
      warning,
      info,
      humanWildlifeConflictCount: conflictRisk,
      territoryOverlapCount: overlap,
      noCameraDetectionCount: noDetection
    };
  }
}

function round(val, decimals = 2) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

module.exports = new AlertService();
