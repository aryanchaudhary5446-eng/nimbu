"use strict";
/* NIMBU features add-on. Load AFTER app.js. */
(() => {
const FORM_URL = "https://formspree.io/f/moejlzla"; // later: make a 2nd Formspree form for suggestions and paste its link here
const FREE = ["free", "freemium", "opensource"];

/* ---------- helpers ---------- */
const hayOf = t => [t.name, t.desc, (t.cats || []).join(" "), (t.tags || []).join(" ")].join(" ").toLowerCase();
const scoreBy = (t, kws) => { const h = hayOf(t); return kws.reduce((n, k) => n + (h.includes(k) ? 1 : 0), 0); };
const okFilters = (t, free, beginner) => (!free || FREE.includes(t.pricing)) && (!beginner || t.level === "beginner" || t.level === "all");
function rank(kws, { audId = "", free = false, beginner = false, limit = 12 } = {}) {
  return TOOLS.filter(t => okFilters(t, free, beginner))
    .map(t => ({ t, s: scoreBy(t, kws) + ((t.aud || []).includes(audId) ? 5 : 0) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))
    .slice(0, limit).map(x => x.t);
}
const grid = list => list.length
  ? `<div class="grid">${list.map(toolCard).join("")}</div>`
  : `<div class="empty"><p>No matching tools yet. Add more tools or tags in data.js.</p></div>`;

/* ---------- audiences ---------- */
const AUD = {
  students: { icon: "🎓", name: "Students", blurb: "Study smarter, write better and prepare for exams.", kw: ["study", "learn", "notes", "essay", "homework", "summar", "flashcard", "quiz", "tutor", "exam", "write"] },
  teachers: { icon: "📚", name: "Teachers", blurb: "Plan lessons, make quizzes and save hours every week.", kw: ["lesson", "quiz", "teach", "worksheet", "slides", "presentation", "assess", "grading", "education", "write"] },
  schools: { icon: "🏫", name: "Schools", blurb: "Tools for classrooms and administration. Check each tool's privacy and age rules first.", kw: ["education", "school", "teach", "student", "translate", "automation", "communication", "schedule", "productivity"] },
  universities: { icon: "🏛️", name: "Universities", blurb: "Research, academic writing, data work and coding support.", kw: ["research", "paper", "citation", "academic", "thesis", "literature", "data", "code", "summar", "write"] },
  startups: { icon: "🚀", name: "Startups", blurb: "Build, market and automate with a small team and budget.", kw: ["marketing", "automation", "sales", "code", "design", "video", "customer", "analytics", "pitch", "presentation", "productivity", "workflow"] }
};
const audTiles = () => Object.entries(AUD).map(([k, a]) =>
  `<a class="aud" href="#/for/${k}"><span class="ai">${a.icon}</span><b>${a.name}</b><small>${esc(a.blurb)}</small></a>`).join("");

function hubView(parts) {
  const id = parts[1];
  if (!id) return `<h1>Choose your path</h1><p>Curated starting points for every kind of learner and builder.</p>
    <div class="aud-grid">${audTiles()}</div>
    <h2>More from NIMBU</h2><div class="chips">
    <a class="btn chip" href="#/find">🧭 Find my AI</a><a class="btn chip" href="#/toolkit">🧰 Education toolkit</a>
    <a class="btn chip" href="#/collections">📚 Collections</a><a class="btn chip" href="#/safety">🛡️ School safety checklist</a>
    <a class="btn chip" href="#/suggest">➕ Suggest a tool</a></div>`;
  const a = AUD[id];
  if (!a) return `<div class="empty"><p>That page does not exist.</p><a class="btn" href="#/for">See all paths</a></div>`;
  const tools = rank(a.kw, { audId: id });
  const prompts = PROMPTS.filter(p => a.kw.some(k => (p.title + " " + p.cat + " " + p.text).toLowerCase().includes(k))).slice(0, 3);
  return `<a href="#/for">All paths</a><h1>${a.icon} For ${a.name}</h1><p>${esc(a.blurb)}</p>
    ${id === "schools" || id === "teachers" ? `<p class="note">Before using any tool with students, read the <a href="#/safety">school safety checklist</a>.</p>` : ""}
    <h2>Recommended tools</h2>${grid(tools)}
    <h2>Prompts to try</h2>${prompts.length ? `<div class="grid">${prompts.map(promptCard).join("")}</div>` : `<p class="empty">No prompts match yet.</p>`}
    <p><a class="btn primary" href="#/toolkit">🧰 Open the education toolkit</a></p>`;
}

/* ---------- Find my AI wizard ---------- */
const GOALS = [
  { id: "write", label: "✍️ Write & edit", kw: ["write", "essay", "grammar", "edit", "content", "copy"] },
  { id: "study", label: "📖 Study & learn", kw: ["study", "learn", "flashcard", "quiz", "tutor", "exam", "notes"] },
  { id: "summarize", label: "📄 Summarize & read", kw: ["summar", "pdf", "read", "notes", "document"] },
  { id: "present", label: "📊 Slides", kw: ["presentation", "slides", "deck", "pitch"] },
  { id: "code", label: "💻 Code", kw: ["code", "coding", "developer", "programming", "python"] },
  { id: "image", label: "🎨 Images & design", kw: ["image", "design", "art", "photo", "logo"] },
  { id: "video", label: "🎬 Video & audio", kw: ["video", "clip", "audio", "voice", "music"] },
  { id: "research", label: "🔎 Research", kw: ["research", "paper", "citation", "academic", "search"] },
  { id: "automate", label: "⚙️ Automate work", kw: ["automation", "workflow", "agent", "productivity", "schedule"] }
];
let wiz = { who: "", goal: "", budget: "", level: "" };

function findView() {
  const row = (k, items, cur) => `<div class="optrow">${items.map(([v, l]) =>
    `<button type="button" class="opt" data-nf="wz" data-k="${k}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
  const who = Object.entries(AUD).map(([k, a]) => [k, `${a.icon} ${a.name}`]);
  const goals = GOALS.map(g => [g.id, g.label]);
  const g = GOALS.find(x => x.id === wiz.goal);
  let out = `<p class="note">Pick a goal to see matches.</p>`;
  if (g) {
    const aud = wiz.who ? AUD[wiz.who] : null;
    const list = TOOLS.filter(t => scoreBy(t, g.kw) > 0 && okFilters(t, wiz.budget === "free", wiz.level === "beginner"))
      .map(t => ({ t, s: scoreBy(t, g.kw) * 2 + (aud ? scoreBy(t, aud.kw) + ((t.aud || []).includes(wiz.who) ? 5 : 0) : 0) }))
      .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name)).slice(0, 6).map(x => x.t);
    out = `<h2>Your matches</h2>${list.length ? grid(list) : `<div class="empty"><p>No match yet. Try "Any budget" or another goal.</p></div>`}
      <p class="note">Matches use keywords from NIMBU's own tool data. Check pricing and privacy on each official site.</p>`;
  }
  return `<h1>Find my AI</h1><p>Four quick taps. No sign-up, and nothing is sent anywhere.</p>
    <p class="step">1. Who are you? (optional)</p>${row("who", who, wiz.who)}
    <p class="step">2. What do you want to do?</p>${row("goal", goals, wiz.goal)}
    <p class="step">3. Budget</p>${row("budget", [["free", "Free or freemium only"], ["any", "Any budget"]], wiz.budget)}
    <p class="step">4. Experience</p>${row("level", [["beginner", "Beginner-friendly"], ["pro", "Comfortable with tech"]], wiz.level)}
    <p><button type="button" class="small" data-nf="wzreset">Start over</button></p>${out}`;
}

/* ---------- Education toolkit (prompt builder) ---------- */
const F = {
  subject: ["Subject", "e.g. Science"], topic: ["Topic", "e.g. Photosynthesis"], grade: ["Class / grade", "e.g. Class 8"],
  mins: ["Minutes", "e.g. 40"], goal: ["Learning goal", "e.g. explain how plants make food"], count: ["Number of questions", "e.g. 10"],
  exam: ["Exam or subject", "e.g. JEE Main Physics"], days: ["Days left", "e.g. 30"], hours: ["Hours per day", "e.g. 3"],
  weak: ["Weak areas", "e.g. Mechanics"], level: ["My level", "e.g. Class 9"], idea: ["Startup idea", "e.g. a study-notes app"],
  customer: ["Target customer", "e.g. college students"]
};
const p = (v, k) => ((v[k] || "").trim() || `[${F[k][0]}]`);
const TPL = {
  lesson: { name: "Lesson plan", keys: ["subject", "topic", "grade", "mins", "goal"], build: v =>
    `Act as an experienced ${p(v, "subject")} teacher. Create a ${p(v, "mins")}-minute lesson plan on "${p(v, "topic")}" for ${p(v, "grade")}.\nLearning goal: ${p(v, "goal")}.\nInclude: a warm-up question, step-by-step activities with timings, one check-for-understanding question, and a short homework task.\nUse simple language and keep it practical for a classroom with limited resources.` },
  quiz: { name: "Quiz maker", keys: ["subject", "topic", "grade", "count"], build: v =>
    `Create ${p(v, "count")} multiple-choice questions on "${p(v, "topic")}" (${p(v, "subject")}) for ${p(v, "grade")}.\nMix easy, medium and hard questions. Give 4 options each, mark the correct answer and add a one-line explanation.\nFinish with 2 short-answer questions.` },
  study: { name: "Study plan", keys: ["exam", "days", "hours", "weak"], build: v =>
    `Act as a study coach. Build a ${p(v, "days")}-day study plan for ${p(v, "exam")}.\nI can study ${p(v, "hours")} hours per day. My weak areas: ${p(v, "weak")}.\nGive a day-by-day table with topics, revision slots and one practice test every 5 days. Keep it realistic and include rest time.` },
  explain: { name: "Explain simply", keys: ["topic", "level"], build: v =>
    `Explain "${p(v, "topic")}" to me as if I am in ${p(v, "level")}.\nUse one everyday example, then give a 3-point summary, then ask me 3 questions to test my understanding.` },
  pitch: { name: "Startup outline", keys: ["idea", "customer"], build: v =>
    `Act as a blunt startup mentor. My idea: ${p(v, "idea")}. Target customer: ${p(v, "customer")}.\nWrite a one-page outline: the problem, the solution, the target customer, how to get the first 100 users for free, and the 3 biggest risks.\nPoint out weaknesses honestly.` }
};
let tpl = "lesson"; const tkVals = {};

function toolkitView() {
  const T = TPL[tpl];
  const chips = Object.entries(TPL).map(([k, t]) => `<button type="button" class="opt" data-nf="tpl" data-v="${k}" aria-pressed="${k === tpl}">${t.name}</button>`).join("");
  const fields = T.keys.map(k => `<label>${F[k][0]}<input data-nf="tkf" data-k="${k}" value="${esc(tkVals[k] || "")}" placeholder="${esc(F[k][1])}"></label>`).join("");
  return `<h1>🧰 Education toolkit</h1><p>Fill the boxes and copy a ready-made prompt. Paste it into any AI tool you like. Nothing you type here is sent anywhere.</p>
    <div class="optrow">${chips}</div><div class="fgrid">${fields}</div>
    <textarea id="tkOut" class="tkbox" readonly aria-label="Generated prompt">${esc(T.build(tkVals))}</textarea>
    <p><button type="button" class="primary" data-nf="tkcopy">Copy prompt</button></p>`;
}

/* ---------- Collections ---------- */
const COLL = [
  { id: "free-exam", icon: "📝", title: "Free AI tools for exam prep", desc: "Free or freemium tools for studying, notes and quizzes.", kw: ["study", "learn", "quiz", "flashcard", "notes", "tutor", "summar", "exam"], free: true },
  { id: "teacher-time", icon: "⏱️", title: "Save time as a teacher", desc: "Lesson plans, slides, worksheets and quizzes faster.", kw: ["lesson", "quiz", "slides", "presentation", "worksheet", "grading", "teach", "write"] },
  { id: "startup-free", icon: "💡", title: "Free tools for startups", desc: "Build, market and automate on a tiny budget.", kw: ["marketing", "automation", "design", "code", "video", "customer", "analytics", "productivity"], free: true },
  { id: "research", icon: "🔬", title: "Research and academic writing", desc: "Find, read and write research faster.", kw: ["research", "paper", "citation", "academic", "summar", "literature", "write"] },
  { id: "beginner", icon: "🌱", title: "Beginner-friendly picks", desc: "Easy tools to start with, no experience needed.", kw: [], beginner: true }
];
function collTools(c) {
  if (c.kw.length) return rank(c.kw, { free: !!c.free, beginner: !!c.beginner, limit: 12 });
  return TOOLS.filter(t => okFilters(t, !!c.free, !!c.beginner)).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12);
}
function collView(parts) {
  const id = parts[1];
  if (!id) return `<h1>📚 Collections</h1><p>Hand-picked starting points. Share any list with a friend.</p>
    <div class="aud-grid">${COLL.map(c => `<a class="aud" href="#/collections/${c.id}"><span class="ai">${c.icon}</span><b>${esc(c.title)}</b><small>${esc(c.desc)}</small></a>`).join("")}</div>`;
  const c = COLL.find(x => x.id === id);
  if (!c) return `<div class="empty"><p>Collection not found.</p><a class="btn" href="#/collections">All collections</a></div>`;
  const url = location.href.split("#")[0] + "#/collections/" + c.id;
  return `<a href="#/collections">All collections</a><h1>${c.icon} ${esc(c.title)}</h1><p>${esc(c.desc)}</p>
    <div class="actions"><a class="btn primary" href="https://wa.me/?text=${encodeURIComponent(c.title + " " + url)}" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
    <button type="button" data-nf="cpl" data-v="${c.id}">Copy link</button></div>${grid(collTools(c))}
    <p class="note">This list is built from keywords in NIMBU's tool data, so it improves as you add tools.</p>`;
}

