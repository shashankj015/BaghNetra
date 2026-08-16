const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Image = require('../models/Image');
const CameraStation = require('../models/CameraStation');
const ProcessingRun = require('../models/ProcessingRun');
const MovementRecord = require('../models/MovementRecord');
const aiClient = require('./aiServiceClient');
const quarantineService = require('./quarantineService');
const movementService = require('./movementAnalysisService');
const occupancyService = require('./occupancyService');

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];

class BatchIngestService {
  constructor() {
    this.activeJobs = new Map(); // runId -> { progress, isCancelled }
  }

  /**
   * Scans a directory recursively to collect valid camera trap image file paths.
   */
  scanDirectory(dirPath) {
    let results = [];
    if (!fs.existsSync(dirPath)) return results;

    const list = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        results = results.concat(this.scanDirectory(fullPath));
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (VALID_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }

  /**
   * Starts an asynchronous batch processing run on a camera trap SD card folder.
   */
  async startBatchRun(folderPath, defaultStationId = 'PTR-C-01', options = {}) {
    const filePaths = this.scanDirectory(folderPath);
    if (filePaths.length === 0) {
      throw new Error(`No valid image files found in folder: ${folderPath}`);
    }

    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    const runDoc = new ProcessingRun({
      runId,
      folderPath,
      stationId: defaultStationId,
      status: 'PROCESSING',
      totalImages: filePaths.length,
      processedImages: 0,
      startedAt: new Date()
    });
    await runDoc.save();

    this.activeJobs.set(runId, {
      total: filePaths.length,
      processed: 0,
      isCancelled: false
    });

    // Run processing in background worker
    this._executeRunAsync(runDoc, filePaths, defaultStationId, options).catch(err => {
      console.error(`[BatchIngest] Run ${runId} encountered fatal error: ${err.message}`);
    });

    return {
      runId,
      totalImages: filePaths.length,
      status: 'PROCESSING',
      message: `Batch ingestion started for ${filePaths.length} camera trap frames.`
    };
  }

  async _executeRunAsync(runDoc, filePaths, defaultStationId, options) {
    const runId = runDoc.runId;
    const startTime = Date.now();
    const batchSize = options.batchSize || 6;
    const newMovementRecords = [];

    let blankCount = 0;
    let tigerCount = 0;
    let reviewCount = 0;
    let otherCount = 0;
    let humanCount = 0;
    let totalBytesSaved = 0;

    // Fetch station metadata fallback
    let station = await CameraStation.findOne({ stationId: defaultStationId });
    if (!station) {
      station = await CameraStation.findOne({ zone: 'CORE' }) || {
        stationId: 'PTR-C-01',
        name: 'Karmajhiri Core',
        latitude: 21.6842,
        longitude: 79.3124
      };
    }

    try {
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const job = this.activeJobs.get(runId);
        if (job && job.isCancelled) {
          runDoc.status = 'CANCELLED';
          await runDoc.save();
          return;
        }

        const batchFiles = filePaths.slice(i, i + batchSize);

        // Process batch items sequentially to prevent memory spikes on field laptops
        for (const filePath of batchFiles) {
          const fileName = path.basename(filePath);
          try {
            const stats = fs.statSync(filePath);
            const aiRes = await aiClient.processImage(filePath, options);

            // Clock drift check (detect cameras reset to 1970 or 2000)
            let captureTimestamp = new Date();
            if (aiRes.exif && aiRes.exif.timestamp) {
              const parsedDate = new Date(aiRes.exif.timestamp.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
              if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2010) {
                captureTimestamp = parsedDate;
              } else {
                console.warn(`[BatchIngest] Camera clock drift detected on ${fileName} (${aiRes.exif.timestamp}). Using ingestion time.`);
              }
            }

            // GPS Fallback Hierarchy: EXIF GPS > Camera Station GPS (Requirement 12)
            const latitude = (aiRes.exif && aiRes.exif.latitude) ? aiRes.exif.latitude : station.latitude;
            const longitude = (aiRes.exif && aiRes.exif.longitude) ? aiRes.exif.longitude : station.longitude;
            const hasExifGps = Boolean(aiRes.exif && aiRes.exif.has_exif_gps);

            // Determine Review Status
            let reviewStatus = 'PENDING';
            if (aiRes.blank) {
              reviewStatus = 'QUARANTINED';
              blankCount++;
            } else if (aiRes.tiger_detected) {
              tigerCount++;
              if (aiRes.needs_review) {
                reviewStatus = 'PENDING';
                reviewCount++;
              } else {
                reviewStatus = 'AUTO_CONFIRMED';
              }
            } else if (aiRes.detected_class === 'human') {
              humanCount++;
              reviewStatus = 'CONFIRMED';
            } else {
              otherCount++;
              reviewStatus = 'CONFIRMED';
            }

            // Save Image record in MongoDB
            const imgDoc = new Image({
              fileName,
              filePath,
              originalPath: filePath,
              fileSize: stats.size,
              timestamp: captureTimestamp,
              cameraStation: station.stationId,
              latitude,
              longitude,
              hasExifGps,
              blank: aiRes.blank,
              blankConfidence: aiRes.blank_confidence,
              tigerDetected: aiRes.tiger_detected,
              tigerConfidence: aiRes.tiger_confidence,
              detectedClass: aiRes.detected_class,
              boundingBox: aiRes.bbox,
              tigerId: aiRes.individual,
              suggestedTigerId: aiRes.suggested_tiger || null,
              identificationConfidence: aiRes.identification_confidence,
              reviewStatus,
              candidates: aiRes.candidates || [],
              modelVersion: aiRes.model_version,
              runId,
              processingTimeMs: aiRes.processing_time_ms
            });
            await imgDoc.save();

            // Safe quarantine for blanks
            if (aiRes.blank) {
              const qRes = await quarantineService.stageBlankImage(imgDoc, filePath);
              if (qRes.quarantined) {
                totalBytesSaved += qRes.fileSizeBytes;
              }
            }

            // Record movement telemetry if confident tiger detected
            if (aiRes.tiger_detected && aiRes.individual && !aiRes.needs_review) {
              const moveRec = new MovementRecord({
                tigerId: aiRes.individual,
                imageId: imgDoc._id,
                stationId: station.stationId,
                zone: station.zone || 'CORE',
                latitude,
                longitude,
                timestamp: captureTimestamp,
                confidence: aiRes.identification_confidence,
                runId
              });
              await moveRec.save();
              newMovementRecords.push(moveRec);

              // Update individual tiger occupancy
              await occupancyService.regenerateTigerOccupancy(aiRes.individual);
            }
          } catch (itemErr) {
            console.error(`Error processing file ${fileName}: ${itemErr.message}`);
            runDoc.errorLog.push({
              fileName,
              error: itemErr.message,
              timestamp: new Date()
            });
          }

          // Increment progress
          runDoc.processedImages++;
          if (job) job.processed = runDoc.processedImages;
        }

        // Periodic checkpoint
        const elapsedSec = Math.max(1, (Date.now() - startTime) / 1000);
        runDoc.throughputFps = Number((runDoc.processedImages / elapsedSec).toFixed(2));
        runDoc.blankCount = blankCount;
        runDoc.tigerCount = tigerCount;
        runDoc.reviewCount = reviewCount;
        runDoc.otherAnimalCount = otherCount;
        runDoc.humanCount = humanCount;
        runDoc.diskSpaceSavedMB = Number((totalBytesSaved / (1024 * 1024)).toFixed(2));
        await runDoc.save();
      }

      // Run deviation & alert analysis on completed run
      if (newMovementRecords.length > 0) {
        await movementService.analyzeRunMovement(runId, newMovementRecords);
      }

      const totalElapsed = (Date.now() - startTime) / 1000;
      runDoc.status = 'COMPLETED';
      runDoc.completedAt = new Date();
      runDoc.durationSeconds = Number(totalElapsed.toFixed(2));
      runDoc.throughputFps = Number((runDoc.processedImages / Math.max(1, totalElapsed)).toFixed(2));
      await runDoc.save();

      this.activeJobs.delete(runId);
      console.log(`[BatchIngest] Run ${runId} finished in ${totalElapsed.toFixed(1)}s. Total: ${runDoc.processedImages} images.`);
    } catch (runErr) {
      console.error(`[BatchIngest] Fatal failure in run ${runId}: ${runErr.message}`);
      runDoc.status = 'FAILED';
      runDoc.completedAt = new Date();
      await runDoc.save();
      this.activeJobs.delete(runId);
    }
  }

  getJobProgress(runId) {
    return this.activeJobs.get(runId) || null;
  }
}

module.exports = new BatchIngestService();
