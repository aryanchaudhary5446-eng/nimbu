"use strict";

/* NIMBU app. Hash routes: #/ #/tools?q=&cat=&price= #/tool/<slug> #/prompts #/compare #/favs #/ask */
const { tools: TOOLS, prompts: PROMPTS } = window.NIMBU;
const $app = document.getElementById("app");
const PAGE = 12;
let shown = PAGE;
let lastRoute = null;
const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

/* ---------- helpers ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
const PRICE = { free: "Free", freemium: "Freemium", paid: "Paid", opensource: "Open source", unknown: "Pricing unknown" };
const CATS = [...new Set(TOOLS.flatMap(t => t.cats))].sort();
const CAT_COUNT = {};
TOOLS.forEach(t => t.cats.forEach(c => { CAT_COUNT[c] = (CAT_COUNT[c] || 0) + 1; }));
let favTools = load("nimbu.favTools", []), favPrompts = load("nimbu.favPrompts", []), cmp = load("nimbu.cmp", []);
let chat = load("nimbu.chat", []);

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}
function toggle(list, key, val) {
  const i = list.indexOf(val);
  i >= 0 ? list.splice(i, 1) : list.push(val);
  save(key, list);
  document.getElementById("cmpCount").textContent = cmp.length ? `(${cmp.length})` : "";
}
async function copy(text, ok) {
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch { toast("Copy blocked. Select the text and copy it manually."); }
}

/* ---------- theme ---------- */
const themeSel = document.getElementById("theme");
const systemDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
const theme = load("nimbu.theme", systemDark ? "midnight" : "snow");
document.documentElement.dataset.theme = theme; themeSel.value = theme;
themeSel.onchange = () => { document.documentElement.dataset.theme = themeSel.value; save("nimbu.theme", themeSel.value); };

/* ---------- search ---------- */
function searchTools({ q = "", cat = "", price = "", level = "", sort = "az" }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let list = TOOLS.filter(t => {
    const hay = [t.name, t.desc, t.cats.join(" "), t.tags.join(" "), PRICE[t.pricing]].join(" ").toLowerCase();
    return words.every(w => hay.includes(w)) && (!cat || t.cats.includes(cat)) &&
      (!price || t.pricing === price) && (!level || t.level === level || t.level === "all");
  });
  list.sort((a, b) => sort === "new" ? b.added.localeCompare(a.added) : a.name.localeCompare(b.name));
  return list;
}

/* ---------- components ---------- */
/* Logo = the tool website's icon (Google favicon service). Letter badge shows if it fails. */
function toolLogo(t, size = "") {
  let host = "";
  try { host = new URL(t.url).hostname; } catch { /* bad url */ }
  const letter = esc((t.name || "?").charAt(0).toUpperCase());
  const img = host
    ? `<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128" alt="" width="44" height="44" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
    : "";
  return `<span class="tlogo ${size}" aria-hidden="true"><span class="tlogo-fallback">${letter}</span>${img}</span>`;
}

function toolCard(t) {
  const fav = favTools.includes(t.slug), inCmp = cmp.includes(t.slug);
  return `<article class="card reveal">
    <div class="cardhead">${toolLogo(t)}<h3><a href="#/tool/${t.slug}">${esc(t.name)}</a></h3></div>
    <p>${esc(t.desc)}</p>
    <div><span class="badge price">${PRICE[t.pricing]}</span> <span class="badge">${esc(t.cats[0])}</span> <span class="badge">${t.status === "unverified" ? "Not yet verified" : "Verified " + esc(t.verified)}</span></div>
    <div class="row">
      <a class="btn small primary" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Open tool</a>
      <button class="small" data-act="fav" data-id="${t.slug}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button>
      <button class="small" data-act="cmp" data-id="${t.slug}" aria-pressed="${inCmp}">${inCmp ? "✓ Comparing" : "Compare"}</button>
      <button class="small" data-act="link" data-id="${t.slug}">Copy link</button>
    </div></article>`;
}
function promptCard(p) {
  const fav = favPrompts.includes(p.id);
  return `<article class="card reveal"><h3>${esc(p.title)}</h3>
    <div><span class="badge">${esc(p.cat)}</span> <span class="badge">${esc(p.level)}</span> <span class="badge">${esc(p.tools.join(", "))}</span></div>
    <label>Edit before copying (replace the [PLACEHOLDERS]):<textarea id="ta-${p.id}">${esc(p.text)}</textarea></label>
    <div class="row"><button class="small primary" data-act="copyp" data-id="${p.id}">Copy prompt</button>
    <button class="small" data-act="favp" data-id="${p.id}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button></div></article>`;
}

