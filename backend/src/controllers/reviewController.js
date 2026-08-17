const { v4: uuidv4 } = require('uuid');
const Review = require('../models/Review');
const Image = require('../models/Image');
const Alert = require('../models/Alert');
const Tiger = require('../models/Tiger');
const MovementRecord = require('../models/MovementRecord');
const AuditLog = require('../models/AuditLog');
const occupancyService = require('../services/occupancyService');
const aiClient = require('../services/aiServiceClient');

exports.getPendingReviews = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const filter = { reviewStatus: 'PENDING', isDeleted: false };
    
    const [imageTotal, pendingImages, reviewedAlerts] = await Promise.all([
      Image.countDocuments(filter),
      Image.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Alert.find({ status: 'REVIEWED' }).sort({ reviewedAt: -1, updatedAt: -1 })
    ]);

    res.json({
      total: imageTotal + reviewedAlerts.length,
      imageCount: imageTotal,
      alertCount: reviewedAlerts.length,
      page: Number(page),
      limit: Number(limit),
      pendingImages,
      reviewedAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { imageId, action, assignedTigerId, newTigerDetails, notes } = req.body;
    
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    let finalTigerId = null;
    let finalTigerName = null;

    if (action === 'CONFIRM') {
      finalTigerId = image.suggestedTigerId || image.tigerId;
      if (!finalTigerId && image.candidates && image.candidates.length > 0) {
        finalTigerId = image.candidates[0].tigerId;
      }
      image.reviewStatus = 'CONFIRMED';
      image.tigerId = finalTigerId;
    } else if (action === 'ASSIGN_TIGER') {
      if (!assignedTigerId) {
        return res.status(400).json({ error: 'assignedTigerId required for ASSIGN_TIGER action' });
      }
      finalTigerId = assignedTigerId.toUpperCase();
      image.reviewStatus = 'REASSIGNED';
      image.tigerId = finalTigerId;
    } else if (action === 'CREATE_NEW') {
      // Auto-generate next BT-XXX identifier
      const tigerCount = await Tiger.countDocuments();
      finalTigerId = (newTigerDetails && newTigerDetails.tigerId) 
        ? newTigerDetails.tigerId.toUpperCase() 
        : `BT${(tigerCount + 1).toString().padStart(3, '0')}`;
        
      finalTigerName = (newTigerDetails && newTigerDetails.name) || `Pench Tiger ${finalTigerId}`;

      const newTiger = new Tiger({
        tigerId: finalTigerId,
        name: finalTigerName,
        sex: (newTigerDetails && newTigerDetails.sex) || 'UNKNOWN',
        estimatedAge: (newTigerDetails && newTigerDetails.estimatedAge) || 3.5,
        status: 'RESIDENT',
        healthNotes: notes || 'New individual confirmed through human review triage.',
        firstSeen: image.timestamp,
        lastSeen: image.timestamp,
        stations: [image.cameraStation]
      });
      await newTiger.save();

      image.reviewStatus = 'NEW_ENROLLED';
      image.tigerId = finalTigerId;

      // Sync AI reference catalog
      const allTigers = await Tiger.find({});
      await aiClient.syncReferenceEmbeddings(allTigers);
    } else if (action === 'REJECT') {
      image.reviewStatus = 'REJECTED';
      image.tigerDetected = false;
      image.tigerId = null;
    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    await image.save();

    // Create Review audit record
    const review = new Review({
      reviewId: `REV-${uuidv4().substring(0, 8).toUpperCase()}`,
      imageId: image._id,
      reviewerId: req.user ? req.user._id : null,
      reviewerName: req.user ? req.user.name : 'Field Biologist',
      originalPrediction: {
        tigerId: image.suggestedTigerId || image.tigerId,
        confidence: image.identificationConfidence,
        candidates: image.candidates
      },
      action,
      assignedTigerId: finalTigerId,
      assignedTigerName: finalTigerName,
      notes,
      reviewTimestamp: new Date()
    });
    await review.save();

    // If confirmed or assigned -> create Movement Record and update spatial territory
    if (finalTigerId && action !== 'REJECT') {
      const moveRec = new MovementRecord({
        tigerId: finalTigerId,
        imageId: image._id,
        stationId: image.cameraStation,
        latitude: image.latitude,
        longitude: image.longitude,
        timestamp: image.timestamp,
        confidence: 1.0,
        runId: image.runId
      });
      await moveRec.save();
      await occupancyService.regenerateTigerOccupancy(finalTigerId);
    }

    res.json({
      message: 'Review decision recorded successfully',
      review,
      image
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
