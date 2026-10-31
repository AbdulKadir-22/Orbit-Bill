const mongoose = require('mongoose');

const validateCreateUser = (req, res, next) => {
  const { name, email, age } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (name.trim().length < 2 || name.trim().length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (age !== undefined) {
    if (typeof age !== 'number' || age < 0 || age > 120) {
      errors.push('Age must be a valid number between 0 and 120');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  next();
};

const validateUpdateUser = (req, res, next) => {
  const { name, email, age } = req.body;
  const errors = [];

  if (!name && !email && age === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, email, age) must be provided for update',
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
      errors.push('Name must be a string between 2 and 50 characters');
    }
  }

  if (email !== undefined) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address');
    }
  }

  if (age !== undefined) {
    if (typeof age !== 'number' || age < 0 || age > 120) {
      errors.push('Age must be a valid number between 0 and 120');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  next();
};

const validateUserId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid User ID format: ${id}`,
    });
  }
  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
};