/* ---------- School safety checklist ---------- */
const SAFE = [
  "Minimum age: does the tool's terms set an age limit, and does it fit your students?",
  "Consent: does your school or country require parent or guardian consent? (Rules differ by country.)",
  "Training data: does the tool use student inputs to train its models, and can you opt out?",
  "Storage: what personal data is collected, where is it stored and for how long?",
  "Accounts: can students use it without real names or personal emails?",
  "Safety: does it filter unsafe content, and who can see student chats?",
  "Cost: is the free tier enough, and what happens when it ends?",
  "Approval: has your school administration or IT team approved the tool?",
  "Teach students never to paste personal or private information into any AI tool."
];
function safetyView() {
  const done = load("nimbu.safety", []);
  return `<h1>🛡️ School safety checklist</h1><p>Use this before bringing any AI tool into a classroom. Ticks are saved on this device only.</p>
    <ul class="checklist">${SAFE.map((s, i) => `<li><label><input type="checkbox" data-nf="chk" data-i="${i}" ${done.includes(String(i)) ? "checked" : ""}><span>${esc(s)}</span></label></li>`).join("")}</ul>
    <p class="note">General guidance, not legal advice. Rules about children's data differ by country (for example India's DPDP Act 2023, US COPPA and FERPA, and EU GDPR). Always read each tool's official terms and privacy policy.</p>
    <p class="noprint"><button type="button" data-nf="print">🖨️ Print this checklist</button></p>`;
}

