"use strict";

/* NIMBU + KITTO AI
   Routes: #/ #/tools #/tool/<slug> #/prompts #/compare #/favs #/ask
   Requires data.js, Supabase JS v2, and supabase.js loaded before this file.
*/

if (!window.NIMBU || !Array.isArray(window.NIMBU.tools) || !Array.isArray(window.NIMBU.prompts)) {
  throw new Error("NIMBU data did not load. Check that data.js is loaded before app.js.");
}

const { tools: TOOLS, prompts: PROMPTS } = window.NIMBU;
const $app = document.getElementById("app");
if (!$app) throw new Error('NIMBU app container "#app" was not found.');

const PAGE = 12;
let shown = PAGE;
let lastRoute = null;
let kittoBusy = false;
let io = null;
let typeTimer = null;

const reduce = !!(
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
);

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const load = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browser storage may be disabled or full. */
  }
};

const PRICE = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
  opensource: "Open source",
  unknown: "Pricing unknown"
};

const CATS = [...new Set(TOOLS.flatMap(t => Array.isArray(t.cats) ? t.cats : []))].sort();
const CAT_COUNT = {};
TOOLS.forEach(t => (t.cats || []).forEach(c => {
  CAT_COUNT[c] = (CAT_COUNT[c] || 0) + 1;
}));

let favTools = load("nimbu.favTools", []);
let favPrompts = load("nimbu.favPrompts", []);
let cmp = load("nimbu.cmp", []);
let chat = load("nimbu.chat", []);

/* Keep malformed local storage from breaking the app. */
if (!Array.isArray(favTools)) favTools = [];
if (!Array.isArray(favPrompts)) favPrompts = [];
if (!Array.isArray(cmp)) cmp = [];
if (!Array.isArray(chat)) chat = [];
chat = chat.filter(m => m && (m.r === "u" || m.r === "a") && typeof m.t === "string");

/* ---------- General helpers ---------- */

function toast(message) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

function updateCompareCount() {
  const el = document.getElementById("cmpCount");
  if (el) el.textContent = cmp.length ? `(${cmp.length})` : "";
}

function toggle(list, key, value) {
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
  save(key, list);
  updateCompareCount();
}

async function copy(text, message = "Copied!") {
  try {
    await navigator.clipboard.writeText(String(text));
    toast(message);
  } catch {
    toast("Copy blocked. Select the text and copy it manually.");
  }
}

/* ---------- Theme ---------- */

const themeSel = document.getElementById("theme");
const systemDark = !!(
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
);
const theme = load("nimbu.theme", systemDark ? "midnight" : "snow");
document.documentElement.dataset.theme = theme;
if (themeSel) themeSel.value = theme;

if (themeSel) {
  themeSel.addEventListener("change", () => {
    document.documentElement.dataset.theme = themeSel.value;
    save("nimbu.theme", themeSel.value);
  });
}

/* ---------- Search ---------- */

