const { v4: uuidv4 } = require('uuid');
const Tiger = require('../models/Tiger');
const Alert = require('../models/Alert');
const CameraStation = require('../models/CameraStation');
const MovementRecord = require('../models/MovementRecord');
const { haversineDistance } = require('../utils/geoUtils');
const { THRESHOLDS, ALERT_TYPES, ALERT_SEVERITY, ZONES } = require('../config/constants');

class MovementAnalysisService {
  /**
   * Analyzes movement records from a newly completed run against historical tiger territories.
   */
  async analyzeRunMovement(runId, runRecords = []) {
    console.log(`[MovementAnalysis] Running deviation engine for processing run: ${runId}`);
    const generatedAlerts = [];

    // Group new records by tigerId
    const recordsByTiger = {};
    for (const rec of runRecords) {
      if (!rec.tigerId) continue;
      if (!recordsByTiger[rec.tigerId]) {
        recordsByTiger[rec.tigerId] = [];
      }
      recordsByTiger[rec.tigerId].push(rec);
    }

    for (const [tigerId, newCaptures] of Object.entries(recordsByTiger)) {
      const tiger = await Tiger.findOne({ tigerId });
      if (!tiger) continue;

      // 1. Check for First Capture at Unused Station & Distinguish Survey Effort
      for (const cap of newCaptures) {
        const station = await CameraStation.findOne({ stationId: cap.stationId });
        const isNewStationForTiger = !(tiger.stations || []).includes(cap.stationId);

        if (isNewStationForTiger) {
          // Check if camera was recently installed (within 30 days) to compensate for survey effort
          let isSurveyArtifact = false;
          let daysSinceInstallation = 999;
          
          if (station && station.installationDate) {
            daysSinceInstallation = (new Date() - new Date(station.installationDate)) / (1000 * 60 * 60 * 24);
            if (daysSinceInstallation < 30) {
              isSurveyArtifact = true;
            }
          }

          const alert = await this.createAlert({
            tigerId: tiger.tigerId,
            tigerName: tiger.name,
            type: ALERT_TYPES.FIRST_STATION_CAPTURE,
            severity: isSurveyArtifact ? ALERT_SEVERITY.INFO : ALERT_SEVERITY.WARNING,
            title: `First Capture at Station ${cap.stationId}`,
            description: isSurveyArtifact
              ? `Tiger ${tiger.name} (${tiger.tigerId}) captured at new camera station ${cap.stationId} installed ${Math.round(daysSinceInstallation)} days ago. Flagged as survey effort expansion rather than verified behavioural shift.`
              : `Tiger ${tiger.name} (${tiger.tigerId}) observed at station ${cap.stationId} (${station ? station.name : 'Unknown'}) for the first time.`,
            previousEvidence: {
              historicalStations: tiger.stations,
              totalCaptures: tiger.totalCaptures
            },
            newEvidence: {
              stationId: cap.stationId,
              zone: station ? station.zone : 'CORE',
              timestamp: cap.timestamp,
              daysSinceStationInstalled: Math.round(daysSinceInstallation)
            },
            confidence: Math.min(0.98, Math.max(0.75, round(0.80 + 0.15 * (cap.confidence || 0.9), 2))),
            stationId: cap.stationId,
            latitude: cap.latitude,
            longitude: cap.longitude,
            isSurveyArtifact
          });
          generatedAlerts.push(alert);

          // 2. Check for Village-Adjacent Boundary Incursion (High Priority Warning)
          if (station && station.zone === ZONES.VILLAGE_ADJACENT) {
            const villageDistKm = haversineDistance(
              tiger.activityCentroid?.latitude || cap.latitude,
              tiger.activityCentroid?.longitude || cap.longitude,
              cap.latitude,
              cap.longitude
            );

            const villageAlert = await this.createAlert({
              tigerId: tiger.tigerId,
              tigerName: tiger.name,
              type: ALERT_TYPES.VILLAGE_ADJACENT_RISK,
              severity: ALERT_SEVERITY.CRITICAL,
              title: `Village-Adjacent Incursion Alert: ${station.name}`,
              description: `Tiger ${tiger.name} (${tiger.tigerId}) detected at village-adjacent boundary station ${station.name} (${cap.stationId}). Immediate human-wildlife conflict mitigation alert.`,
              previousEvidence: {
                previousCentroid: tiger.activityCentroid,
                usualStations: tiger.stations
              },
              newEvidence: {
                stationId: cap.stationId,
                villageBorderName: station.name,
                distanceToBufferKm: round(villageDistKm, 2),
                timestamp: cap.timestamp
              },
              confidence: Math.min(0.99, Math.max(0.85, round(0.90 + 0.08 * (cap.confidence || 0.9), 2))),
              stationId: cap.stationId,
              latitude: cap.latitude,
              longitude: cap.longitude,
              isSurveyArtifact: false
            });
            generatedAlerts.push(villageAlert);
          } else if (station && station.zone === ZONES.BUFFER && tiger.stations.every(s => !s.startsWith('PTR-B'))) {
            // 3. Movement into Buffer from Core
            const bufferAlert = await this.createAlert({
              tigerId: tiger.tigerId,
              tigerName: tiger.name,
              type: ALERT_TYPES.BUFFER_ENCROACHMENT,
              severity: ALERT_SEVERITY.WARNING,
              title: `Dispersal Toward Buffer Region: ${station.name}`,
              description: `Core-resident individual ${tiger.name} (${tiger.tigerId}) has crossed into buffer monitoring sector ${station.name} (${cap.stationId}).`,
              previousEvidence: {
                primaryZone: 'CORE',
                coreStations: tiger.stations
              },
              newEvidence: {
                stationId: cap.stationId,
                zone: 'BUFFER',
                timestamp: cap.timestamp
              },
              confidence: Math.min(0.96, Math.max(0.78, round(0.82 + 0.12 * (cap.confidence || 0.9), 2))),
              stationId: cap.stationId,
              latitude: cap.latitude,
              longitude: cap.longitude,
              isSurveyArtifact
            });
            generatedAlerts.push(bufferAlert);
          }
        }
      }

      // 4. Centroid Shift Analysis
      if (tiger.activityCentroid && tiger.activityCentroid.latitude && newCaptures.length >= 2) {
        const newCentroidLat = newCaptures.reduce((s, c) => s + c.latitude, 0) / newCaptures.length;
        const newCentroidLon = newCaptures.reduce((s, c) => s + c.longitude, 0) / newCaptures.length;

        const shiftDistKm = haversineDistance(
          tiger.activityCentroid.latitude,
          tiger.activityCentroid.longitude,
          newCentroidLat,
          newCentroidLon
        );

        // Core shift evaluated on area basis (THRESHOLDS.CORE_CENTROID_SHIFT_KM2 = 17.5 km²)
        // Buffer shift evaluated on linear distance (THRESHOLDS.BUFFER_CENTROID_SHIFT_KM = 5.0 km)
        const isCore = (tiger.stations || []).some(s => s.startsWith('PTR-C'));
        const shiftAreaKm2 = Math.PI * Math.pow(shiftDistKm, 2);
        
        const isShiftTriggered = isCore 
          ? (shiftAreaKm2 >= THRESHOLDS.CORE_CENTROID_SHIFT_KM2)
          : (shiftDistKm >= THRESHOLDS.BUFFER_CENTROID_SHIFT_KM);

        if (isShiftTriggered) {
          const ratio = isCore 
            ? (shiftAreaKm2 / THRESHOLDS.CORE_CENTROID_SHIFT_KM2)
            : (shiftDistKm / THRESHOLDS.BUFFER_CENTROID_SHIFT_KM);
          
          const dynamicConfidence = Math.min(0.99, Math.max(0.70, round(0.75 + 0.15 * Math.min(ratio - 1, 1) + 0.05 * Math.min(newCaptures.length / 5, 1), 2)));

          const centroidAlert = await this.createAlert({
            tigerId: tiger.tigerId,
            tigerName: tiger.name,
            type: ALERT_TYPES.RANGE_CENTROID_SHIFT,
            severity: ratio > 1.5 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
            title: `Territory Centroid Shift of ${shiftDistKm.toFixed(1)} km (${shiftAreaKm2.toFixed(1)} km² area)`,
            description: `Activity centroid for ${tiger.name} (${tiger.tigerId}) shifted by ${shiftDistKm.toFixed(2)} km (${shiftAreaKm2.toFixed(1)} km² area displacement) exceeding the ${isCore ? THRESHOLDS.CORE_CENTROID_SHIFT_KM2 + ' km² core area' : THRESHOLDS.BUFFER_CENTROID_SHIFT_KM + ' km buffer distance'} threshold.`,
            previousEvidence: {
              historicalCentroid: tiger.activityCentroid,
              historicalAreaKm2: tiger.occupiedArea
            },
            newEvidence: {
              runCentroid: { latitude: newCentroidLat, longitude: newCentroidLon },
              shiftDistanceKm: round(shiftDistKm, 2),
              shiftAreaKm2: round(shiftAreaKm2, 2),
              samplePointsCount: newCaptures.length
            },
            confidence: dynamicConfidence,
            stationId: newCaptures[0].stationId,
            latitude: newCentroidLat,
            longitude: newCentroidLon,
            isSurveyArtifact: false
          });
          generatedAlerts.push(centroidAlert);
        }
      }
    }

    // 5. Prolonged Absence Check for All Catalog Tigers
    await this.checkProlongedAbsences(generatedAlerts);

    console.log(`[MovementAnalysis] Completed run analysis. Generated ${generatedAlerts.length} deviation alerts.`);
    return generatedAlerts;
  }