/* ---------- Suggest / report form ---------- */
function suggestView() {
  return `<h1>➕ Suggest a tool or report a problem</h1><p>Every suggestion is checked by hand before anything is added or changed.</p>
    <form id="sgForm" class="fgrid" style="grid-template-columns:1fr">
    <label>What is this about?<select name="type"><option>Suggest a tool</option><option>Report an error</option></select></label>
    <label>Tool name<input name="tool" required maxlength="80" placeholder="e.g. Example AI"></label>
    <label>Official website<input name="url" type="url" required maxlength="200" placeholder="https://..."></label>
    <label>Details<textarea name="details" required maxlength="800" placeholder="What does it do? What is wrong?"></textarea></label>
    <label>Your email (optional, only if you want a reply)<input name="email" type="email" maxlength="120"></label>
    <div class="hp" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
    <button class="primary" type="submit">Send</button></form><div id="sgStatus" class="formstatus" role="status"></div>`;
}

/* ---------- router wrapper (keeps your app.js untouched) ---------- */
const VIEWS = { for: hubView, find: findView, toolkit: toolkitView, collections: collView, safety: safetyView, suggest: suggestView };
const TITLES = { for: "For you", find: "Find my AI", toolkit: "Education toolkit", collections: "Collections", safety: "School safety checklist", suggest: "Suggest a tool" };

