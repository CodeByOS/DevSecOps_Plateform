const express = require('express');
const router  = express.Router();

const { register, login, refresh, logout, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);

// Protected routes (need valid JWT)
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
