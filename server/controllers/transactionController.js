import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get transactions with filters (category, from, to) + pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { category, from, to, page = 1, limit = 50 } = req.query;

  const filter = { user: req.user._id };

  if (category) filter.category = category;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filter.date.$lte = toDate;
    }
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name icon color'),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    transactions,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total,
  });
});

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const { title, amount, category, date, note } = req.body;

  if (!title || amount === undefined || !category) {
    res.status(400).json({ message: 'Title, amount, and category are required' });
    return;
  }

  const categoryDoc = await Category.findOne({
    _id: category,
    user: req.user._id,
  });

  if (!categoryDoc) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    title,
    amount,
    category,
    date: date ? new Date(date) : new Date(),
    note: note || '',
  });

  const populated = await Transaction.findById(transaction._id).populate(
    'category',
    'name icon color'
  );

  res.status(201).json(populated);
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404).json({ message: 'Transaction not found' });
    return;
  }

  if (String(transaction.user) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not authorized to edit this transaction' });
    return;
  }

  const { title, amount, category, date, note } = req.body;

  if (category) {
    const categoryDoc = await Category.findOne({
      _id: category,
      user: req.user._id,
    });
    if (!categoryDoc) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    transaction.category = category;
  }

  transaction.title = title || transaction.title;
  transaction.amount = amount !== undefined ? amount : transaction.amount;
  transaction.date = date ? new Date(date) : transaction.date;
  transaction.note = note !== undefined ? note : transaction.note;

  const updated = await transaction.save();
  const populated = await Transaction.findById(updated._id).populate(
    'category',
    'name icon color'
  );

  res.json(populated);
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    res.status(404).json({ message: 'Transaction not found' });
    return;
  }

  if (String(transaction.user) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not authorized to delete this transaction' });
    return;
  }

  await transaction.deleteOne();
  res.json({ message: 'Transaction removed' });
});

export {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
