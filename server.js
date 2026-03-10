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

const catalogue = require('./data/catalogue.json');
const trending = require('./data/trending.json');

// API: List all categories
app.get('/api/categories', (req, res) => {
  res.json(catalogue.map(group => ({
    ...group,
    items: group.items.map(item => ({ ...item, live: !!categories[item.id] }))
  })));
});

// API: Trending & inspiration
app.get('/api/trending', (req, res) => res.json(trending));

// API: Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);
  const results = [];
  catalogue.forEach(group => {
    group.items.forEach(item => {
      const searchable = `${item.name} ${item.tagline} ${(item.keywords || []).join(' ')}`.toLowerCase();
      if (searchable.includes(q)) results.push({ ...item, group: group.name, live: !!categories[item.id] });
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

// API: Get recommendations
app.post('/api/recommend/:id', (req, res) => {
  const cat = categories[req.params.id];
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  const { answers } = req.body;
  const budget = answers.budget || 'mid';
  const tierOrder = ['budget', 'mid', 'premium', 'flagship'];
  const budgetIdx = tierOrder.indexOf(budget);

  const scored = cat.products.map(product => {
    let score = 0;
    let reasons = [];
    const blob = JSON.stringify(product).toLowerCase();

    // Budget match
    const productIdx = tierOrder.indexOf(product.tier);
    const tierDiff = Math.abs(budgetIdx - productIdx);
    if (tierDiff === 0) { score += 30; reasons.push('Within budget'); }
    else if (tierDiff === 1) { score += 15; reasons.push(productIdx > budgetIdx ? 'Slight upgrade' : 'Under budget'); }
    else { score += 5; }

    // Build preference matching (PC-specific)
    if (answers.build_pref) {
      const isPrebuilt = blob.includes('pre-built') || blob.includes('prebuilt');
      if (answers.build_pref === 'prebuilt' && isPrebuilt) { score += 10; reasons.push('Pre-built — ready to go'); }
      if (answers.build_pref === 'custom' && !isPrebuilt) { score += 10; reasons.push('Custom build — best value'); }
      // 'either' gets no preference bonus
    }

    // Feature scoring from question impacts
    cat.questions.forEach(q => {
      const answer = answers[q.id];
      if (!answer || !q.impact || !q.impact[answer]) return;
      const impacts = q.impact[answer];

      Object.entries(impacts).forEach(([need, weight]) => {
        if (weight < 0) {
          // Negative = don't need this
          if (need === 'gpu' && product.specs?.gpu?.toLowerCase().includes('integrated')) {
            score += Math.abs(weight) * 3; reasons.push('No GPU needed — saves money');
          }
          if (need === 'mop' && (!product.mop || product.mop === false)) {
            score += 3; reasons.push("Saves on features you won't use");
          }
          return;
        }

        // Robot vacuum features
        if (need === 'suction' && product.suction) {
          if (product.suction >= 7000) { score += weight * 5; reasons.push('Strong suction'); }
          else if (product.suction >= 5000) { score += weight * 2; }
        }
        if (need === 'mop' && product.mop && product.mop !== false) {
          score += weight * 5; reasons.push('Has mopping');
          if (product.mop === 'rotating-dual' || product.mop === 'sonic-vibrating') { score += weight * 3; reasons.push('Advanced mopping'); }
        }
        if (need === 'selfEmpty' && product.selfEmpty) { score += weight * 5; reasons.push('Self-emptying base'); }
        if (need === 'obstacle' && product.obstacleAvoidance) { score += weight * 5; reasons.push('Obstacle avoidance'); }
        if (need === 'nav' && product.nav?.includes?.('LiDAR')) { score += weight * 4; reasons.push('LiDAR navigation'); }
        if (need === 'battery' && product.battery >= 180) { score += weight * 3; reasons.push('Long battery'); }
        if (need === 'mopLift' && (blob.includes('mop lift') || blob.includes('auto-lift'))) { score += weight * 4; reasons.push('Auto mop lifting'); }
        if (need === 'mopWash' && (blob.includes('hot water') || blob.includes('mop wash'))) { score += weight * 4; reasons.push('Self-cleaning mops'); }

        // PC features
        if (need === 'gpu' && product.specs?.gpu) {
          const gpu = product.specs.gpu.toLowerCase();
          if (gpu.includes('5090') || gpu.includes('5080')) { score += weight * 5; reasons.push('Top-tier GPU'); }
          else if (gpu.includes('5070') || gpu.includes('9070')) { score += weight * 4; reasons.push('Great GPU'); }
          else if (gpu.includes('4060') || gpu.includes('7600')) { score += weight * 2; reasons.push('Solid GPU'); }
        }
        if (need === 'cpu' && product.specs?.cpu) {
          const cpu = product.specs.cpu.toLowerCase();
          if (cpu.includes('9900') || cpu.includes('9950') || cpu.includes('ultra 9')) { score += weight * 5; reasons.push('High-end CPU'); }
          else if (cpu.includes('9700') || cpu.includes('ultra 7')) { score += weight * 3; reasons.push('Strong CPU'); }
          else { score += weight * 1; }
        }
        if (need === 'ram' && product.specs?.ram) {
          const ram = product.specs.ram;
          if (ram.includes('64GB')) { score += weight * 5; reasons.push('64GB RAM'); }
          else if (ram.includes('32GB')) { score += weight * 3; reasons.push('32GB RAM'); }
          else { score += weight * 1; }
        }
        if (need === 'storage' && product.specs?.storage) {
          if (blob.includes('4tb') || blob.includes('2tb')) { score += weight * 4; reasons.push('Plenty of storage'); }
          else if (blob.includes('1tb')) { score += weight * 2; reasons.push('1TB SSD'); }
        }
      });
    });

    reasons = [...new Set(reasons)];
    return { ...product, score, matchReasons: reasons.slice(0, 6), matchPercent: Math.min(100, Math.round((score / 80) * 100)) };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestMatch = scored[0];
  const upgrade = scored.find(p => tierOrder.indexOf(p.tier) > budgetIdx && p.id !== bestMatch.id);
  const downgrade = scored.find(p => tierOrder.indexOf(p.tier) < budgetIdx && p.id !== bestMatch.id);

  res.json({ topPick: bestMatch, upgrade: upgrade || null, savingOption: downgrade || null, allRanked: scored, answeredBudget: budget, tier: cat.tiers[budget] });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🛒 ShopBuddy running on port ${PORT}`));
