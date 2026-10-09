const ParentProfile = require('../models/ParentProfile');
const Student = require('../models/Student');
const ParentStudentLink = require('../models/ParentStudentLink');
const Consent = require('../models/Consent');

// Add a child profile
const addChild = async (req, res, next) => {
  try {
    const { name, age, grade } = req.body;
    if (!name || !age) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Child name and age are required' },
      });
    }

    const parentProfile = await ParentProfile.findOne({ userId: req.user.userId });
    if (!parentProfile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Parent profile not found' },
      });
    }

    const sanitizedName = name.trim();
    const existingChild = await Student.findOne({
      parentId: req.user.userId,
      name: { $regex: new RegExp(`^${sanitizedName}$`, 'i') },
    });
    if (existingChild) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_CHILD', message: `A child profile for '${sanitizedName}' already exists in your account` },
      });
    }

    const rollNumber = `P-${Date.now().toString().slice(-6)}`;

    const student = new Student({
      name: sanitizedName,
      age: Number(age),
      grade: grade ? grade.trim() : 'Kindergarten',
      rollNumber,
      parentPhone: parentProfile.phone,
      parentId: req.user.userId,
    });
    await student.save();

    await ParentStudentLink.create({
      parentId: req.user.userId,
      studentId: student._id,
      linkedByPhone: parentProfile.phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Child profile created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Get linked children for parent
const getChildren = async (req, res, next) => {
  try {
    const links = await ParentStudentLink.find({ parentId: req.user.userId }).populate('studentId');
    const directChildren = await Student.find({ parentId: req.user.userId });

    // Combine and deduplicate
    const map = new Map();
    for (const link of links) {
      if (link.studentId) {
        map.set(link.studentId._id.toString(), link.studentId);
      }
    }
    for (const child of directChildren) {
      map.set(child._id.toString(), child);
    }

    const children = Array.from(map.values());

    return res.status(200).json({
      success: true,
      data: children,
    });
  } catch (error) {
    next(error);
  }
};

// Record explicit parent consent
const recordConsent = async (req, res, next) => {
  try {
    const { studentId, consentGiven } = req.body;
    if (!studentId || consentGiven === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'studentId and consentGiven boolean are required' },
      });
    }

    const consent = new Consent({
      parentId: req.user.userId,
      studentId,
      consentGiven: Boolean(consentGiven),
      consentVersion: '1.0',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });
    await consent.save();

    return res.status(200).json({
      success: true,
      message: 'Parent consent recorded successfully',
      data: consent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addChild,
  getChildren,
  recordConsent,
};
