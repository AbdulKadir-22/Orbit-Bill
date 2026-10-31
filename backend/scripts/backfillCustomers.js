const mongoose = require('mongoose');
const env = require('../src/config/env');
const connectDB = require('../src/config/db');
const logger = require('../src/config/logger');
const User = require('../src/modules/users/user.model');
const Customer = require('../src/modules/customers/customer.model');
const ROLES = require('../src/constants/roles');

/**
 * Idempotent script:
 * Finds all User documents with role === 'customer' where customerId is null/missing,
 * creates a matching Customer record (or links to an existing one with identical email),
 * and updates user.customerId.
 */
const backfillCustomers = async () => {
  try {
    await connectDB();

    const usersWithoutCustomer = await User.find({
      role: ROLES.CUSTOMER,
      $or: [{ customerId: null }, { customerId: { $exists: false } }],
    });

    logger.info(`Found ${usersWithoutCustomer.length} customer user(s) needing Customer backfill.`);

    let backfilledCount = 0;

    for (const user of usersWithoutCustomer) {
      const normalizedEmail = user.email.toLowerCase().trim();

      // Check if a Customer record already exists for this email
      let customer = await Customer.findOne({ email: normalizedEmail });

      if (!customer) {
        customer = await Customer.create({
          name: user.name,
          email: normalizedEmail,
          isActive: user.isActive !== undefined ? user.isActive : true,
          createdBy: user.createdBy || null,
        });
        logger.info(`Created new Customer record for '${user.email}' (ID: ${customer._id})`);
      } else {
        logger.info(`Linking user '${user.email}' to existing Customer (ID: ${customer._id})`);
      }

      user.customerId = customer._id;
      await user.save();
      backfilledCount += 1;
    }

    logger.info(`✅ Successfully backfilled ${backfilledCount} customer user(s).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error running customer backfill: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

backfillCustomers();
