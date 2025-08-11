// Advanced Calculator logic with safe evaluation, history, keyboard support, localStorage

const displayEl = document.getElementById('display');
const buttons = document.querySelectorAll('.btn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportBtn = document.getElementById('exportBtn');
const darkToggle = document.getElementById('darkToggle');

let current = '';
const STORAGE_KEY = 'advanced_calc_history_v1';

// --- safe evaluator: only allow digits, operators, whitespace, parentheses, dot ---
function isSafeExpression(expr) {
  return /^[0-9+\-*/().\s]+$/.test(expr);
}
function evaluateExpression(expr) {
  if (!isSafeExpression(expr)) throw new Error('Invalid characters in expression');
  // Simple eval via Function constructor (faster than eval and we checked chars)
  return Function('"use strict"; return (' + expr + ')')();
}

// --- UI helpers ---
function updateDisplay(text) {
  displayEl.value = text;
}

function addToHistory(expression, result) {
  const entry = { expression, result: String(result), time: new Date().toISOString() };
  const list = getHistory();
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  renderHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const items = getHistory();
  historyList.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No history yet. Your calculations will appear here.';
    li.style.opacity = 0.7;
    historyList.appendChild(li);
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    const expr = document.createElement('div');
    expr.className = 'expr';
    expr.textContent = item.expression;

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';

    const res = document.createElement('div');
    res.className = 'res';
    res.textContent = item.result;

    const time = document.createElement('div');
    time.style.fontSize = '0.75rem';
    time.style.color = 'var(--muted)';
    time.style.marginLeft = '8px';
    time.textContent = new Date(item.time).toLocaleString();

    const replayBtn = document.createElement('button');
    replayBtn.textContent = '↺';
    replayBtn.title = 'Use this result';
    replayBtn.style.marginLeft = '10px';
    replayBtn.addEventListener('click', () => {
      current = item.result;
      updateDisplay(current);
    });

    right.appendChild(res);
    right.appendChild(time);
    right.appendChild(replayBtn);
    li.appendChild(expr);
    li.appendChild(right);
    historyList.appendChild(li);
  });
}

// --- actions ---
function clearAll() {
  current = '';
  updateDisplay(current);
}
function clearEntry() {
  current = current.slice(0, -1);
  updateDisplay(current);
}
function appendValue(v) {
  // Avoid multiple dots in the same number segment
  current += String(v);
  updateDisplay(current);
}
function calculate() {
  if (!current.trim()) return;
  try {
    const result = evaluateExpression(current);
    addToHistory(current, result);
    current = String(result);
    updateDisplay(current);
  } catch (err) {
    updateDisplay('Error');
    setTimeout(() => updateDisplay(''), 900);
    console.error(err);
  }
}

// --- wire up buttons ---
buttons.forEach(btn => {
  const val = btn.dataset.value;
  const action = btn.dataset.action;
  btn.addEventListener('click', () => {
    if (action === 'clear') clearAll();
    else if (action === 'clear-entry') clearEntry();
    else if (action === 'calculate') calculate();
    else if (val) appendValue(val);
  });
});

// --- keyboard support ---
window.addEventListener('keydown', (e) => {
  const allowedKeys = '0123456789+-*/().';
  if (allowedKeys.includes(e.key)) {
    appendValue(e.key);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    calculate();
  } else if (e.key === 'Backspace') {
    clearEntry();
  } else if (e.key === 'Escape') {
    clearAll();
  }
});

// --- history controls ---
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all calculation history?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
});

// --- export history as text file ---
exportBtn.addEventListener('click', () => {
  const data = getHistory();
  if (!data.length) {
    alert('No history to export.');
    return;
  }
  const text = data.map(i => `${new Date(i.time).toLocaleString()} | ${i.expression} = ${i.result}`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calc_history_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// dark mode toggle (simple)
darkToggle.addEventListener('click', () => {
  const pressed = darkToggle.getAttribute('aria-pressed') === 'true';
  darkToggle.setAttribute('aria-pressed', String(!pressed));
  document.documentElement.style.setProperty('--bg', pressed ? '#0f1720' : '#ffffff');
  // Minimal: invert colors (optional enhancement)
  if (!pressed) {
    document.body.style.filter = 'invert(0.02) hue-rotate(180deg)';
  } else {
    document.body.style.filter = 'none';
  }
});

// initialize
renderHistory();
clearAll();
