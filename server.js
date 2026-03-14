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

// Wiki route — renders docs/WIKI.md as a readable web page
app.get('/wiki', (req, res) => {
  const md = fs.readFileSync(path.join(__dirname, 'docs', 'WIKI.md'), 'utf8');
  const html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>(\n|$))+/gs, m => `<ul>${m}</ul>`)
    .replace(/^---+$/gm, '<hr>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hbupcli])/gm, '');
  res.send(`<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>🛒 ShopBuddy — Wiki</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0e0e12;color:#e0e0e8;line-height:1.7;padding:0}
    .wrap{max-width:860px;margin:0 auto;padding:40px 24px}
    h1{font-size:2em;color:#a78bfa;margin:0 0 8px}
    h2{font-size:1.4em;color:#c4b5fd;margin:36px 0 12px;padding-bottom:6px;border-bottom:1px solid #2a2a3a}
    h3{font-size:1.1em;color:#e0e0e8;margin:24px 0 8px}
    h4{font-size:1em;color:#a0a0b8;margin:16px 0 6px}
    p{color:#b0b0c4;margin:8px 0}
    ul{padding-left:20px;margin:8px 0}
    li{color:#b0b0c4;margin:4px 0}
    code{background:#1a1a26;border:1px solid #2a2a3a;padding:2px 6px;border-radius:4px;font-size:0.88em;color:#f9a8d4}
    blockquote{border-left:3px solid #a78bfa;padding:8px 16px;background:#1a1a26;border-radius:0 8px 8px 0;color:#c4b5fd;margin:12px 0}
    a{color:#a78bfa;text-decoration:none}a:hover{text-decoration:underline}
    hr{border:none;border-top:1px solid #2a2a3a;margin:28px 0}
    strong{color:#e0e0e8}
    .back{display:inline-block;margin-bottom:28px;background:#1a1a26;border:1px solid #2a2a3a;padding:8px 18px;border-radius:20px;color:#a78bfa;font-size:0.9em}
  </style>
</head><body><div class="wrap">
  <a class="back" href="/">← Back to ShopBuddy</a>
  <p>${html}</p>
</div></body></html>`);
});

app.listen(PORT, '0.0.0.0', () => console.log(`🛒 ShopBuddy running on port ${PORT}`));