/* ---------- views ---------- */
function home() {
  const pod = PROMPTS[new Date().getDate() % PROMPTS.length];
  const pop = ["learn python", "presentation", "summarize pdf", "video clips", "automation"];
  const freeCount = TOOLS.filter(t => ["free", "freemium", "opensource"].includes(t.pricing)).length;
  const stat = (n, label) => `<div class="stat"><b data-count="${n}">${n}</b><span>${label}</span></div>`;
  return `<section class="hero"><h1>Find the <span class="grad">Perfect AI</span> for Anything.</h1>
    <p>NIMBU is an independent directory of AI tools. Search by task, filter by price, save favorites, and compare tools side by side.</p>
    <form class="searchrow" id="heroSearch"><div class="sbox"><input id="q" type="search" autocomplete="off" placeholder="What do you want to do with AI?" aria-label="Search AI tools"><div class="sugg" id="sugg" hidden></div></div>
    <button class="primary">Search</button></form>
    <div class="chips">${pop.map(p => `<a class="btn chip" href="#/tools?q=${encodeURIComponent(p)}">${p}</a>`).join("")}</div>
    <a class="btn primary" href="#/tools">Explore AI tools</a> <a class="btn" href="#/prompts">Discover prompts</a> <button type="button" class="btn" data-act="surprise">🎲 Surprise me</button></section>
    <div class="stats">${stat(TOOLS.length, "AI tools")}${stat(CATS.length, "Categories")}${stat(freeCount, "With a free option")}${stat(PROMPTS.length, "Ready prompts")}</div>
    <p class="note">Directory size: <b>${TOOLS.length} starter tools</b>. None are marked verified yet; each needs a human check of its official site. NIMBU does not show ratings or trending data because no real data source is connected.</p>
    <h2>Categories</h2><div class="chips">${CATS.map(c => `<a class="btn chip" href="#/tools?cat=${encodeURIComponent(c)}">${esc(c)} <span class="cnt">${CAT_COUNT[c]}</span></a>`).join("")}</div>
    <h2>Recently added</h2><div class="grid">${searchTools({ sort: "new" }).slice(0, 6).map(toolCard).join("")}</div>
    <h2>Prompt of the day</h2><div class="grid">${promptCard(pod)}</div>
    <h2>Ask NIMBU</h2><p>Describe your task and get tools from this directory. <a href="#/ask">Open the assistant (demo mode)</a></p>`;
}

