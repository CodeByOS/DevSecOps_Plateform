const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Helper: send access + refresh tokens
const sendTokens = (user, statusCode, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

//* POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check existing user
  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Create user
  // Never trust role from client input
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'developer',
  });

  // Audit log
  try {
    await AuditLog.log({
      user: user._id,
      action: 'REGISTER',
      details: { email: user.email },
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  sendTokens(user, 201, res);
});

//* POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Include password explicitly
  const user = await User.findOne({
    email: normalizedEmail,
  }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Audit log
  try {
    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      details: { email: user.email },
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  sendTokens(user, 200, res);
});

//* POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token provided',
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  // Validate token type
  if (decoded.type !== 'refresh') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token type',
    });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User no longer exists',
    });
  }

  // Token revocation check
  if (decoded.tokenVersion !== user.tokenVersion) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token has been revoked',
    });
  }

  // Rotate refresh token + issue new access token
  sendTokens(user, 200, res);
});

//* POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  // Invalidate all tokens for this user
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { tokenVersion: 1 },
  });

  // Clear refresh token cookie
  res.clearCookie('refreshToken', cookieOptions);

  // Audit log
  try {
    await AuditLog.log({
      user: req.user._id,
      action: 'LOGOUT',
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

//* GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};