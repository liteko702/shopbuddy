function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  document.getElementById('themeBtn').textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
  localStorage.setItem('shopbuddy-theme', isLight ? 'light' : 'dark');
}
// Restore saved theme
if (localStorage.getItem('shopbuddy-theme') === 'light') {
  document.body.classList.add('light');
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('themeBtn').textContent = '🌙 Dark Mode';
  });
}

let catalogue = [];
let currentCat = null;
let answers = {};
let currentQ = 0;
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
  catalogue = await fetch('/api/categories').then(r => r.json());
  renderCategories();
  // Close search on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-area')) document.getElementById('searchResults').classList.remove('open');
  });
});

function renderCategories() {
  const el = document.getElementById('categoryGroups');
  el.innerHTML = catalogue.map(group => `
    <div class="cat-group">
      <div class="cat-group-header">
        <span class="g-icon">${group.icon}</span>
        <h3>${group.name}</h3>
        <span style="color:var(--text2);font-size:0.85em">(${group.items.length})</span>
      </div>
      <div class="cat-grid">
        ${group.items.map(item => item.live ? `
          <div class="cat-card" onclick="loadCategory('${item.id}')">
            <div class="icon">${item.icon}</div>
            <div class="name">${item.name}</div>
            <div class="tagline">${item.tagline}</div>
          </div>
        ` : `
          <div class="cat-card cat-card-coming">
            <div class="icon">${item.icon}</div>
            <div class="name">${item.name}</div>
            <div class="tagline">${item.tagline}</div>
            <span class="coming-badge">Coming Soon</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Search
async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  const el = document.getElementById('searchResults');
  if (!q) { el.classList.remove('open'); return; }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const results = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.json());
    if (!results.length) {
      el.innerHTML = `<div class="search-item"><div><div class="s-name">No matches found</div><div class="s-tag">Try different keywords or browse categories below</div></div></div>`;
    } else {
      el.innerHTML = results.map(r => `
        <div class="search-item" onclick="${r.live ? `loadCategory('${r.id}')` : ''}">
          <span class="s-icon">${r.icon}</span>
          <div>
            <div class="s-name">${r.name} <span class="s-badge ${r.live ? 's-badge-live' : 's-badge-soon'}">${r.live ? '✓ Ready' : 'Coming Soon'}</span></div>
            <div class="s-tag">${r.tagline}</div>
            <div class="s-group">${r.group}</div>
          </div>
        </div>
      `).join('');
    }
    el.classList.add('open');
  }, 200);
}

// Photo upload
async function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;

  const el = document.getElementById('photoResult');
  el.innerHTML = `<div class="photo-result">
    <p>🔍 Analysing your photo...</p>
  </div>`;

  // Show preview
  const reader = new FileReader();
  reader.onload = () => {
    el.innerHTML = `<div class="photo-result">
      <img src="${reader.result}" class="photo-preview" style="display:block;margin:0 auto 12px">
      <p style="color:var(--accent2);font-weight:600">📸 Photo received!</p>
      <p style="color:var(--text2);margin-top:8px">Photo identification is being built — for now, try searching for what you see in the photo using the search bar above!</p>
      <p style="color:var(--text2);margin-top:8px;font-size:0.85em">Coming soon: AI-powered product identification from photos 🤖</p>
    </div>`;
  };
  reader.readAsDataURL(file);
}

function goHome() {
  document.getElementById('home').classList.add('active');
  document.getElementById('buddy').classList.remove('active');
  answers = {};
  currentQ = 0;
}

async function loadCategory(id) {
  currentCat = await fetch(`/api/category/${id}`).then(r => r.json());
  answers = {};
  currentQ = 0;
  document.getElementById('home').classList.remove('active');
  document.getElementById('buddy').classList.add('active');
  renderBuddy();
}

