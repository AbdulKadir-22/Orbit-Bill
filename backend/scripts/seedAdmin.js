const mongoose = require('mongoose');
const env = require('../src/config/env');
const connectDB = require('../src/config/db');
const logger = require('../src/config/logger');
const User = require('../src/modules/users/user.model');
const ROLES = require('../src/constants/roles');
const { ALL_PERMISSIONS } = require('../src/constants/permissions');

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      $or: [
        { email: env.SEED_ADMIN_EMAIL.toLowerCase().trim() },
        { role: ROLES.ADMIN },
      ],
    });

    if (existingAdmin) {
      logger.info(`Admin user already exists (${existingAdmin.email}). Skipping seed.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    const admin = await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL.toLowerCase().trim(),
      password: env.SEED_ADMIN_PASSWORD,
      role: ROLES.ADMIN,
      isActive: true,
      permissions: ALL_PERMISSIONS,
    });

    logger.info(`✅ Admin user seeded successfully: ${admin.email}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error seeding admin: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
