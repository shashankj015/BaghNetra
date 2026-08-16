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
            confidence: 0.92,
            stationId: cap.stationId,
            latitude: cap.latitude,
            longitude: cap.longitude,
            isSurveyArtifact
          });
          generatedAlerts.push(alert);

          // 2. Check for Village-Adjacent Boundary Incursion (High Priority Warning)
          if (station && station.zone === ZONES.VILLAGE_ADJACENT) {
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
                distanceToBufferKm: 1.2,
                timestamp: cap.timestamp
              },
              confidence: 0.95,
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
              confidence: 0.89,
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

        // Core shift threshold is ~4.5 km linear (~16-20 km² area equivalent)
        const isCore = tiger.stations.some(s => s.startsWith('PTR-C'));
        const thresholdKm = isCore ? 4.2 : 3.0;

        if (shiftDistKm > thresholdKm) {
          const centroidAlert = await this.createAlert({
            tigerId: tiger.tigerId,
            tigerName: tiger.name,
            type: ALERT_TYPES.RANGE_CENTROID_SHIFT,
            severity: ALERT_SEVERITY.WARNING,
            title: `Territory Centroid Shift of ${shiftDistKm.toFixed(1)} km`,
            description: `Activity centroid for ${tiger.name} (${tiger.tigerId}) shifted by ${shiftDistKm.toFixed(2)} km compared to historical territory.`,
            previousEvidence: {
              historicalCentroid: tiger.activityCentroid,
              historicalAreaKm2: tiger.occupiedArea
            },
            newEvidence: {
              runCentroid: { latitude: newCentroidLat, longitude: newCentroidLon },
              shiftDistanceKm: round(shiftDistKm, 2),
              samplePointsCount: newCaptures.length
            },
            confidence: 0.88,
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
