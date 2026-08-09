import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all categories with current-month spend
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const spendAgg = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', spent: { $sum: '$amount' } } },
  ]);

  const spendMap = {};
  for (const row of spendAgg) {
    spendMap[String(row._id)] = row.spent;
  }

  const result = categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    budget: cat.budget,
    description: cat.description,
    spent: spendMap[String(cat._id)] || 0,
    remaining: cat.budget - (spendMap[String(cat._id)] || 0),
    overBudget: cat.budget > 0 && (spendMap[String(cat._id)] || 0) > cat.budget,
  }));

  res.json(result);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, color, budget, description } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Category name is required' });
    return;
  }

  const category = await Category.create({
    user: req.user._id,
    name,
    icon: icon || 'category',
    color: color || '#ecb2ff',
    budget: budget || 0,
    description: description || '',
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  if (String(category.user) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not authorized to edit this category' });
    return;
  }

  const { name, icon, color, budget, description } = req.body;

  category.name = name || category.name;
  category.icon = icon || category.icon;
  category.color = color || category.color;
  category.budget = budget !== undefined ? budget : category.budget;
  category.description = description !== undefined ? description : category.description;

  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete a category (and its transactions)
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  if (String(category.user) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not authorized to delete this category' });
    return;
  }

  await Transaction.deleteMany({ category: category._id });
  await category.deleteOne();

  res.json({ message: 'Category removed' });
});

export { getCategories, createCategory, updateCategory, deleteCategory };
