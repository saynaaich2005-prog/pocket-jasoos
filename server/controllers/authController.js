import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Please provide name, email, and password' });
    return;
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      savingsGoal: user.savingsGoal,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile (name, savings goal)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { name, savingsGoal } = req.body;

  if (name) user.name = name;
  if (savingsGoal !== undefined) {
    const goal = Number(savingsGoal);
    if (Number.isNaN(goal) || goal < 0) {
      res.status(400).json({ message: 'Savings goal must be a positive number' });
      return;
    }
    user.savingsGoal = goal;
  }

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    savingsGoal: updated.savingsGoal,
  });
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new password are required' });
    return;
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