function searchTools({ q = "", cat = "", price = "", level = "", sort = "az" } = {}) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = TOOLS.filter(t => {
    const hay = [
      t.name || "",
      t.desc || "",
      (t.cats || []).join(" "),
      (t.tags || []).join(" "),
      PRICE[t.pricing] || ""
    ].join(" ").toLowerCase();

    return words.every(w => hay.includes(w)) &&
      (!cat || (t.cats || []).includes(cat)) &&
      (!price || t.pricing === price) &&
      (!level || t.level === level || t.level === "all");
  });

  list.sort((a, b) => {
    if (sort === "new") return String(b.added || "").localeCompare(String(a.added || ""));
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return list;
}

/* ---------- Tool and prompt cards ---------- */

function toolLogo(t, size = "") {
  let host = "";
  try {
    host = new URL(t.url).hostname;
  } catch {}

  const letter = esc((t.name || "?").charAt(0).toUpperCase());
  const img = host
    ? `<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128"
        alt="" width="44" height="44" loading="lazy" decoding="async"
        referrerpolicy="no-referrer" onerror="this.remove()">`
    : "";

  return `<span class="tlogo ${size}" aria-hidden="true">
    <span class="tlogo-fallback">${letter}</span>${img}
  </span>`;
}

function toolCard(t) {
  const fav = favTools.includes(t.slug);
  const inCmp = cmp.includes(t.slug);
  const category = (t.cats || [])[0] || "AI tool";
  const verified = t.status === "unverified"
    ? "Not yet verified"
    : "Verified " + esc(t.verified || "");

  return `<article class="card reveal">
    <div class="cardhead">
      ${toolLogo(t)}
      <h3><a href="#/tool/${encodeURIComponent(t.slug)}">${esc(t.name)}</a></h3>
    </div>
    <p>${esc(t.desc || "")}</p>
    <div>
      <span class="badge price">${PRICE[t.pricing] || PRICE.unknown}</span>
      <span class="badge">${esc(category)}</span>
      <span class="badge">${verified}</span>
    </div>
    <div class="row">
      <a class="btn small primary" href="${esc(t.url || "#")}" target="_blank" rel="noopener noreferrer">Open tool</a>
      <button type="button" class="small" data-act="fav" data-id="${esc(t.slug)}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button>
      <button type="button" class="small" data-act="cmp" data-id="${esc(t.slug)}" aria-pressed="${inCmp}">${inCmp ? "✓ Comparing" : "Compare"}</button>
      <button type="button" class="small" data-act="link" data-id="${esc(t.slug)}">Copy link</button>
    </div>
  </article>`;
}

function promptCard(p) {
  const fav = favPrompts.includes(p.id);
  return `<article class="card reveal">
    <h3>${esc(p.title)}</h3>
    <div>
      <span class="badge">${esc(p.cat || "")}</span>
      <span class="badge">${esc(p.level || "")}</span>
      <span class="badge">${esc((p.tools || []).join(", "))}</span>
    </div>
    <label>Edit before copying (replace the placeholders):
      <textarea id="ta-${esc(p.id)}">${esc(p.text || "")}</textarea>
    </label>
    <div class="row">
      <button type="button" class="small primary" data-act="copyp" data-id="${esc(p.id)}">Copy prompt</button>
      <button type="button" class="small" data-act="favp" data-id="${esc(p.id)}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button>
    </div>
  </article>`;
}

/* ---------- Home ---------- */

function home() {
  const pod = PROMPTS.length ? PROMPTS[new Date().getDate() % PROMPTS.length] : null;
  const pop = ["learn python", "presentation", "summarize pdf", "video clips", "automation"];
  const freeCount = TOOLS.filter(t => ["free", "freemium", "opensource"].includes(t.pricing)).length;
  const stat = (n, label) => `<div class="stat"><b data-count="${n}">${n}</b><span>${label}</span></div>`;

  return `<section class="hero">
    <h1>Find the <span class="grad">Perfect AI</span> for Anything.</h1>
    <p>NIMBU is an independent directory of AI tools. Search by task, filter by price, save favorites, and compare tools side by side.</p>
    <form class="searchrow" id="heroSearch">
      <div class="sbox">
        <input id="q" type="search" autocomplete="off" placeholder="What do you want to do with AI?" aria-label="Search AI tools">
        <div class="sugg" id="sugg" hidden></div>
      </div>
      <button class="primary">Search</button>
    </form>
    <div class="chips">${pop.map(p => `<a class="btn chip" href="#/tools?q=${encodeURIComponent(p)}">${esc(p)}</a>`).join("")}</div>
    <a class="btn primary" href="#/tools">Explore AI tools</a>
    <a class="btn" href="#/prompts">Discover prompts</a>
    <a class="btn" href="#/ask">✨ Try KITTO AI</a>
    <button type="button" class="btn" data-act="surprise">🎲 Surprise me</button>
  </section>
  <div class="stats">
    ${stat(TOOLS.length, "AI tools")}
    ${stat(CATS.length, "Categories")}
    ${stat(freeCount, "With a free option")}
    ${stat(PROMPTS.length, "Ready prompts")}
  </div>
  <p class="note">Directory size: <b>${TOOLS.length} starter tools</b>. Check official sites for current pricing and features.</p>
  <h2>Categories</h2>
  <div class="chips">${CATS.map(c => `<a class="btn chip" href="#/tools?cat=${encodeURIComponent(c)}">${esc(c)} <span class="cnt">${CAT_COUNT[c]}</span></a>`).join("")}</div>
  <h2>Recently added</h2>
  <div class="grid">${searchTools({ sort: "new" }).slice(0, 6).map(toolCard).join("")}</div>
  ${pod ? `<h2>Prompt of the day</h2><div class="grid">${promptCard(pod)}</div>` : ""}
  <h2>Meet KITTO AI</h2>
  <p>Ask questions, learn concepts, brainstorm ideas and get help with projects.</p>
  <a class="btn primary" href="#/ask">Open KITTO AI →</a>`;
}

/* ---------- Tools view ---------- */

function toolsView(params) {
  const f = {
    q: params.get("q") || "",
    cat: params.get("cat") || "",
    price: params.get("price") || "",
    level: params.get("level") || "",
    sort: params.get("sort") || "az"
  };
  const list = searchTools(f);
  const opts = (obj, cur) => Object.entries(obj).map(([v, label]) =>
    `<option value="${esc(v)}" ${cur === v ? "selected" : ""}>${esc(label)}</option>`
  ).join("");
  const active = ["q", "cat", "price", "level"].filter(k => f[k]).length;
  const quick = [["free", "Free"], ["freemium", "Freemium"], ["opensource", "Open source"]];

  return `<h1>AI tools</h1>
    <div class="chips">${quick.map(([v, label]) => `<a class="btn chip" href="#/tools?price=${v}">${label}</a>`).join("")}</div>
    <form id="filterForm">
      <input name="q" type="search" value="${esc(f.q)}" placeholder="Search name, task, tag, price" aria-label="Search" style="width:100%">
      <div class="filters">
        <select name="cat" aria-label="Category">
          <option value="">All categories</option>
          ${CATS.map(c => `<option value="${esc(c)}" ${f.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
        </select>
        <select name="price" aria-label="Pricing"><option value="">Any pricing</option>${opts(PRICE, f.price)}</select>
        <select name="level" aria-label="Skill level"><option value="">Any level</option>${opts({ beginner: "Beginner-friendly", pro: "Professional" }, f.level)}</select>
        <select name="sort" aria-label="Sort">${opts({ az: "A to Z", new: "Recently added" }, f.sort)}</select>
      </div>
      <button class="primary">Apply</button>
      ${active ? `<a class="btn" href="#/tools">Clear ${active} filter${active > 1 ? "s" : ""}</a>` : ""}
    </form>
    <p role="status">${list.length} of ${TOOLS.length} tools</p>
    ${list.length
      ? `<div class="grid">${list.slice(0, shown).map(toolCard).join("")}</div>${list.length > shown ? `<p><button type="button" data-act="more">Show more (${list.length - shown} left)</button></p>` : ""}`
      : `<div class="empty"><p>No tools match these filters.</p><a class="btn" href="#/tools">Clear filters</a></div>`}`;
}

/* ---------- Tool detail ---------- */

function detail(slug) {
  const t = TOOLS.find(x => x.slug === slug);
  if (!t) return `<div class="empty"><p>That tool is not in the directory.</p><a class="btn" href="#/tools">Browse tools</a></div>`;

  const recent = [slug, ...load("nimbu.recent", []).filter(s => s !== slug)].slice(0, 8);
  save("nimbu.recent", recent);

  const related = TOOLS.filter(x => x.slug !== slug && (x.cats || []).some(c => (t.cats || []).includes(c))).slice(0, 3);
  const fav = favTools.includes(slug);
  const inCmp = cmp.includes(slug);

  return `<a href="#/tools">← Back to tools</a>
    <h1 class="dhead">${toolLogo(t, "lg")}<span>${esc(t.name)}</span></h1>
    <p>${esc(t.desc || "")}</p>
    <p><span class="badge price">${PRICE[t.pricing] || PRICE.unknown}</span>
      ${(t.cats || []).map(c => `<span class="badge">${esc(c)}</span>`).join(" ")}
      ${(t.tags || []).map(c => `<span class="badge">${esc(c)}</span>`).join(" ")}
    </p>
    <p class="note">Check the official site for current pricing, features and limitations.</p>
    <div class="actions">
      <a class="btn primary" href="${esc(t.url || "#")}" target="_blank" rel="noopener noreferrer">Visit official site</a>
      <button type="button" data-act="fav" data-id="${esc(t.slug)}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button>
      <button type="button" data-act="cmp" data-id="${esc(t.slug)}" aria-pressed="${inCmp}">${inCmp ? "✓ Comparing" : "Compare"}</button>
      <button type="button" data-act="link" data-id="${esc(t.slug)}">Copy link</button>
    </div>
    <h2>Related tools</h2><div class="grid">${related.map(toolCard).join("") || "<p>None yet.</p>"}</div>`;
}

/* ---------- Compare ---------- */

function compareView() {
  const sel = cmp.map(s => TOOLS.find(t => t.slug === s)).filter(Boolean);
  if (sel.length < 2) return `<h1>Compare</h1><div class="empty"><p>Pick at least two tools with the Compare button.</p><a class="btn" href="#/tools">Browse tools</a></div>`;

  const row = (label, fn) => `<tr><th scope="row">${label}</th>${sel.map(t => `<td>${fn(t)}</td>`).join("")}</tr>`;
  return `<h1>Compare</h1><table>
    <tr><th></th>${sel.map(t => `<th><span class="cmphead">${toolLogo(t)}<span>${esc(t.name)}</span></span></th>`).join("")}</tr>
    ${row("Purpose", t => esc(t.desc || ""))}
    ${row("Pricing", t => PRICE[t.pricing] || PRICE.unknown)}
    ${row("Categories", t => esc((t.cats || []).join(", ")))}
    ${row("Tags", t => esc((t.tags || []).join(", ")))}
    ${row("Platforms", () => "Not verified")}
    ${row("Strengths", () => "Not verified")}
    ${row("Limitations", () => "Not verified")}
  </table><p><button type="button" data-act="clearcmp">Clear comparison</button></p>`;
}

/* ---------- Saved items ---------- */

function favsView() {
  const ft = favTools.map(s => TOOLS.find(t => t.slug === s)).filter(Boolean);
  const fp = PROMPTS.filter(p => favPrompts.includes(p.id));
  const rec = load("nimbu.recent", []).map(s => TOOLS.find(t => t.slug === s)).filter(Boolean);

  return `<h1>Saved</h1>
    <h2>Tools</h2>${ft.length ? `<div class="grid">${ft.map(toolCard).join("")}</div>` : `<p class="empty">Nothing saved yet.</p>`}
    <h2>Prompts</h2>${fp.length ? `<div class="grid">${fp.map(promptCard).join("")}</div>` : `<p class="empty">No saved prompts.</p>`}
    <h2>Recently viewed</h2>${rec.length ? `<div class="grid">${rec.map(toolCard).join("")}</div>` : `<p class="empty">Open a tool page to see it here.</p>`}`;
}

/* ---------- Prompt view ---------- */

function promptsView(params) {
  const q = (params.get("q") || "").toLowerCase();
  const cat = params.get("cat") || "";
  const cats = [...new Set(PROMPTS.map(p => p.cat))];
  const list = PROMPTS.filter(p =>
    (!cat || p.cat === cat) &&
    ((p.title || "") + (p.text || "") + (p.cat || "")).toLowerCase().includes(q)
  );

  return `<h1>Prompt Studio</h1>
    <p class="note">Tip: state your goal, skill level, desired format and any limits. Replace placeholders before copying.</p>
    <form id="promptForm" class="searchrow">
      <input name="q" type="search" value="${esc(q)}" placeholder="Search prompts" aria-label="Search prompts">
      <select name="cat" aria-label="Prompt category">
        <option value="">All</option>
        ${cats.map(c => `<option value="${esc(c)}" ${cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
      </select>
      <button class="primary">Go</button>
    </form>
    ${list.length ? `<div class="grid">${list.map(promptCard).join("")}</div>` : `<div class="empty">No prompts match.</div>`}`;
}

/* ---------- KITTO AI ---------- */

function askView() {
  const suggestions = [
    "Explain Python loops in simple words",
    "Help me build an AI startup",
    "Create a study plan for engineering"
  ];

  return `<section class="kitto">
    <h1>✨ KITTO AI</h1>
    <p class="note">Your AI assistant inside NIMBU, powered by Groq through Supabase.</p>
    <div class="chips">${suggestions.map(s => `<button type="button" class="chip" data-act="suggest">${esc(s)}</button>`).join("")}</div>
    <div class="chat" id="chat" aria-live="polite" aria-label="KITTO AI conversation">
      ${chat.map((m, i) => `<div class="msg ${m.r}">
        <b>${m.r === "u" ? "You" : "KITTO AI"}</b>
        <div class="kitto-text">${esc(m.t)}</div>
        ${m.r === "a" ? `<button type="button" class="small" data-act="copymsg" data-id="${i}">Copy</button>` : ""}
      </div>`).join("")}
    </div>
    <form class="searchrow" id="askForm">
      <input id="askIn" name="message" maxlength="4000" placeholder="Ask KITTO anything..." aria-label="Message KITTO AI" required ${kittoBusy ? "disabled" : ""}>
      <button class="primary" id="kittoSend" type="submit" ${kittoBusy ? "disabled" : ""}>${kittoBusy ? "Thinking..." : "Send"}</button>
    </form>
    <p class="note">AI can make mistakes. Verify important information.</p>
    <button type="button" class="small" data-act="clearchat" ${kittoBusy ? "disabled" : ""}>Clear conversation</button>
  </section>`;
}

async function send(text) {
  text = String(text || "").trim();
  if (!text || kittoBusy) return;

  if (text.length > 4000) {
    toast("Message is too long. Maximum 4000 characters.");
    return;
  }

  const client = window.NIMBU_SUPABASE;
  if (!client || !client.functions) {
    toast("Supabase did not load. Refresh NIMBU and try again.");
    return;
  }

  kittoBusy = true;
  chat.push(
    { r: "u", t: text },
    { r: "a", t: "KITTO AI is thinking..." }
  );
  const answerIndex = chat.length - 1;
  save("nimbu.chat", chat);
  render();

  try {
    const { data, error } = await client.functions.invoke("swift-endpoint", {
      body: { question: text }
    });

    if (error) {
      let detail = error.message || "The request failed.";
      try {
        if (error.context) {
          const response = await error.context.clone().json();
          if (response && response.error) detail = response.error;
        }
      } catch {}
      throw new Error(detail);
    }

    if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("The AI returned an empty answer.");
    }

    chat[answerIndex].t = data.answer;
  } catch (error) {
    console.error("KITTO AI error:", error);
    let message = error && error.message ? error.message : "Unknown error";
    if (/401|403|jwt|unauthorized|forbidden/i.test(message)) {
      message += " The function may require authentication. Do not disable security settings just to bypass this.";
    }
    chat[answerIndex].t = "Sorry, KITTO AI couldn't respond. Please try again.\n\nDetails: " + message;
  } finally {
    kittoBusy = false;
    save("nimbu.chat", chat);
    render();
    const input = document.getElementById("askIn");
    if (input) input.focus();
  }
}

/* ---------- Reveal animations ---------- */

function reveal(isNew) {
  if (io) io.disconnect();
  const els = $app.querySelectorAll(".reveal");

  if (!isNew || reduce || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("in", "instant"));
    return;
  }

  io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  els.forEach((el, i) => {
    el.style.setProperty("--d", (i % 6) * 60 + "ms");
    io.observe(el);
  });
}

function countUp() {
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = Number(el.dataset.count) || 0;
if (reduce || !end) {
      el.textContent = end;
      return;
    }

    el.textContent = "0";
    const start = performance.now();
    const duration = 900;

    const step = now => {
      const k = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function typewriter() {
  clearTimeout(typeTimer);
  if (reduce || !document.getElementById("q")) return;

  const phrases = [
    "Summarize a long PDF",
    "Learn Python from scratch",
    "Make a presentation fast",
    "Turn long videos into clips",
    "Automate boring tasks"
  ];
  let p = 0;
  let i = 0;
  let deleting = false;

  const tick = () => {
    const el = document.getElementById("q");
    if (!el) return;
    const word = phrases[p];
    i += deleting ? -1 : 1;

    if (document.activeElement !== el && !el.value) {
      el.placeholder = word.slice(0, i) || "\u00a0";
    }

    let delay = deleting ? 28 : 65;
    if (!deleting && i >= word.length) {
      deleting = true;
      delay = 1500;
    } else if (deleting && i <= 0) {
      deleting = false;
      p = (p + 1) % phrases.length;
      delay = 450;
    }
    typeTimer = setTimeout(tick, delay);
  };

  tick();
}

/* ---------- Back to top ---------- */

const topBtn = document.createElement("button");
topBtn.id = "totop";
topBtn.type = "button";
topBtn.setAttribute("aria-label", "Back to top");
topBtn.textContent = "↑";
document.body.appendChild(topBtn);

topBtn.onclick = () => window.scrollTo({
  top: 0,
  behavior: reduce ? "auto" : "smooth"
});

window.addEventListener("scroll", () => {
  topBtn.classList.toggle("show", window.scrollY > 600);
}, { passive: true });

/* ---------- Router ---------- */

function render() {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  const params = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);

  const route = parts[0] || "";
  const views = {
    "": () => home(),
    tools: () => toolsView(params),
    tool: () => detail(decodeURIComponent(parts[1] || "")),
    prompts: () => promptsView(params),
    compare: compareView,
    favs: favsView,
    ask: askView
  };

  $app.innerHTML = views[route]
    ? views[route]()
    : `<div class="empty"><p>Page not found.</p><a class="btn" href="#/">Go home</a></div>`;

  const isNew = location.hash !== lastRoute;
  lastRoute = location.hash;
  $app.classList.toggle("enter", isNew);

  const toolName = route === "tool"
    ? (TOOLS.find(t => t.slug === decodeURIComponent(parts[1] || ""))?.name || "Tool") + " | "
    : "";

  document.title = route === "ask" ? "KITTO AI | NIMBU" : toolName + "NIMBU";
  updateCompareCount();
  reveal(isNew);
  if (isNew) countUp();
  typewriter();

  const chatBox = document.getElementById("chat");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

window.addEventListener("hashchange", () => {
  shown = PAGE;
  render();
  window.scrollTo(0, 0);
});

/* ---------- Form submissions ---------- */

document.addEventListener("submit", event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();

  if (form.id === "heroSearch") {
    const input = form.querySelector("#q");
    location.hash = "#/tools?q=" + encodeURIComponent(input ? input.value.trim() : "");
  } else if (form.id === "filterForm" || form.id === "promptForm") {
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (value) params.set(key, value);
    });
    location.hash = (form.id === "filterForm" ? "#/tools?" : "#/prompts?") + params.toString();
  } else if (form.id === "askForm") {
    const input = form.querySelector("#askIn");
    const value = input ? input.value.trim() : "";
    if (value) send(value);
  }
});

/* ---------- Live hero search suggestions ---------- */

document.addEventListener("input", event => {
  if (event.target.id !== "q") return;
  const box = document.getElementById("sugg");
  if (!box) return;

  const value = event.target.value.trim();
  if (!value) {
    box.hidden = true;
    return;
  }

  const hits = searchTools({ q: value }).slice(0, 5);
  box.innerHTML = hits.length
    ? hits.map(t => `<a href="#/tool/${encodeURIComponent(t.slug)}">${toolLogo(t)}<span><b>${esc(t.name)}</b><small>${esc((t.cats || [])[0] || "")}</small></span></a>`).join("")
    : `<div class="sugg-empty">No matches. Press Search to try anyway.</div>`;
  box.hidden = false;
});

/* ---------- Click actions ---------- */

document.addEventListener("click", event => {
  if (!event.target.closest(".sbox")) {
    const suggestions = document.getElementById("sugg");
    if (suggestions) suggestions.hidden = true;
  }

  const button = event.target.closest("[data-act]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.act;

  if (action === "fav") {
    toggle(favTools, "nimbu.favTools", id);
  } else if (action === "cmp") {
    if (!cmp.includes(id) && cmp.length >= 4) {
      toast("Compare up to four tools at a time.");
      return;
    }
    toggle(cmp, "nimbu.cmp", id);
  } else if (action === "favp") {
    toggle(favPrompts, "nimbu.favPrompts", id);
  } else if (action === "link") {
    return copy(location.href.split("#")[0] + "#/tool/" + encodeURIComponent(id), "Link copied");
  } else if (action === "copyp") {
    const textarea = document.getElementById("ta-" + CSS.escape(id));
    if (textarea) return copy(textarea.value, "Prompt copied");
  } else if (action === "copymsg") {
    const message = chat[Number(id)];
    if (message) return copy(message.t, "Message copied");
  } else if (action === "more") {
    shown += PAGE;
  } else if (action === "clearcmp") {
    cmp = [];
    save("nimbu.cmp", cmp);
  } else if (action === "clearchat") {
    if (kittoBusy) {
      toast("Wait until KITTO AI finishes responding.");
      return;
    }
    chat = [];
    save("nimbu.chat", chat);
  } else if (action === "suggest") {
    if (kittoBusy) return;
    return send(button.textContent);
  } else if (action === "surprise") {
    const t = TOOLS[Math.floor(Math.random() * TOOLS.length)];
    if (t) location.hash = "#/tool/" + encodeURIComponent(t.slug);
    return;
  }

  render();
});

/* ---------- Keyboard shortcuts ---------- */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const suggestions = document.getElementById("sugg");
    if (suggestions) suggestions.hidden = true;
  }

  if (
    event.key === "/" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")
  ) {
    const input = document.querySelector('input[type="search"]');
    if (input) {
      event.preventDefault();
      input.focus();
    }
  }
});

window.render = render;
render();