function toolsView(params) {
  const f = { q: params.get("q") || "", cat: params.get("cat") || "", price: params.get("price") || "", level: params.get("level") || "", sort: params.get("sort") || "az" };
  const list = searchTools(f);
  const opts = (obj, cur) => Object.entries(obj).map(([v, l]) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`).join("");
  const active = ["q", "cat", "price", "level"].filter(k => f[k]).length;
  const quick = [["free", "Free"], ["freemium", "Freemium"], ["opensource", "Open source"]];
  return `<h1>AI tools</h1>
    <div class="chips">${quick.map(([v, l]) => `<a class="btn chip" href="#/tools?price=${v}">${l}</a>`).join("")}</div>
    <form id="filterForm"><input name="q" type="search" value="${esc(f.q)}" placeholder="Search name, task, tag, price" aria-label="Search" style="width:100%">
    <div class="filters">
      <select name="cat" aria-label="Category"><option value="">All categories</option>${CATS.map(c => `<option ${f.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <select name="price" aria-label="Pricing"><option value="">Any pricing</option>${opts(PRICE, f.price)}</select>
      <select name="level" aria-label="Skill level"><option value="">Any level</option>${opts({ beginner: "Beginner-friendly", pro: "Professional" }, f.level)}</select>
      <select name="sort" aria-label="Sort">${opts({ az: "A to Z", new: "Recently added" }, f.sort)}</select>
    </div><button class="primary">Apply</button> ${active ? `<a class="btn" href="#/tools">Clear ${active} filter${active > 1 ? "s" : ""}</a>` : ""}</form>
    <p role="status">${list.length} of ${TOOLS.length} tools</p>
    ${list.length ? `<div class="grid">${list.slice(0, shown).map(toolCard).join("")}</div>
      ${list.length > shown ? `<p><button data-act="more">Show more (${list.length - shown} left)</button></p>` : ""}`
      : `<div class="empty"><p>No tools match these filters.</p><a class="btn" href="#/tools">Clear filters</a></div>`}`;
}

function detail(slug) {
  const t = TOOLS.find(x => x.slug === slug);
  if (!t) return `<div class="empty"><p>That tool is not in the directory.</p><a class="btn" href="#/tools">Browse tools</a></div>`;
  const recent = [slug, ...load("nimbu.recent", []).filter(s => s !== slug)].slice(0, 8); save("nimbu.recent", recent);
  const related = TOOLS.filter(x => x.slug !== slug && x.cats.some(c => t.cats.includes(c))).slice(0, 3);
  const fav = favTools.includes(slug), inCmp = cmp.includes(slug);
  return `<a href="#/tools">Back to tools</a><h1 class="dhead">${toolLogo(t, "lg")}<span>${esc(t.name)}</span></h1><p>${esc(t.desc)}</p>
    <p><span class="badge price">${PRICE[t.pricing]}</span> ${t.cats.map(c => `<span class="badge">${esc(c)}</span>`).join(" ")} ${t.tags.map(c => `<span class="badge">${esc(c)}</span>`).join(" ")}</p>
    <p class="note">Status: ${t.status}. Features, limitations, and platforms are not recorded yet, so none are shown. Check pricing on the official site.</p>
    <div class="actions">
      <a class="btn primary" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Visit official site</a>
      <button data-act="fav" data-id="${t.slug}" aria-pressed="${fav}">${fav ? "★ Saved" : "☆ Save"}</button>
      <button data-act="cmp" data-id="${t.slug}" aria-pressed="${inCmp}">${inCmp ? "✓ Comparing" : "Compare"}</button>
      <button data-act="link" data-id="${t.slug}">Copy link</button>
    </div>
    <h2>Related tools</h2><div class="grid">${related.map(toolCard).join("") || "<p>None yet.</p>"}</div>`;
}

function compareView() {
  const sel = cmp.map(s => TOOLS.find(t => t.slug === s)).filter(Boolean);
  if (sel.length < 2) return `<h1>Compare</h1><div class="empty"><p>Pick at least two tools with the Compare button.</p><a class="btn" href="#/tools">Browse tools</a></div>`;
  const row = (label, fn) => `<tr><th scope="row">${label}</th>${sel.map(t => `<td>${fn(t)}</td>`).join("")}</tr>`;
  return `<h1>Compare</h1><table><tr><th></th>${sel.map(t => `<th><span class="cmphead">${toolLogo(t)}<span>${esc(t.name)}</span></span></th>`).join("")}</tr>
    ${row("Purpose", t => esc(t.desc))}${row("Pricing", t => PRICE[t.pricing])}${row("Categories", t => esc(t.cats.join(", ")))}
    ${row("Tags", t => esc(t.tags.join(", ")))}${row("Platforms", () => "Not verified")}${row("Strengths", () => "Not verified")}${row("Limitations", () => "Not verified")}</table>
    <p><button data-act="clearcmp">Clear comparison</button></p>`;
}

function favsView() {
  const ft = favTools.map(s => TOOLS.find(t => t.slug === s)).filter(Boolean), fp = PROMPTS.filter(p => favPrompts.includes(p.id));
  const rec = load("nimbu.recent", []).map(s => TOOLS.find(t => t.slug === s)).filter(Boolean);
  return `<h1>Saved</h1><h2>Tools</h2>${ft.length ? `<div class="grid">${ft.map(toolCard).join("")}</div>` : `<p class="empty">Nothing saved yet.</p>`}
    <h2>Prompts</h2>${fp.length ? `<div class="grid">${fp.map(promptCard).join("")}</div>` : `<p class="empty">No saved prompts.</p>`}
    <h2>Recently viewed</h2>${rec.length ? `<div class="grid">${rec.map(toolCard).join("")}</div>` : `<p class="empty">Open a tool page to see it here.</p>`}`;
}

function promptsView(params) {
  const q = (params.get("q") || "").toLowerCase(), cat = params.get("cat") || "";
  const cats = [...new Set(PROMPTS.map(p => p.cat))];
  const list = PROMPTS.filter(p => (!cat || p.cat === cat) && (p.title + p.text + p.cat).toLowerCase().includes(q));
  return `<h1>Prompt Studio</h1><p class="note">Beginner tip: state the goal, your skill level, the format you want, and any limits. Replace each [PLACEHOLDER] before you copy.</p>
    <form id="promptForm" class="searchrow"><input name="q" type="search" value="${esc(q)}" placeholder="Search prompts" aria-label="Search prompts">
    <select name="cat" aria-label="Prompt category"><option value="">All</option>${cats.map(c => `<option ${cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><button class="primary">Go</button></form>
    ${list.length ? `<div class="grid">${list.map(promptCard).join("")}</div>` : `<div class="empty">No prompts match.</div>`}`;
}

/* Demo assistant: keyword matching over the directory. NOT a live AI model. */
function demoReply(text) {
  const hits = searchTools({ q: "" }).map(t => {
    const hay = (t.name + " " + t.desc + " " + t.tags.join(" ") + " " + t.cats.join(" ")).toLowerCase();
    return { t, s: text.toLowerCase().split(/\W+/).filter(w => w.length > 2 && hay.includes(w)).length };
  }).filter(h => h.s).sort((a, b) => b.s - a.s).slice(0, 3);
  if (!hits.length) return "I found no matching tools in the directory. Try words like \"video\", \"coding\", \"pdf\", or \"research\".";
  return "Closest matches by keyword:\n" + hits.map(h => `• ${h.t.name} (${PRICE[h.t.pricing]}): ${h.t.desc}`).join("\n") + "\nOpen a tool page to check current pricing and features.";
}
function askView() {
  const sug = ["Which AI is best for learning Python?", "Find AI tools that can summarize PDFs", "Free AI tools for making presentations"];
  return `<h1>Ask NIMBU</h1><p class="note"><b>Demo mode.</b> Replies come from simple keyword matching on the directory, not from a live AI model. A real model needs a backend (POST /api/chat) so the API key stays secret.</p>
    <div class="chips">${sug.map(s => `<button class="chip" data-act="suggest">${s}</button>`).join("")}</div>
    <div class="chat" id="chat">${chat.map((m, i) => `<div class="msg ${m.r}">${esc(m.t)}${m.r === "a" ? `<br><button class="small" data-act="copymsg" data-id="${i}">Copy</button>` : ""}</div>`).join("")}</div>
    <form class="searchrow" id="askForm"><input id="askIn" maxlength="500" placeholder="Describe your task" aria-label="Message"><button class="primary">Send</button></form>
    <button class="small" data-act="clearchat">Clear conversation</button>`;
}

/* ---------- motion helpers ---------- */
let io = null;
function reveal(isNew) {
  if (io) io.disconnect();
  const els = $app.querySelectorAll(".reveal");
  if (!isNew || reduce || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("in", "instant"));
    return;
  }
  io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((el, i) => { el.style.setProperty("--d", (i % 6) * 60 + "ms"); io.observe(el); });
}

function countUp() {
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = Number(el.dataset.count) || 0;
    if (reduce || !end) { el.textContent = end; return; }
    el.textContent = "0";
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

let typeTimer = null;
function typewriter() {
  clearTimeout(typeTimer);
  if (reduce || !document.getElementById("q")) return;
  const phrases = ["Summarize a long PDF", "Learn Python from scratch", "Make a presentation fast", "Turn long videos into clips", "Automate boring tasks"];
  let p = 0, i = 0, del = false;
  const tick = () => {
    const el = document.getElementById("q");
    if (!el) return;
    const word = phrases[p];
    i += del ? -1 : 1;
    if (document.activeElement !== el && !el.value) el.placeholder = word.slice(0, i) || "\u00a0";
    let delay = del ? 28 : 65;
    if (!del && i >= word.length) { del = true; delay = 1500; }
    else if (del && i <= 0) { del = false; p = (p + 1) % phrases.length; delay = 450; }
    typeTimer = setTimeout(tick, delay);
  };
  tick();
}

/* Back-to-top button */
const topBtn = document.createElement("button");
topBtn.id = "totop"; topBtn.type = "button"; topBtn.setAttribute("aria-label", "Back to top"); topBtn.textContent = "↑";
document.body.appendChild(topBtn);
topBtn.onclick = () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
window.addEventListener("scroll", () => topBtn.classList.toggle("show", window.scrollY > 600), { passive: true });

/* ---------- router ---------- */
function render() {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  const params = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  const view = { "": () => home(), tools: () => toolsView(params), tool: () => detail(parts[1]), prompts: () => promptsView(params), compare: compareView, favs: favsView, ask: askView }[parts[0] || ""];
  $app.innerHTML = view ? view() : `<div class="empty"><p>Page not found.</p><a class="btn" href="#/">Go home</a></div>`;
  const isNew = location.hash !== lastRoute; lastRoute = location.hash;
  $app.classList.toggle("enter", isNew);
  document.title = (parts[0] === "tool" ? (TOOLS.find(t => t.slug === parts[1])?.name || "Tool") + " | " : "") + "NIMBU";
  document.getElementById("cmpCount").textContent = cmp.length ? `(${cmp.length})` : "";
  reveal(isNew);
  if (isNew) countUp();
  typewriter();
}
window.addEventListener("hashchange", () => { shown = PAGE; render(); window.scrollTo(0, 0); });

/* ---------- events ---------- */
document.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === "heroSearch") location.hash = "#/tools?q=" + encodeURIComponent(f.q.value.trim());
  else if (f.id === "filterForm" || f.id === "promptForm") {
    const p = new URLSearchParams(); new FormData(f).forEach((v, k) => v && p.set(k, v));
    location.hash = (f.id === "filterForm" ? "#/tools?" : "#/prompts?") + p;
  } else if (f.id === "askForm") {
    const v = f.askIn.value.trim(); if (v) send(v);
  }
});
function send(text) {
  chat.push({ r: "u", t: text.slice(0, 500) }, { r: "a", t: demoReply(text) });
  save("nimbu.chat", chat); render();
}

/* Live suggestions under the hero search box */
document.addEventListener("input", e => {
  if (e.target.id !== "q") return;
  const box = document.getElementById("sugg"); if (!box) return;
  const v = e.target.value.trim();
  if (!v) { box.hidden = true; return; }
  const hits = searchTools({ q: v }).slice(0, 5);
  box.innerHTML = hits.length
    ? hits.map(t => `<a href="#/tool/${t.slug}">${toolLogo(t)}<span><b>${esc(t.name)}</b><small>${esc(t.cats[0])}</small></span></a>`).join("")
    : `<div class="sugg-empty">No matches. Press Search to try anyway.</div>`;
  box.hidden = false;
});

document.addEventListener("click", e => {
  if (!e.target.closest(".sbox")) { const s = document.getElementById("sugg"); if (s) s.hidden = true; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const id = b.dataset.id, act = b.dataset.act;
  if (act === "fav") toggle(favTools, "nimbu.favTools", id);
  else if (act === "cmp") toggle(cmp, "nimbu.cmp", id);
  else if (act === "favp") toggle(favPrompts, "nimbu.favPrompts", id);
  else if (act === "link") return copy(location.href.split("#")[0] + "#/tool/" + id, "Link copied");
  else if (act === "copyp") return copy(document.getElementById("ta-" + id).value, "Prompt copied");
  else if (act === "copymsg") return copy(chat[id].t, "Reply copied");
  else if (act === "more") shown += PAGE;
  else if (act === "clearcmp") { cmp = []; save("nimbu.cmp", cmp); }
  else if (act === "clearchat") { chat = []; save("nimbu.chat", chat); }
  else if (act === "suggest") return send(b.textContent);
  else if (act === "surprise") {
    const t = TOOLS[Math.floor(Math.random() * TOOLS.length)];
    if (t) location.hash = "#/tool/" + t.slug;
    return;
  }
  render();
});

/* Press "/" to focus the first search box, Esc closes suggestions */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { const s = document.getElementById("sugg"); if (s) s.hidden = true; }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    const i = document.querySelector("input[type=search]"); if (i) { e.preventDefault(); i.focus(); }
  }
});
window.render = render;
render();