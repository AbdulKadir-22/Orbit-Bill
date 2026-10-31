const User = require('./user.model');
const ApiError = require('../../utils/ApiError');
const ROLES = require('../../constants/roles');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { buildSearchQuery } = require('../../utils/search');
const { sendStaffInviteEmail } = require('../../emails/email.service');

/**
 * Creates a staff user account. Only admin can execute this.
 */
const createStaff = async ({ name, email, password, permissions = [] }, creatorId) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw ApiError.conflict('Email is already registered', [
      { field: 'email', message: 'Email is already in use' },
    ]);
  }

  const staffUser = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: ROLES.STAFF,
    permissions,
    isActive: true,
    createdBy: creatorId,
  });

  // Send staff invite email asynchronously
  sendStaffInviteEmail({
    name: staffUser.name,
    email: staffUser.email,
    temporaryPassword: password,
  }).catch(() => {});

  return staffUser;
};

/**
 * Lists staff users with pagination, text search (name/email), and isActive filter.
 */
const listStaff = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {
    role: ROLES.STAFF,
  };

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const searchFilter = buildSearchQuery(query.search, ['name', 'email']);
    Object.assign(filter, searchFilter);
  }

  const [staffMembers, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email'),
    User.countDocuments(filter),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { staffMembers, meta };
};

/**
 * Get staff by ID.
 */
const getStaffById = async (staffId) => {
  const staff = await User.findOne({ _id: staffId, role: ROLES.STAFF }).populate('createdBy', 'name email');
  if (!staff) {
    throw ApiError.notFound('Staff member not found');
  }
  return staff;
};

/**
 * Update staff details (name and/or permissions).
 */
const updateStaff = async (staffId, updateData) => {
  const staff = await User.findOne({ _id: staffId, role: ROLES.STAFF });
  if (!staff) {
    throw ApiError.notFound('Staff member not found');
  }

  if (updateData.name !== undefined) {
    staff.name = updateData.name;
  }
  if (updateData.permissions !== undefined) {
    staff.permissions = updateData.permissions;
  }

  await staff.save();
  return staff;
};

/**
 * Update staff active status (activate/deactivate).
 * Rule: Admin cannot deactivate themselves; deactivation invalidates refresh sessions.
 */
const updateStaffStatus = async (staffId, isActive, adminUser) => {
  if (adminUser._id.toString() === staffId.toString()) {
    throw ApiError.badRequest('Administrators cannot modify their own active status');
  }

  const user = await User.findById(staffId);
  if (!user) {
    throw ApiError.notFound('Staff member not found');
  }

  if (user.role === ROLES.ADMIN) {
    throw ApiError.forbidden('Admin accounts cannot be deactivated via staff management');
  }

  user.isActive = isActive;

  // If deactivating, revoke active sessions
  if (!isActive) {
    user.refreshTokenHash = null;
  }

  await user.save();
  return user;
};

/**
 * Update staff permissions directly.
 */
const updateStaffPermissions = async (staffId, permissions) => {
  const staff = await User.findOne({ _id: staffId, role: ROLES.STAFF });
  if (!staff) {
    throw ApiError.notFound('Staff member not found');
  }

  staff.permissions = permissions;
  await staff.save();
  return staff;
};

/**
 * Delete a staff member.
 */
const deleteStaff = async (staffId, adminUser) => {
  if (adminUser && adminUser._id.toString() === staffId.toString()) {
    throw ApiError.badRequest('Administrators cannot delete their own account');
  }

  const staff = await User.findOne({ _id: staffId, role: ROLES.STAFF });
  if (!staff) {
    throw ApiError.notFound('Staff member not found');
  }

  await User.findByIdAndDelete(staffId);
  return { staff, message: 'Staff member deleted successfully' };
};

module.exports = {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
  updateStaffPermissions,
  deleteStaff,
};
