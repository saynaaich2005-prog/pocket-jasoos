const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Set TEST_EMAIL and TEST_PASSWORD env vars before running.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

const pass = (name) => {
  passed++;
  console.log(`PASS - ${name}`);
};

const fail = (name, status, body) => {
  failed++;
  console.log(`FAIL - ${name}`);
  console.log(`  status: ${status}`);
  const snippet =
    typeof body === 'string'
      ? body.slice(0, 200)
      : JSON.stringify(body).slice(0, 200);
  console.log(`  body: ${snippet}`);
};

const request = async (path, options = {}, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  let body;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
};

const run = async () => {
  const health = await request('/health');
  health.ok && health.body.status === 'ok'
    ? pass('GET /api/health')
    : fail('GET /api/health', health.status, health.body);

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const token = login.ok ? login.body.token : null;
  login.ok && token
    ? pass('POST /api/auth/login')
    : fail('POST /api/auth/login', login.status, login.body);

  if (!token) {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  let categoryId = null;
  let transactionId = null;

  const createCat = await request(
    '/categories',
    {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Category ${Date.now()}`,
        icon: 'science',
        color: '#ecb2ff',
        budget: 10000,
        description: 'temporary test category',
      }),
    },
    token
  );
  categoryId = createCat.ok ? createCat.body._id : null;
  createCat.ok && categoryId
    ? pass('POST /api/categories')
    : fail('POST /api/categories', createCat.status, createCat.body);

  const getCats = await request('/categories', {}, token);
  const foundCat = getCats.ok
    ? getCats.body.some((c) => String(c._id) === String(categoryId))
    : false;
  getCats.ok && foundCat
    ? pass('GET /api/categories')
    : fail('GET /api/categories', getCats.status, getCats.body);

  let createTx = null;
  if (categoryId) {
    createTx = await request(
      '/transactions',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Transaction',
          amount: 420,
          category: categoryId,
        }),
      },
      token
    );
    transactionId = createTx.ok ? createTx.body._id : null;
  }
  createTx && createTx.ok && transactionId
    ? pass('POST /api/transactions')
    : fail('POST /api/transactions', createTx ? createTx.status : 'skipped', createTx ? createTx.body : 'category creation failed');

  const getTxs = await request('/transactions', {}, token);
  getTxs.ok && Array.isArray(getTxs.body.transactions)
    ? pass('GET /api/transactions')
    : fail('GET /api/transactions', getTxs.status, getTxs.body);

  const summary = await request('/analytics/summary', {}, token);
  summary.ok && typeof summary.body.totalSpent === 'number'
    ? pass('GET /api/analytics/summary')
    : fail('GET /api/analytics/summary', summary.status, summary.body);

  const trend = await request('/analytics/trend?months=6', {}, token);
  trend.ok && Array.isArray(trend.body) && trend.body.length > 0
    ? pass('GET /api/analytics/trend')
    : fail('GET /api/analytics/trend', trend.status, trend.body);

  const catAnalytics = await request('/analytics/categories', {}, token);
  catAnalytics.ok && Array.isArray(catAnalytics.body)
    ? pass('GET /api/analytics/categories')
    : fail('GET /api/analytics/categories', catAnalytics.status, catAnalytics.body);

  const insights = await request('/analytics/insights', {}, token);
  insights.ok && Array.isArray(insights.body)
    ? pass('GET /api/analytics/insights')
    : fail('GET /api/analytics/insights', insights.status, insights.body);

  const healthScore = await request('/analytics/health', {}, token);
  healthScore.ok && typeof healthScore.body.score === 'number'
    ? pass('GET /api/analytics/health')
    : fail('GET /api/analytics/health', healthScore.status, healthScore.body);

  if (transactionId) {
    const delTx = await request(`/transactions/${transactionId}`, { method: 'DELETE' }, token);
    delTx.ok ? pass('DELETE /api/transactions/:id') : fail('DELETE /api/transactions/:id', delTx.status, delTx.body);
  }

  if (categoryId) {
    const delCat = await request(`/categories/${categoryId}`, { method: 'DELETE' }, token);
    delCat.ok ? pass('DELETE /api/categories/:id') : fail('DELETE /api/categories/:id', delCat.status, delCat.body);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(`FAIL - script error: ${err.message}`);
  process.exit(1);
});