function homeExtras() {
  const s = $app.querySelector(".stats"); if (!s) return;
  s.insertAdjacentHTML("afterend", `<section class="audbar"><h2>Built for learners and builders</h2><div class="aud-grid">${audTiles()}</div>
    <a class="btn primary" href="#/find">🧭 Find my AI in 4 taps</a> <a class="btn" href="#/toolkit">🧰 Education toolkit</a></section>`);
}
function safetyExtras(slug) {
  const t = TOOLS.find(x => x.slug === slug); if (!t || !t.safety) return;
  const s = t.safety;
  const link = s.source && /^https?:\/\//.test(s.source) ? ` · <a href="${esc(s.source)}" target="_blank" rel="noopener noreferrer">Official policy</a>` : "";
  const h2 = $app.querySelector("h2");
  if (h2) h2.insertAdjacentHTML("beforebegin", `<div class="note safety"><b>School safety info</b><br>Minimum age: ${esc(s.minAge ?? "not recorded")} · ${esc(s.data || "data practices not recorded")}${link}${s.checked ? `<br><small>Checked on ${esc(s.checked)}. Always confirm on the official site.</small>` : ""}</div>`);
}


const baseRender = window.render;

window.render = function () {
  const [path] = (location.hash.slice(1) || "/").split("?");
  const parts = path.split("/").filter(Boolean);
  const view = VIEWS[parts[0]];

  if (view) {
    const qs = path.includes("?")
      ? path.split("?")[1]
      : "";
    $app.innerHTML = view(parts, new URLSearchParams(qs));
    const isNew = location.hash !== lastRoute;
    lastRoute = location.hash;
    $app.classList.toggle("enter", isNew);
    document.title = TITLES[parts[0]] + " | NIMBU";
    document.getElementById("cmpCount").textContent =
      cmp.length ? `(${cmp.length})` : "";
    reveal(isNew);
    return;
  }

  baseRender();

  if (!parts.length) homeExtras();
  if (parts[0] === "tool") safetyExtras(parts[1]);
};


