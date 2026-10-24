// ---------- 1. Data ----------
const KEY = "brokenomore.v1";

const CATEGORIES = {
  expense: {
    Food:      { icon: "🍔", color: "#5b4ddb" },
    Transport: { icon: "🚇", color: "#7c8cf8" },
    Shopping:  { icon: "🛍️", color: "#b26be8" },
    College:   { icon: "📚", color: "#f2b84b" },
    Others:    { icon: "💸", color: "#c9cedd" },
  },
  income: {
    "Pocket money": { icon: "💰", color: "#1f9d63" },
    "Part-time":    { icon: "🧑‍💻", color: "#1f9d63" },
    Others:         { icon: "💸", color: "#1f9d63" },
  },
};

const $ = (id) => document.getElementById(id);
const rupee = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.tx)) return saved;
  } catch (e) {}
  // first visit: start with pocket money so the dashboard isn't empty
  return {
    budget: 5000,
    tx: [{ id: Date.now(), type: "income", amount: 5000, category: "Pocket money", desc: "Pocket money", date: isoDate(new Date()) }],
  };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

let state = load();
let type = "expense";                       // current Quick Add tab
let showAll = false;                        // "View All" toggle
let month = isoDate(new Date()).slice(0, 7); // "2026-10"

// ---------- 2. Render everything from state ----------
function render() {
  const list = state.tx
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  let income = 0, expenses = 0;
  const byCat = {};
  list.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else { expenses += t.amount; byCat[t.category] = (byCat[t.category] || 0) + t.amount; }
  });

  // top cards
  $("balance").textContent = rupee(income - expenses);
  $("income").textContent = rupee(income);
  $("expenses").textContent = rupee(expenses);

  // budget
  const pct = state.budget > 0 ? Math.round((expenses / state.budget) * 100) : 0;
  $("spent").textContent = rupee(expenses);
  $("budgetAmt").textContent = rupee(state.budget);
  $("pct").textContent = pct > 100 ? `Over budget by ${rupee(expenses - state.budget)}` : `${pct}% used`;
  $("bar").style.width = Math.min(pct, 100) + "%";
  $("bar").classList.toggle("over", pct > 100);

  

  // transactions
  const shown = showAll ? list : list.slice(0, 4);
  $("empty").style.display = list.length ? "none" : "block";
  $("viewAll").textContent = showAll ? "Show less" : "View All";
  $("list").innerHTML = shown.map((t) => {
    const c = CATEGORIES[t.type][t.category] || { icon: "💸", color: "#c9cedd" };
    const day = new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const plus = t.type === "income";
    return `<li>
      <div class="chip" style="background:${c.color}22">${c.icon}</div>
      <div class="tx-info"><strong>${esc(t.desc || t.category)}</strong><small>${t.category}</small></div>
      <div class="tx-amt ${plus ? "plus" : ""}">${plus ? "+" : "-"}${rupee(t.amount)}<small>${day}</small></div>
      <button class="x" data-id="${t.id}" aria-label="Delete transaction">×</button>
    </li>`;
  }).join("");
}

// ---------- 3. Setup: month picker + category dropdown ----------
function fillMonths() {
  const now = new Date(), opts = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    opts.push(`<option value="${val}">${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</option>`);
  }
  $("month").innerHTML = opts.join("");
}
function fillCategories() {
  $("category").innerHTML = Object.keys(CATEGORIES[type]).map((n) => `<option>${n}</option>`).join("");
}

// ---------- 4. Events (what happens when the user does something) ----------
$("month").addEventListener("change", (e) => { month = e.target.value; render(); });

document.querySelectorAll(".toggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    type = btn.dataset.type;
    document.querySelectorAll(".toggle button").forEach((b) => b.classList.toggle("active", b === btn));
    fillCategories();
  });
});

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseFloat($("amount").value);
  if (!(amount > 0)) { $("error").textContent = "Enter an amount above 0."; return; }
  $("error").textContent = "";
  state.tx.push({ id: Date.now(), type, amount, category: $("category").value, desc: $("desc").value.trim(), date: isoDate(new Date()) });
  save();
  month = isoDate(new Date()).slice(0, 7);
  $("month").value = month;
  e.target.reset();
  render();
});

$("amount").addEventListener("input", () => { $("error").textContent = ""; });

$("list").addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  state.tx = state.tx.filter((t) => String(t.id) !== id);
  save();
  render();
});

$("setBudget").addEventListener("click", () => {
  const v = parseFloat(prompt("Monthly budget (₹)?", state.budget));
  if (v >= 0) { state.budget = v; save(); render(); }
});

$("viewAll").addEventListener("click", () => { showAll = !showAll; render(); });

// ---------- 5. Start ----------
fillMonths();
fillCategories();
render();