function renderBuddy() {
  const totalPhases = 3 + currentCat.questions.length; // learn + jargon + questions... + results
  const el = document.getElementById('buddyContent');

  el.innerHTML = `
    <div class="progress-bar" id="progressBar"></div>

    <!-- Phase 1: Things to Consider -->
    <div class="phase active" data-phase="learn">
      <div class="card">
        <h2>${currentCat.icon} ${currentCat.name} — What You Need to Know</h2>
        <p style="color:var(--text2);margin-bottom:20px;font-size:1.05em">${currentCat.intro}</p>
      </div>

      ${currentCat.thingsToConsider.map(c => `
        <div class="consider-card">
          <h4>
            ${c.title}
            <span class="importance importance-${c.importance}">${c.importance.replace('-', ' ')}</span>
          </h4>
          <p><strong>${c.summary}</strong></p>
          <p style="margin-top:8px">${c.detail}</p>
          <div class="rec">💡 ${c.recommendation}</div>
        </div>
      `).join('')}

      <div style="text-align:center;margin-top:24px">
        <button class="btn btn-primary" onclick="goPhase('jargon')" style="padding:14px 40px;font-size:1.05em">
          Got it — show me the jargon buster →
        </button>
      </div>
    </div>

    <!-- Phase 2: Jargon Buster -->
    <div class="phase" data-phase="jargon">
      <div class="card">
        <h2>📖 Jargon Buster</h2>
        <p style="color:var(--text2);margin-bottom:20px">These are the technical terms you'll see when shopping. Don't worry about memorising them — come back anytime!</p>
      </div>
      <div class="jargon-grid">
        ${currentCat.jargon.map(j => `
          <div class="jargon-item">
            <div class="term">${j.term}</div>
            <div class="meaning">${j.meaning}</div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:24px">
        <button class="btn btn-secondary" onclick="goPhase('learn')" style="margin-right:12px">← Back</button>
        <button class="btn btn-primary" onclick="startQuestions()" style="padding:14px 40px;font-size:1.05em">
          Let's find your match →
        </button>
      </div>
    </div>

    <!-- Phase 3: Questions (dynamic) -->
    <div class="phase" data-phase="questions">
      <div id="questionArea"></div>
    </div>

    <!-- Phase 4: Results -->
    <div class="phase" data-phase="results">
      <div id="resultsArea"></div>
    </div>
  `;

  updateProgress();
}

function goPhase(phase) {
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  document.querySelector(`.phase[data-phase="${phase}"]`).classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  // Simple progress based on current phase
  const active = document.querySelector('.phase.active');
  const phase = active?.dataset.phase;
  const total = 2 + currentCat.questions.length + 1;
  let current = 0;
  if (phase === 'learn') current = 1;
  else if (phase === 'jargon') current = 2;
  else if (phase === 'questions') current = 2 + currentQ + 1;
  else if (phase === 'results') current = total;

  document.getElementById('progressBar').innerHTML = Array.from({ length: total }, (_, i) => {
    const cls = i < current ? 'done' : i === current ? 'current' : '';
    return `<div class="progress-seg ${cls}"></div>`;
  }).join('');
}

function startQuestions() {
  currentQ = 0;
  goPhase('questions');
  renderQuestion();
}

function renderQuestion() {
  const q = currentCat.questions[currentQ];
  const total = currentCat.questions.length;

  document.getElementById('questionArea').innerHTML = `
    <div class="card">
      <div class="q-counter">Question ${currentQ + 1} of ${total}</div>
      <h2>${q.question}</h2>
      <div class="option-grid">
        ${q.options.map(o => `
          <div class="option-card ${answers[q.id] === o.value ? 'selected' : ''}" onclick="selectAnswer('${q.id}', '${o.value}', this)">
            <div class="icon">${o.icon}</div>
            <div class="label">${o.label}</div>
            ${o.desc ? `<div class="desc">${o.desc}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:16px">
      <button class="btn btn-secondary" onclick="${currentQ === 0 ? "goPhase('jargon')" : 'prevQuestion()'}">← Back</button>
      <span></span>
    </div>
  `;
  updateProgress();
}

function selectAnswer(qId, value, el) {
  answers[qId] = value;
  el.closest('.option-grid').querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  setTimeout(() => {
    if (currentQ < currentCat.questions.length - 1) {
      currentQ++;
      renderQuestion();
    } else {
      getResults();
    }
  }, 400);
}

function prevQuestion() {
  if (currentQ > 0) {
    currentQ--;
    renderQuestion();
  }
}

async function getResults() {
  goPhase('results');
  document.getElementById('resultsArea').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">🔍 Finding your perfect match...</div>';

  const res = await fetch(`/api/recommend/${currentCat.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });
  const data = await res.json();
  renderResults(data);
}

function renderResults(data) {
  const { topPick, upgrade, savingOption, allRanked, tier } = data;

  const renderProduct = (p, badge, badgeClass) => {
    // Render specs dynamically — works for any category
    let specsHtml = '';
    if (p.specs) {
      // PC-style specs object
      specsHtml = `<div class="spec-grid">${Object.entries(p.specs).map(([k, v]) => `
        <div class="spec"><div class="val" style="font-size:0.82em">${v}</div><div class="lbl">${k.toUpperCase()}</div></div>
      `).join('')}</div>`;
    } else {
      // Robot vacuum style
      const mopLabel = { false: 'No mop', 'basic-pad': 'Basic pad', 'vibrating': 'Vibrating', 'rotating-dual': 'Dual rotating', 'sonic-vibrating': 'Sonic vibrating' };
      specsHtml = `<div class="spec-grid">
        <div class="spec"><div class="val">${(p.suction||0).toLocaleString()} Pa</div><div class="lbl">Suction</div></div>
        <div class="spec"><div class="val">${p.nav||'—'}</div><div class="lbl">Navigation</div></div>
        <div class="spec"><div class="val">${mopLabel[p.mop] || p.mop || '—'}</div><div class="lbl">Mopping</div></div>
        <div class="spec"><div class="val">${p.selfEmpty ? '✅ Yes' : '❌ No'}</div><div class="lbl">Self-empty</div></div>
      </div>`;
    }
    return `
      <h4>${p.name}</h4>
      <div style="color:var(--text2);font-size:0.9em">${p.brand} · ${p.priceRange}</div>
      <div class="match-col" style="margin:8px 0">${p.matchPercent}% match</div>
      ${specsHtml}
      <p style="color:var(--text2);margin:12px 0;font-style:italic">${p.bestFor}</p>
      <div class="match-reasons">${p.matchReasons.map(r => `<span class="match-tag">${r}</span>`).join('')}</div>
      <div style="margin-top:12px">
        <strong style="color:var(--green)">Features:</strong>
        <ul class="features-list">${p.features.map(f => `<li class="pro">${f}</li>`).join('')}</ul>
      </div>
      <div style="margin-top:8px">
        <strong style="color:var(--warning)">Limitations:</strong>
        <ul class="features-list">${p.missing.map(f => `<li class="con">${f}</li>`).join('')}</ul>
      </div>
      <div class="buy-links">
        ${p.buyLinks.map(l => `<a href="${l.url}" target="_blank" class="buy-btn buy-btn-primary">🔗 ${l.store}</a>`).join('')}
      </div>
    `;
  };

  let html = `
    <div class="card" style="text-align:center">
      <h2>🎯 Your Personalised Recommendations</h2>
      <p style="color:var(--text2)">Based on your answers, here's what we'd recommend:</p>
      <div class="tier-indicator">
        ${Object.entries(currentCat.tiers).map(([k, t]) => `
          <div class="tier-dot ${k === data.answeredBudget ? 'active' : ''}">${t.icon} ${t.label}<br><span style="font-size:0.85em">${t.range}</span></div>
        `).join('')}
      </div>
    </div>

    <!-- Top Pick -->
    <div class="result-hero">
      <div class="badge">⭐ TOP PICK FOR YOU</div>
      ${renderProduct(topPick)}
    </div>
  `;

  // Upgrade option
  if (upgrade) {
    html += `
      <div class="alt-card">
        <span class="alt-badge upgrade">⬆️ UPGRADE OPTION</span>
        <p style="color:var(--text2);font-size:0.85em;margin-bottom:12px">Willing to spend a bit more? This gets you significant upgrades:</p>
        ${renderProduct(upgrade)}
      </div>
    `;
  }

  // Budget option
  if (savingOption) {
    html += `
      <div class="alt-card">
        <span class="alt-badge saving">💰 SAVE MONEY</span>
        <p style="color:var(--text2);font-size:0.85em;margin-bottom:12px">Want to spend less? This still covers your needs:</p>
        ${renderProduct(savingOption)}
      </div>
    `;
  }

  // All ranked
  html += `
    <div class="card all-products">
      <h3>📊 All Products Ranked For You</h3>
      <p style="color:var(--text2);margin-bottom:16px">Every option scored against your specific needs:</p>
      ${allRanked.map((p, i) => `
        <div class="prod-row ${i === 0 ? 'ranked-1' : ''}">
          <div>
            <span class="rank">#${i+1}</span>
            <strong>${p.name}</strong>
            <span style="color:var(--text2);font-size:0.85em"> — ${p.brand}</span>
          </div>
          <div class="price-col">${p.priceRange}</div>
          <div class="match-col">${p.matchPercent}% match</div>
          <div style="font-size:0.8em;color:var(--text2)">${p.tier}</div>
        </div>
      `).join('')}
    </div>
  `;

    // Parts guide (PC-specific or any category with partsGuide)
    if (currentCat.partsGuide) {
      const matchedTier = currentCat.partsGuide.find(p => p.tier === data.answeredBudget)
        || currentCat.partsGuide.find(p => p.tier === topPick.tier)
        || currentCat.partsGuide[1];

      html += `
        <div class="card" style="margin-top:24px">
          <h3>🛒 Buy Each Part Separately — ${matchedTier.name}</h3>
          <p style="color:var(--text2);margin-bottom:16px">Exactly what to buy and where to get the best price:</p>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="border-bottom:2px solid var(--border)">
                <th style="text-align:left;padding:10px;color:var(--text2);font-size:0.85em">Component</th>
                <th style="text-align:left;padding:10px;color:var(--text2);font-size:0.85em">Recommended</th>
                <th style="text-align:right;padding:10px;color:var(--text2);font-size:0.85em">Price</th>
                <th style="text-align:left;padding:10px;color:var(--text2);font-size:0.85em">Where to Buy</th>
              </tr></thead>
              <tbody>
                ${matchedTier.parts.map(p => `<tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:10px;font-weight:600;color:var(--accent2)">${p.component}</td>
                  <td style="padding:10px"><strong>${p.pick}</strong><div style="font-size:0.8em;color:var(--text2)">${p.note}</div></td>
                  <td style="padding:10px;text-align:right;font-weight:700;color:var(--green);white-space:nowrap">${p.price}</td>
                  <td style="padding:10px;color:var(--text2);font-size:0.9em">${p.where}</td>
                </tr>`).join('')}
                <tr style="border-top:2px solid var(--accent)">
                  <td style="padding:12px;font-weight:700;font-size:1.1em" colspan="2">TOTAL</td>
                  <td style="padding:12px;text-align:right;font-weight:800;font-size:1.1em;color:var(--accent2)">${matchedTier.total}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          ${matchedTier.pcpartpicker ? `<div style="margin-top:16px;text-align:center"><a href="${matchedTier.pcpartpicker}" target="_blank" class="buy-btn buy-btn-primary" style="text-decoration:none">🔍 See on PCPartPicker →</a></div>` : ''}
          <div style="margin-top:20px;padding:16px;background:var(--bg);border-radius:10px">
            <strong style="color:var(--accent2)">💡 Pro Tips:</strong>
            <ul style="color:var(--text2);margin:8px 0 0 20px;font-size:0.9em">
              <li><strong>PCPartPicker</strong> checks compatibility AND finds the cheapest price across all UK shops</li>
              <li><strong>Check multiple shops</strong> — prices differ £20-50 per part between retailers</li>
              <li><strong>Buy GPU + CPU first</strong> — they go out of stock fastest</li>
              <li><strong>Amazon for RAM & SSDs</strong> — usually cheapest with Prime delivery</li>
              <li><strong>Budget £15-30 extra</strong> for Windows key, cable ties, maybe an extra fan</li>
            </ul>
          </div>
        </div>`;

      // Other tiers as collapsible
      const otherTiers = currentCat.partsGuide.filter(p => p.tier !== matchedTier.tier);
      if (otherTiers.length) {
        html += `<div class="card"><h3>📋 Other Budget Tiers</h3>
          ${otherTiers.map(t => `<details style="margin-bottom:8px;background:var(--bg);border-radius:8px">
            <summary style="padding:12px;cursor:pointer;font-weight:600;color:var(--accent2)">${t.name} (${t.total})</summary>
            <div style="padding:0 12px 12px;overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;margin-top:8px">
                ${t.parts.map(p => `<tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:8px;font-weight:600;color:var(--accent2);width:100px">${p.component}</td>
                  <td style="padding:8px"><strong>${p.pick}</strong> <span style="color:var(--text2);font-size:0.8em">— ${p.note}</span></td>
                  <td style="padding:8px;text-align:right;color:var(--green);font-weight:700;white-space:nowrap">${p.price}</td>
                  <td style="padding:8px;color:var(--text2);font-size:0.85em">${p.where}</td>
                </tr>`).join('')}
              </table>
              ${t.pcpartpicker ? `<a href="${t.pcpartpicker}" target="_blank" style="display:inline-block;margin-top:8px;color:var(--accent2);font-size:0.9em">🔍 PCPartPicker →</a>` : ''}
            </div>
          </details>`).join('')}
        </div>`;
      }
    }

    // Retailers guide
    if (currentCat.retailers) {
      html += `<div class="card"><h3>🏪 Where to Buy — UK Retailers</h3>
        <p style="color:var(--text2);margin-bottom:16px">Best places to buy PC parts in the UK:</p>
        ${currentCat.retailers.map(r => `<div style="padding:14px;background:var(--bg);border-radius:10px;margin-bottom:8px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center">
          <div style="font-size:1.8em">${r.icon}</div>
          <div><strong>${r.name}</strong> <span style="color:var(--text2);font-size:0.8em">(${r.type})</span>
            <div style="color:var(--text2);font-size:0.85em;margin-top:2px">${r.bestFor}</div></div>
          <a href="${r.url}" target="_blank" class="buy-btn buy-btn-secondary" style="text-decoration:none;white-space:nowrap;font-size:0.85em">Visit →</a>
        </div>`).join('')}
      </div>`;
    }

  html += `
    <div style="text-align:center;margin-top:24px">
      <button class="btn btn-secondary" onclick="startQuestions()" style="margin-right:12px">🔄 Change My Answers</button>
      <button class="btn btn-primary" onclick="goHome()">🛒 Shop for something else</button>
    </div>
  `;

  document.getElementById('resultsArea').innerHTML = html;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
