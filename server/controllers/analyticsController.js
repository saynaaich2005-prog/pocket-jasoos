import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

const monthRange = (monthsAgo = 0) => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - monthsAgo);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return { start, end };
};

// @desc    Dashboard summary for the current month
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { start, end } = monthRange(0);
  const { start: prevStart, end: prevEnd } = monthRange(1);

  const [thisMonth, prevMonth, categories, user] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: prevStart, $lt: prevEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Category.find({ user: userId }),
    User.findById(userId).select('name email savingsGoal'),
  ]);

  const totalSpent = thisMonth[0]?.total || 0;
  const prevSpent = prevMonth[0]?.total || 0;
  const transactionCount = thisMonth[0]?.count || 0;

  const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const balance = totalBudget - totalSpent;

  const breakdownAgg = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { amount: -1 } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$category._id',
        name: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        budget: '$category.budget',
        amount: 1,
        count: 1,
      },
    },
  ]);

  const topSuspect = breakdownAgg[0] || null;

  const spendingDelta = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0;
  const status = totalSpent <= totalBudget ? 'Stable' : 'Danger';

  res.json({
    period: { from: start, to: end },
    totalSpent,
    prevSpent,
    transactionCount,
    spendingDelta,
    balance,
    totalBudget,
    topSuspect,
    savingsGoal: user?.savingsGoal || 0,
    breakdown: breakdownAgg,
    status,
  });
});

// @desc    Spending trend for the last N months (default 6)
// @route   GET /api/analytics/trend?months=6
// @access  Private
const getTrend = asyncHandler(async (req, res) => {
  const months = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);

  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const { start, end } = monthRange(i);
    const rows = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    result.push({
      label: start.toLocaleString('en', { month: 'short', year: '2-digit' }),
      year: start.getFullYear(),
      month: start.getMonth(),
      total: rows[0]?.total || 0,
    });
  }

  res.json(result);
});

// @desc    Category breakdown / radar data
// @route   GET /api/analytics/categories
// @access  Private
const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const { start, end } = monthRange(0);

  const data = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', amount: { $sum: '$amount' } } },
    { $sort: { amount: -1 } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        name: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        budget: '$category.budget',
        amount: 1,
      },
    },
  ]);

  res.json(data);
});

// @desc    Generated insights (budget overruns, spending spikes)
// @route   GET /api/analytics/insights
// @access  Private
const getInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { start, end } = monthRange(0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekBefore = new Date(weekAgo);
  weekBefore.setDate(weekBefore.getDate() - 7);

  const [categories, thisWeekAgg, lastWeekAgg] = await Promise.all([
    Category.find({ user: userId, budget: { $gt: 0 } }),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: weekAgo, $lt: new Date() } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: weekBefore, $lt: weekAgo } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  const insights = [];

  const monthSpentAgg = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const monthSpent = {};
  for (const row of monthSpentAgg) monthSpent[String(row._id)] = row.total;

  for (const cat of categories) {
    const spent = monthSpent[String(cat._id)] || 0;
    if (cat.budget > 0 && spent > cat.budget) {
      insights.push({
        type: 'warning',
        title: `${cat.name} Alert!`,
        message: `You spent ${formatINR(spent)} on ${cat.name} against a budget of ${formatINR(cat.budget)}. Over by ${formatINR(spent - cat.budget)}.`,
      });
    } else if (cat.budget > 0) {
      const pct = Math.round((spent / cat.budget) * 100);
      insights.push({
        type: 'info',
        title: `${cat.name} on Track`,
        message: `You are at ${pct}% of your ${cat.name} budget. ${formatINR(Math.max(cat.budget - spent, 0))} remaining.`,
      });
    }
  }

  const thisWeekMap = {};
  for (const row of thisWeekAgg) thisWeekMap[String(row._id)] = row.total;
  const lastWeekMap = {};
  for (const row of lastWeekAgg) lastWeekMap[String(row._id)] = row.total;

  const thisWeekTotal = thisWeekAgg.reduce((s, r) => s + r.total, 0);
  const lastWeekTotal = lastWeekAgg.reduce((s, r) => s + r.total, 0);

  const catNames = {};
  for (const cat of await Category.find({ user: userId }).select('name')) {
    catNames[String(cat._id)] = cat.name;
  }

  for (const row of thisWeekAgg) {
    const last = lastWeekMap[String(row._id)] || 0;
    if (last > 0 && row.total > last * 1.2) {
      const name = catNames[String(row._id)] || 'This category';
      insights.push({
        type: 'spike',
        title: `${name} Spike`,
        message: `Spending on ${name} is up ${Math.round(((row.total - last) / last) * 100)}% this week compared to last week.`,
      });
    }
  }

  if (thisWeekTotal > 0 && lastWeekTotal > 0 && thisWeekTotal < lastWeekTotal) {
    insights.push({
      type: 'success',
      title: 'Spending Down',
      message: `Overall spending fell ${Math.round(((lastWeekTotal - thisWeekTotal) / lastWeekTotal) * 100)}% this week. Keep it up!`,
    });
  }

  insights.sort((a, b) => {
    const rank = { warning: 0, spike: 1, info: 2, success: 3 };
    return rank[a.type] - rank[b.type];
  });

  res.json(insights.slice(0, 6));
});

// @desc    Financial health score (0-100)
// @route   GET /api/analytics/health
// @access  Private
const getHealth = asyncHandler(async (req, res) => {
  const { start, end } = monthRange(0);

  const [categories, spentAgg] = await Promise.all([
    Category.find({ user: req.user._id }),
    Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  const spent = {};
  for (const row of spentAgg) spent[String(row._id)] = row.total;

  const budgeted = categories.filter((c) => c.budget > 0);

  let score = 100;
  if (budgeted.length > 0) {
    let penalty = 0;
    for (const cat of budgeted) {
      const catSpent = spent[String(cat._id)] || 0;
      const ratio = catSpent / cat.budget;
      if (ratio > 1) penalty += Math.min((ratio - 1) * 50, 40);
      else if (ratio > 0.8) penalty += 5;
    }
    score -= penalty;
  }

  score = Math.max(Math.round(score), 0);

  const status = score >= 75 ? 'Stable' : score >= 40 ? 'Shaky' : 'Critical';

  res.json({ score, status });
});

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export { getSummary, getTrend, getCategoryAnalytics, getInsights, getHealth };