  async checkProlongedAbsences(alertList = []) {
    const tigers = await Tiger.find({ status: 'RESIDENT' });
    const now = new Date();

    for (const tiger of tigers) {
      if (!tiger.lastSeen) continue;
      const daysSinceSeen = (now - new Date(tiger.lastSeen)) / (1000 * 60 * 60 * 24);

      if (daysSinceSeen >= THRESHOLDS.PROLONGED_ABSENCE_DAYS) {
        // Check if alert already exists in last 14 days
        const existing = await Alert.findOne({
          tigerId: tiger.tigerId,
          type: ALERT_TYPES.PROLONGED_ABSENCE,
          timestamp: { $gte: new Date(now - 14 * 24 * 60 * 60 * 1000) }
        });

        if (!existing) {
          const alert = await this.createAlert({
            tigerId: tiger.tigerId,
            tigerName: tiger.name,
            type: ALERT_TYPES.PROLONGED_ABSENCE,
            severity: daysSinceSeen > 90 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
            title: `Prolonged Absence: ${Math.round(daysSinceSeen)} Days`,
            description: `Resident tiger ${tiger.name} (${tiger.tigerId}) has not been captured at any station for ${Math.round(daysSinceSeen)} consecutive days.`,
            previousEvidence: {
              lastSeenDate: tiger.lastSeen,
              lastStation: tiger.stations[tiger.stations.length - 1] || 'Unknown',
              totalCaptures: tiger.totalCaptures
            },
            newEvidence: {
              daysAbsent: Math.round(daysSinceSeen),
              currentStatus: tiger.status
            },
            confidence: 0.95,
            isSurveyArtifact: false
          });
          alertList.push(alert);
        }
      }
    }
  }

  async createAlert(data) {
    const alert = new Alert({
      alertId: `ALT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
      ...data,
      timestamp: new Date()
    });
    await alert.save();
    return alert;
  }
}

function round(val, decimals = 2) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

module.exports = new MovementAnalysisService();