/* ---------- events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-nf]"); if (!b) return;
  const k = b.dataset.nf;
  if (k === "wz") { wiz[b.dataset.k] = wiz[b.dataset.k] === b.dataset.v ? "" : b.dataset.v; render(); }
  else if (k === "wzreset") { wiz = { who: "", goal: "", budget: "", level: "" }; render(); }
  else if (k === "tpl") { tpl = b.dataset.v; render(); }
  else if (k === "tkcopy") { const o = document.getElementById("tkOut"); if (o) copy(o.value, "Prompt copied"); }
  else if (k === "cpl") copy(location.href.split("#")[0] + "#/collections/" + b.dataset.v, "Link copied");
  else if (k === "print") window.print();
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset && el.dataset.nf === "tkf") {
    tkVals[el.dataset.k] = el.value;
    const o = document.getElementById("tkOut"); if (o) o.value = TPL[tpl].build(tkVals);
  }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset && el.dataset.nf === "chk") {
    const list = load("nimbu.safety", []), i = el.dataset.i, at = list.indexOf(i);
    if (el.checked && at < 0) list.push(i);
    if (!el.checked && at >= 0) list.splice(at, 1);
    save("nimbu.safety", list);
  }
});
document.addEventListener("submit", async e => {
  if (e.target.id !== "sgForm") return;
  const f = e.target, d = Object.fromEntries(new FormData(f)), status = document.getElementById("sgStatus");
  if (d._gotcha) return;
  try { new URL(d.url); } catch { status.textContent = "Please enter a valid website link."; return; }
  status.textContent = "Sending...";
  try {
    const r = await fetch(FORM_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ _subject: "NIMBU: " + d.type, ...d }) });
    if (r.ok) { f.reset(); status.textContent = "✅ Thank you! We will review it soon."; }
    else status.textContent = "Could not send right now. Please try again later.";
  } catch { status.textContent = "No connection. Please try again."; }
});

/* ---------- nav + footer links ---------- */
const nav = document.querySelector('nav[aria-label="Main"]');
if (nav) [["#/find", "Find my AI"], ["#/for", "For you"], ["#/toolkit", "Toolkit"]].forEach(([h, l]) => nav.insertAdjacentHTML("beforeend", `<a href="${h}">${l}</a>`));
const foot = document.querySelector("footer");
if (foot) foot.insertAdjacentHTML("beforeend", `<p><a href="#/collections">Collections</a> · <a href="#/safety">School safety</a> · <a href="#/suggest">Suggest a tool</a></p>`);

/* if the page was opened directly on a new route, draw it now */
if (VIEWS[(location.hash.slice(1) || "/").split("/").filter(Boolean)[0]]) render();
else if (!(location.hash.slice(1) || "/").split("/").filter(Boolean).length) homeExtras();
})();