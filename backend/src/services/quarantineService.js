const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');

const QUARANTINE_DIR = path.resolve(process.env.QUARANTINE_DIR || path.join(__dirname, '../../../quarantine'));

class QuarantineService {
  constructor() {
    if (!fs.existsSync(QUARANTINE_DIR)) {
      fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
    }
  }

  /**
   * Safely moves or stages a blank image into the quarantine directory without permanent deletion.
   */
  async stageBlankImage(imageDoc, sourceFilePath) {
    try {
      const fileName = path.basename(sourceFilePath);
      const subDir = new Date().toISOString().split('T')[0];
      const targetDir = path.join(QUARANTINE_DIR, subDir);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const destPath = path.join(targetDir, `${Date.now()}_${fileName}`);
      
      // Copy file to quarantine (preserving working copy if needed)
      fs.copyFileSync(sourceFilePath, destPath);
      const stats = fs.statSync(sourceFilePath);

      imageDoc.isQuarantined = true;
      imageDoc.quarantinePath = destPath;
      imageDoc.fileSize = stats.size;
      imageDoc.reviewStatus = 'QUARANTINED';
      await imageDoc.save();

      return {
        quarantined: true,
        quarantinePath: destPath,
        fileSizeBytes: stats.size
      };
    } catch (err) {
      console.error(`[Quarantine] Error staging image to quarantine: ${err.message}`);
      return { quarantined: false, error: err.message };
    }
  }

  /**
   * Restores an image from quarantine back to active status (e.g. if human review reveals false negative).
   */
  async restoreFromQuarantine(imageId) {
    const image = await Image.findById(imageId);
    if (!image || !image.isQuarantined) {
      throw new Error('Image not found or not in quarantine');
    }

    image.isQuarantined = false;
    image.blank = false;
    image.reviewStatus = 'PENDING';
    await image.save();

    return {
      restored: true,
      image
    };
  }

  /**
   * Permanently deletes quarantined files ONLY upon explicit human confirmation.
   */
  async purgeQuarantine(imageIds = []) {
    let deletedCount = 0;
    let bytesReclaimed = 0;

    for (const id of imageIds) {
      const img = await Image.findById(id);
      if (img && img.isQuarantined && img.quarantinePath) {
        try {
          if (fs.existsSync(img.quarantinePath)) {
            const stat = fs.statSync(img.quarantinePath);
            bytesReclaimed += stat.size;
            fs.unlinkSync(img.quarantinePath);
          }
          img.isDeleted = true;
          img.deletedAt = new Date();
          await img.save();
          deletedCount++;
        } catch (err) {
          console.warn(`Could not delete file ${img.quarantinePath}: ${err.message}`);
        }
      }
    }

    return {
      deletedCount,
      reclaimedMB: (bytesReclaimed / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Computes quarantine audit statistics (total space saved, count of quarantined blanks).
   */
  async getQuarantineStats() {
    const quarantinedImages = await Image.find({ isQuarantined: true, isDeleted: false });
    const totalBytes = quarantinedImages.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    const spaceSavedMB = (totalBytes / (1024 * 1024)).toFixed(2);
    
    // Estimating ~12 seconds of manual sorting saved per blank image
    const personHoursSaved = ((quarantinedImages.length * 12) / 3600).toFixed(1);

    return {
      quarantinedCount: quarantinedImages.length,
      spaceSavedMB: Number(spaceSavedMB),
      personHoursSaved: Number(personHoursSaved)
    };
  }
}

module.exports = new QuarantineService();
