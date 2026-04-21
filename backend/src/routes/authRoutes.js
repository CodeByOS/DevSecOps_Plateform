const express = require('express');
const router  = express.Router();

const { register, login, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);

// Protected routes (need valid JWT)
router.post('/logout', protect, logout);
router.get('/me',      protect, getMe);

module.exports = router;
