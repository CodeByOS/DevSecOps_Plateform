const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const sendTokens = (user, statusCode, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in httpOnly cookie (more secure than localStorage)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

//* POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Create the user (password is hashed in the model's pre-save hook)
  const user = await User.create({ name, email, password, role });

  await AuditLog.log({
    user:    user._id,
    action:  'REGISTER',
    details: { email },
    ipAddress: req.ip,
  });

  sendTokens(user, 201, res);
});

//* POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Include password in query (excluded by default with select: false)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  await AuditLog.log({
    user:    user._id,
    action:  'LOGIN',
    details: { email },
    ipAddress: req.ip,
  });

  sendTokens(user, 200, res);
});

//* POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token' });
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || decoded.tokenVersion !== user.tokenVersion) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  // Issue a fresh access token
  const accessToken = user.generateAccessToken();
  res.json({ success: true, accessToken });
});

//* POST /api/auth/logout 
const logout = asyncHandler(async (req, res) => {
  // Increment tokenVersion to invalidate all existing tokens for this user
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

  // Clear the refresh token cookie
  res.clearCookie('refreshToken');

  await AuditLog.log({
    user:    req.user._id,
    action:  'LOGOUT',
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

//* GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, refresh, logout, getMe };
