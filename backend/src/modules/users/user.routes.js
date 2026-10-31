const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('./user.controller');
const {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
} = require('./user.validation');


router.route('/')
  .post(validateCreateUser, createUser)
  .get(getUsers);

router.route('/:id')
  .get(validateUserId, getUserById)
  .put(validateUserId, validateUpdateUser, updateUser)
  .delete(validateUserId, deleteUser);

module.exports = router;
