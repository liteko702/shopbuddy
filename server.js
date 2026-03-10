const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load all category data
const categoriesDir = path.join(__dirname, 'data', 'categories');
const categories = {};
fs.readdirSync(categoriesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(path.join(categoriesDir, file), 'utf8'));
    categories[data.id] = data;
  }
});

// Full catalogue of browsable categories (loaded ones + planned)
const catalogue = require('./data/catalogue.json');

// API: List all categories (full catalogue with groups)
app.get('/api/categories', (req, res) => {
  // Mark which ones are live (have full data)
  const result = catalogue.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      live: !!categories[item.id]
    }))
  }));
  res.json(result);
});

// API: Search across all categories
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);

  const results = [];
  catalogue.forEach(group => {
    group.items.forEach(item => {
      const searchable = `${item.name} ${item.tagline} ${(item.keywords || []).join(' ')}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({ ...item, group: group.name, live: !!categories[item.id] });
      }
    });
  });
  res.json(results);
});

// API: Get full category data
app.get('/api/category/:id', (req, res) => {
  const cat = categories[req.params.id];
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  res.json(cat);
});

// API: Get recommendations based on answers
app.post('/api/recommend/:id', (req, res) => {
  const cat = categories[req.params.id];
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const { answers } = req.body; // { questionId: selectedValue }
  const budget = answers.budget || 'mid';

  // Score each product based on answers
  const scored = cat.products.map(product => {
    let score = 0;
    let reasons = [];

    // Budget match
    const tierOrder = ['budget', 'mid', 'premium', 'flagship'];
    const budgetIdx = tierOrder.indexOf(budget);
    const productIdx = tierOrder.indexOf(product.tier);
    const tierDiff = Math.abs(budgetIdx - productIdx);

    if (tierDiff === 0) { score += 30; reasons.push('Within budget'); }
    else if (tierDiff === 1) { score += 15; reasons.push(productIdx > budgetIdx ? 'Slight upgrade' : 'Under budget'); }
    else { score += 5; }

    // Feature scoring from question impacts
    cat.questions.forEach(q => {
      const answer = answers[q.id];
      if (!answer || !q.impact || !q.impact[answer]) return;
      const impacts = q.impact[answer];

      Object.entries(impacts).forEach(([need, weight]) => {
        if (need === 'suction' && weight >= 2) {
          if (product.suction >= 7000) { score += weight * 5; reasons.push('Strong suction for your needs'); }
          else if (product.suction >= 5000) { score += weight * 2; }
        }
        if (need === 'mop' && weight >= 1) {
          if (product.mop && product.mop !== false) { score += weight * 5; reasons.push('Has mopping'); }
          if (product.mop === 'rotating-dual' || product.mop === 'sonic-vibrating') { score += weight * 3; reasons.push('Advanced mopping'); }
        }
        if (need === 'mop' && weight < 0) {
          if (!product.mop || product.mop === false) { score += 3; reasons.push("No mop needed — you save on a feature you won't use"); }
        }
        if (need === 'selfEmpty' && weight >= 1) {
          if (product.selfEmpty) { score += weight * 5; reasons.push('Self-emptying base'); }
        }
        if (need === 'obstacle' && weight >= 1) {
          if (product.obstacleAvoidance) { score += weight * 5; reasons.push('AI obstacle avoidance'); }
        }
        if (need === 'nav' && weight >= 1) {
          if (product.nav.includes('LiDAR')) { score += weight * 4; reasons.push('LiDAR navigation'); }
        }
        if (need === 'battery' && weight >= 1) {
          if (product.battery >= 180) { score += weight * 3; reasons.push('Long battery for large area'); }
        }
        if (need === 'mopLift' && weight >= 1) {
          const desc = JSON.stringify(product.features).toLowerCase();
          if (desc.includes('mop lift') || desc.includes('auto-lift')) { score += weight * 4; reasons.push('Auto mop lifting for mixed floors'); }
        }
        if (need === 'mopWash' && weight >= 1) {
          const desc = JSON.stringify(product.features).toLowerCase();
          if (desc.includes('hot water') || desc.includes('mop wash')) { score += weight * 4; reasons.push('Self-cleaning mop pads'); }
        }
      });
    });

    // Deduplicate reasons
    reasons = [...new Set(reasons)];

    return {
      ...product,
      score,
      matchReasons: reasons.slice(0, 5),
      matchPercent: Math.min(100, Math.round((score / 80) * 100))
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Find best match, upgrade, and budget options
  const bestMatch = scored[0];
  const budgetIdx = ['budget', 'mid', 'premium', 'flagship'].indexOf(budget);

  const upgrade = scored.find(p =>
    ['budget', 'mid', 'premium', 'flagship'].indexOf(p.tier) > budgetIdx && p.id !== bestMatch.id
  );

  const downgrade = scored.find(p =>
    ['budget', 'mid', 'premium', 'flagship'].indexOf(p.tier) < budgetIdx && p.id !== bestMatch.id
  );

  res.json({
    topPick: bestMatch,
    upgrade: upgrade || null,
    savingOption: downgrade || null,
    allRanked: scored,
    answeredBudget: budget,
    tier: cat.tiers[budget]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛒 ShopBuddy running on port ${PORT}`);
});
