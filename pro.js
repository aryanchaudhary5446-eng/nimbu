"use strict";
/* NIMBU Pro add-on. Loads LAST (after features.js). Your other files stay untouched. */
(() => {
const FORM = "https://formspree.io/f/moejlzla"; // later: make a 2nd Formspree form for reports
const FREE = ["free", "freemium", "opensource"];
const $q = (s, r = document) => r.querySelector(s);
const bySlug = s => TOOLS.find(t => t.slug === s);
const hayOf = t => [t.name, t.desc, (t.cats || []).join(" "), (t.tags || []).join(" ")].join(" ").toLowerCase();
const score = (t, kws) => { const h = hayOf(t); return kws.reduce((n, k) => n + (h.includes(k) ? 1 : 0), 0); };
const base = () => location.href.split("#")[0];
const wa = txt => "https://wa.me/?text=" + encodeURIComponent(txt);
const chip = t => `<a class="mini" href="#/tool/${t.slug}">${toolLogo(t)}<span>${esc(t.name)}</span></a>`;
const lang = () => load("nimbu.lang", "en");
const saveAll = slugs => { slugs.forEach(s => { if (!favTools.includes(s) && bySlug(s)) favTools.push(s); }); save("nimbu.favTools", favTools); toast("Saved to your list"); };
const empty = (msg, href, label) => `<div class="empty"><p>${msg}</p><a class="btn" href="${href}">${label}</a></div>`;

/* ================= 1. AI STACK BUILDER ================= */
const GOALS = [
  { id: "exams", icon: "📖", name: "Ace my exams", aud: "students", slots: [
    ["Explain & answer", ["chat", "tutor", "explain", "assistant", "study"]],
    ["Notes & summaries", ["notes", "summar", "pdf", "lecture", "transcription"]],
    ["Practice & revision", ["flashcard", "quiz", "practice", "study"]],
    ["Write & polish", ["grammar", "writing", "essay", "editing"]]] },
  { id: "teach", icon: "🍎", name: "Teach smarter", aud: "teachers", slots: [
    ["Lesson plans", ["lesson plan", "teachers", "worksheets", "assessment"]],
    ["Quizzes & activities", ["quiz", "interactive", "classroom", "engagement"]],
    ["Slides & visuals", ["slides", "presentations", "design", "posters"]],
    ["Voice & video", ["text to speech", "avatar", "voiceover", "video"]]] },
  { id: "creator", icon: "🎬", name: "Start a YouTube channel", aud: "startups", slots: [
    ["Ideas & scripts", ["chat", "writing", "assistant", "content"]],
    ["Video editing", ["video editing", "short videos", "clips", "shorts"]],
    ["Thumbnails & images", ["image generation", "design", "posters", "graphics"]],
    ["Voice & music", ["voice", "music", "text to speech", "voiceover"]],
    ["Schedule posts", ["social media", "scheduling", "posts"]]] },
  { id: "paper", icon: "🔬", name: "Write a research paper", aud: "universities", slots: [
    ["Find papers", ["papers", "literature review", "research", "search"]],
    ["Understand sources", ["pdf", "summarize", "explain", "documents"]],
    ["Write clearly", ["writing", "grammar", "essay", "citations"]],
    ["Polish & check", ["grammar", "editing", "spelling"]]] },
  { id: "startup", icon: "🚀", name: "Launch a startup", aud: "startups", slots: [
    ["Research ideas", ["research", "search", "assistant", "chat"]],
    ["Build the product", ["app builder", "no code", "coding", "web apps"]],
    ["Design & brand", ["design", "ui", "website builder", "logo"]],
    ["Get customers", ["marketing", "seo", "social media", "chatbot"]],
    ["Automate work", ["automation", "workflow", "no code", "integrations"]]] },
  { id: "code", icon: "💻", name: "Learn to code", aud: "students", slots: [
    ["Coding help", ["coding", "learn to code", "developer", "assistant"]],
    ["Code editor", ["editor", "code completion", "developer"]],
    ["Run models locally", ["local", "open source", "models", "privacy"]],
    ["Practice & explain", ["chat", "explain", "learn", "study"]]] },
  { id: "slides", icon: "📊", name: "Make presentations fast", aud: "students", slots: [
    ["Draft slides", ["slides", "presentations", "documents"]],
    ["Visuals", ["image generation", "design", "graphics", "posters"]],
    ["Voiceover", ["text to speech", "voiceover", "narration"]],
    ["Polish text", ["grammar", "editing", "writing"]]] },
  { id: "auto", icon: "⚙️", name: "Automate my work", aud: "startups", slots: [
    ["Meeting notes", ["meeting notes", "transcription", "summaries"]],
    ["Tasks & planning", ["tasks", "calendar", "projects", "planning"]],
    ["Automations", ["automation", "workflow", "no code", "integrations"]],
    ["Docs & notes", ["notes", "docs", "wiki"]]] }
];
let cur = null;
function pickStack(g, free, beg) {
  const used = new Set(), out = [];
  g.slots.forEach(([role, kw]) => {
    const c = TOOLS.filter(t => !used.has(t.slug) && (!free || FREE.includes(t.pricing)) && (!beg || t.level === "beginner" || t.level === "all"))
      .map(t => ({ t, k: score(t, kw) })).filter(x => x.k > 0)
      .map(x => ({ t: x.t, s: x.k * 3 + ((x.t.aud || []).includes(g.aud) ? 2 : 0) }))
      .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))[0];
    if (c) { used.add(c.t.slug); out.push({ role, t: c.t }); }
  });
  return out;
}
function stackView(parts, qs) {
  const id = parts[1];
  if (!id) return `<h1>🧱 AI Stack Builder</h1><p>Pick a goal. NIMBU builds a stack of tools from its directory, plus a card you can share.</p>
    <div class="aud-grid">${GOALS.map(g => `<a class="aud" href="#/stack/${g.id}"><span class="ai">${g.icon}</span><b>${g.name}</b><small>${g.slots.length} steps</small></a>`).join("")}</div>`;
  const g = GOALS.find(x => x.id === id);
  if (!g) return empty("Goal not found.", "#/stack", "All goals");
  const free = qs.get("free") === "1", beg = qs.get("b") === "1";
  const picks = pickStack(g, free, beg);
  const mk = (f, b) => { const p = []; if (f) p.push("free=1"); if (b) p.push("b=1"); return "#/stack/" + id + (p.length ? "?" + p.join("&") : ""); };
  cur = { g, picks, link: base() + mk(free, beg) };
  return `<a href="#/stack">All goals</a><h1>${g.icon} ${esc(g.name)}</h1>
    <div class="optrow"><a class="opt" aria-pressed="${free}" href="${mk(!free, beg)}">Free options only</a><a class="opt" aria-pressed="${beg}" href="${mk(free, !beg)}">Beginner-friendly</a></div>
    ${picks.length ? `<ol class="stack">${picks.map(p => `<li><span class="role">${esc(p.role)}</span>${chip(p.t)}<small>${esc(p.t.desc)}</small></li>`).join("")}</ol>
    <div id="cardbox"></div>
    <div class="actions"><button class="primary" data-px="dlcard">Download card</button><button data-px="sharecard">Share</button>
    <a class="btn" href="${wa("My AI stack for " + g.name + ": " + cur.link)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <button data-px="copystack">Copy link</button><button data-px="savestack">Save all tools</button></div>`
    : `<div class="empty"><p>No matching tools yet. Turn a filter off, or add more tools.</p></div>`}
    <p class="note">Picks are keyword matches from NIMBU's own tool data, not rankings or reviews. Check pricing and privacy on each official site.</p>`;
}
function rr(x, a, b, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); }
function drawCard(g, picks) {
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"), F = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#FFB800"); gr.addColorStop(1, "#FF8A00");
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(255,255,255,.2)"; x.beginPath(); x.arc(W - 40, 80, 280, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#111"; x.font = "800 46px " + F; x.fillText("🍋 nimbu", 70, 110);
  x.font = "600 36px " + F; x.fillText("My AI stack for", 70, 220);
  x.font = "800 64px " + F; x.fillText(g.name.slice(0, 26), 70, 300);
  picks.slice(0, 5).forEach((p, i) => {
    const y = 360 + i * 178;
    x.fillStyle = "#fff"; rr(x, 70, y, 940, 150, 34); x.fill();
    x.fillStyle = "#111"; x.beginPath(); x.arc(150, y + 75, 46, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#FFB800"; x.font = "800 52px " + F; x.textAlign = "center"; x.fillText(p.t.name.charAt(0).toUpperCase(), 150, y + 93); x.textAlign = "left";
    x.fillStyle = "#777"; x.font = "600 28px " + F; x.fillText(p.role.toUpperCase(), 225, y + 62);
    x.fillStyle = "#111"; x.font = "800 46px " + F; x.fillText(p.t.name.slice(0, 22), 225, y + 116);
  });
  x.fillStyle = "#111"; x.font = "600 32px " + F;
  x.fillText("Build yours free: " + location.host + location.pathname.replace(/[^/]*$/, ""), 70, 1300);
  return c;
}
function mountCard() { const b = $q("#cardbox"); if (b && cur && cur.picks.length) { b.innerHTML = ""; b.appendChild(drawCard(cur.g, cur.picks)); } }
const cardBlob = () => new Promise(res => { const c = $q("#cardbox canvas"); c ? c.toBlob(res, "image/png") : res(null); });

/* ================= 2. WORKFLOW RECIPES ================= */
const RECIPES = [
  { id: "lecture", icon: "🎧", title: "Lecture → notes → flashcards", who: "For students", steps: [
    { s: "otter", do: "Record your lecture and get the transcript.", p: "" },
    { s: "notebooklm", do: "Upload the transcript and ask for a summary and likely exam questions.", p: "Summarize these lecture notes in 10 key points, then list 5 questions an examiner might ask.\nNotes: [PASTE NOTES]" },
    { s: "quizlet", do: "Turn the key points into flashcards and revise them.", p: "" }] },
  { id: "paper", icon: "🔬", title: "Research paper pipeline", who: "For university students", steps: [
    { s: "elicit", do: "Search your research question and shortlist the most relevant papers.", p: "What does recent research say about [RESEARCH QUESTION]?" },
    { s: "chatpdf", do: "Upload one paper at a time and ask what it found.", p: "Explain this paper's method, main findings and limitations in simple language." },
    { s: "grammarly", do: "Polish grammar and tone in your draft before you submit.", p: "" }] },
  { id: "short", icon: "🎬", title: "Idea → YouTube Short", who: "For creators and startups", steps: [
    { s: "chatgpt", do: "Write a short script with a strong hook.", p: "Write a 30-second YouTube Shorts script about [TOPIC]. Start with a hook in the first 3 seconds, keep sentences short and end with a question." },
    { s: "elevenlabs", do: "Turn the script into a voiceover.", p: "" },
    { s: "capcut", do: "Edit clips, captions and music.", p: "" },
    { s: "canva", do: "Design the thumbnail.", p: "" }] },
  { id: "lesson", icon: "🍎", title: "Lesson plan → quiz → slides", who: "For teachers", steps: [
    { s: "magicschool", do: "Generate a lesson plan.", p: "Create a [MINUTES]-minute lesson plan on [TOPIC] for [CLASS]. Include a warm-up, activities with timings and a quick check for understanding." },
    { s: "kahoot", do: "Turn the key ideas into a quiz.", p: "" },
    { s: "gamma", do: "Make slides from the plan.", p: "" }] },
  { id: "landing", icon: "🚀", title: "Idea → landing page", who: "For startups", steps: [
    { s: "claude", do: "Write clear website copy.", p: "Write landing page copy for [PRODUCT] aimed at [CUSTOMER]. Include a headline, 3 benefits, a short FAQ and a call to action." },
    { s: "lovable", do: "Describe the page and let it build a first version.", p: "" },
    { s: "canva", do: "Create a logo and images.", p: "" }] },
  { id: "meetings", icon: "🗓️", title: "Meeting → action items", who: "For teams", steps: [
    { s: "fathom", do: "Record the meeting and get a summary.", p: "" },
    { s: "notion", do: "Paste the summary into a notes page and list the next steps.", p: "List the decisions and action items from this summary, with an owner and a deadline for each.\nSummary: [PASTE SUMMARY]" },
    { s: "zapier", do: "Automate sending action items to your task app.", p: "" }] },
  { id: "math", icon: "➗", title: "Solve a tough math problem", who: "For students", steps: [
    { s: "photomath", do: "Scan the problem and see the steps.", p: "" },
    { s: "wolfram-alpha", do: "Check the answer and explore related formulas.", p: "" },
    { s: "claude", do: "Ask for a simpler explanation.", p: "Explain this solution step by step as if I am in [CLASS]: [PASTE PROBLEM AND STEPS]" }] }
];
function recipesView(parts) {
  const id = parts[1];
  if (!id) return `<h1>🔗 Workflow Recipes</h1><p>Real tasks, done step by step with the right tool at each step.</p>
    <div class="aud-grid">${RECIPES.map(r => `<a class="aud" href="#/recipes/${r.id}"><span class="ai">${r.icon}</span><b>${esc(r.title)}</b><small>${esc(r.who)} · ${r.steps.length} steps</small></a>`).join("")}</div>`;
  const r = RECIPES.find(x => x.id === id);
  if (!r) return empty("Recipe not found.", "#/recipes", "All recipes");
  return `<a href="#/recipes">All recipes</a><h1>${r.icon} ${esc(r.title)}</h1><p>${esc(r.who)}</p>
    <ol class="steps">${r.steps.map((s, i) => { const t = bySlug(s.s); return `<li><span class="num">${i + 1}</span><div>${t ? chip(t) : `<b>${esc(s.s)}</b>`}<p>${esc(s.do)}</p>${s.p ? `<pre class="prompt">${esc(s.p)}</pre><button class="small" data-px="rp" data-r="${r.id}" data-i="${i}">Copy prompt</button>` : ""}</div></li>`; }).join("")}</ol>
    <div class="actions"><button data-px="recsave" data-r="${r.id}">Save these tools</button>
    <a class="btn" href="${wa("Try this AI workflow: " + r.title + " " + base() + "#/recipes/" + r.id)}" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></div>
    <p class="note">Replace the [PLACEHOLDERS] before using a prompt. Tool features and pricing change, so check each official site.</p>`;
}

/* ================= 3. SHAREABLE LISTS ================= */
let draft = { n: "", t: [] };
const listLink = () => base() + "#/list?n=" + encodeURIComponent(draft.n || "My AI tools") + "&t=" + draft.t.join(",");
function listsView() {
  return `<h1>📋 Make your own list</h1><p>Pick tools, name your list and share the link. No account needed.</p>
    <div class="fgrid" style="grid-template-columns:1fr">
    <label>List name<input id="ln" maxlength="60" placeholder="e.g. My exam-week tools" value="${esc(draft.n)}"></label>
    <label>Add tools<input id="ls" type="search" autocomplete="off" placeholder="Search tools to add"></label></div>
    <div id="lres" class="chips"></div>
    <p><button class="small" data-px="lfav">Add my Saved tools</button></p>
    <h2>Your list</h2><div id="lsel" class="chips"></div><div id="lout"></div>`;
}
function drawLists() {
  const res = $q("#lres"); if (!res) return;
  const words = (($q("#ls") || {}).value || "").toLowerCase().split(/\s+/).filter(Boolean);
  const list = words.length ? TOOLS.filter(t => words.every(w => hayOf(t).includes(w)) && !draft.t.includes(t.slug)).slice(0, 8) : [];
  res.innerHTML = list.map(t => `<button type="button" class="small" data-px="ladd" data-s="${t.slug}">+ ${esc(t.name)}</button>`).join("");
  $q("#lsel").innerHTML = draft.t.length ? draft.t.map(s => { const t = bySlug(s); return t ? `<button type="button" class="chip" data-px="ldel" data-s="${s}">${esc(t.name)} ✕</button>` : ""; }).join("") : `<p class="empty">Nothing added yet.</p>`;
  const out = $q("#lout");
  out.innerHTML = draft.t.length ? `<div class="actions"><button class="primary" data-px="lcopy">Copy share link</button>
    <a class="btn" href="${wa((draft.n || "My AI tools") + " " + listLink())}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a class="btn" href="${listLink().slice(base().length)}">Preview</a></div>` : "";
}
function listView(parts, qs) {
  const tools = (qs.get("t") || "").split(",").filter(Boolean).slice(0, 25).map(bySlug).filter(Boolean);
  const name = (qs.get("n") || "Shared list").slice(0, 60);
  return `<h1>📋 ${esc(name)}</h1><p>A list of ${tools.length} AI tools shared with you.</p>
    <div class="actions"><button class="primary" data-px="lsaveall" data-t="${esc(tools.map(t => t.slug).join(","))}">Save all</button><button data-px="pagecopy">Copy link</button>
    <a class="btn" href="${wa(name + " " + location.href)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="btn" href="#/lists">Make your own</a></div>
    ${tools.length ? `<div class="grid">${tools.map(toolCard).join("")}</div>` : `<div class="empty"><p>This list has no tools we recognise.</p></div>`}`;
}

/* ================= 4. MY TOOLBOX ================= */
function toolboxView() {
  const box = load("nimbu.toolbox", {}), c = load("nimbu.cur", "₹");
  const tools = favTools.map(bySlug).filter(Boolean);
  return `<h1>🧰 My AI Toolbox</h1><p>Your saved tools, with private notes and what you pay for each. Stored only on this device.</p>
    <label>Currency symbol <input id="tcur" maxlength="4" value="${esc(c)}" style="width:80px"></label>
    <div class="totals"><div class="stat"><b id="ttot">0</b><span>per month</span></div><div class="stat"><b id="tyr">0</b><span>per year</span></div></div>
    ${tools.length ? tools.map(t => { const b = box[t.slug] || {}; return `<div class="trow" data-s="${t.slug}"><div class="th">${toolLogo(t)}<a href="#/tool/${t.slug}">${esc(t.name)}</a></div>
      <label>Monthly cost<input data-px-in="cost" type="number" min="0" step="any" inputmode="decimal" value="${esc(b.cost)}" placeholder="0"></label>
      <label>My note<textarea data-px-in="note" maxlength="300" placeholder="How do you use it?">${esc(b.note)}</textarea></label></div>`; }).join("")
      : empty("Save tools with the ☆ Save button and they appear here.", "#/tools", "Browse tools")}
    <h2>Back up your data</h2><p>Copy or download everything NIMBU stores on this device (saved tools, notes, theme), then import it on another device.</p>
    <div class="actions"><button data-px="exp">Copy backup</button><button data-px="expfile">Download backup</button></div>
    <textarea id="imp" class="codeout" placeholder="Paste a backup here to import it"></textarea><p><button data-px="imp">Import backup</button></p>`;
}
function updateTotals() {
  const box = load("nimbu.toolbox", {}), c = load("nimbu.cur", "₹");
  let m = 0; favTools.forEach(s => { m += parseFloat((box[s] || {}).cost) || 0; });
  const f = n => c + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const a = $q("#ttot"), y = $q("#tyr"); if (a) a.textContent = f(m); if (y) y.textContent = f(m * 12);
}
function dump() { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("nimbu.")) o[k] = localStorage.getItem(k); } return JSON.stringify(o); }

/* ================= 5. COMPARE 2.0 + 7. VERIFIED / REPORT ================= */
function compareExtras() {
  const tb = $q("#app table"); if (!tb || !tb.tBodies[0]) return;
  const sel = cmp.map(bySlug).filter(Boolean);
  const row = (l, fn) => `<tr><th scope="row">${l}</th>${sel.map(t => `<td>${fn(t)}</td>`).join("")}</tr>`;
  tb.tBodies[0].insertAdjacentHTML("beforeend",
    row("Best for", t => esc((t.aud || []).concat((t.tags || []).slice(0, 3)).join(", ") || "Not recorded")) +
    row("Free option", t => FREE.includes(t.pricing) ? "Yes" : t.pricing === "paid" ? "No" : "Not verified") +
    row("Last checked", t => t.status === "unverified" ? "Not yet" : esc(t.verified || "Not yet")));
}
function toolExtras(slug) {
  const t = bySlug(slug), h2 = $q("#app h2"); if (!t || !h2) return;
  h2.insertAdjacentHTML("beforebegin", `<div class="note">${t.status === "unverified" ? "Not checked by a human yet." : "Last checked: " + esc(t.verified || "unknown")} <a class="btn small" href="#/report/${t.slug}">⚠️ Report a problem</a></div>`);
}
function reportView(parts) {
  const t = bySlug(parts[1]);
  if (!t) return empty("That tool is not in the directory.", "#/tools", "Browse tools");
  return `<a href="#/tool/${t.slug}">Back to ${esc(t.name)}</a><h1>⚠️ Report a problem</h1><p>Tool: <b>${esc(t.name)}</b></p>
    <form id="rpForm" class="fgrid" style="grid-template-columns:1fr"><input type="hidden" name="tool" value="${esc(t.slug)}">
    <label>What is wrong?<select name="type"><option>Dead or wrong link</option><option>Wrong pricing</option><option>Wrong description</option><option>Tool shut down</option><option>Other</option></select></label>
    <label>Details<textarea name="details" required maxlength="800" placeholder="Tell us what to fix"></textarea></label>
    <label>Your email (optional)<input name="email" type="email" maxlength="120"></label>
    <div class="hp" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
    <button class="primary" type="submit">Send</button></form><div id="rpStatus" class="formstatus" role="status"></div>`;
}
/* ================= 6. PROMPT STUDIO PRO ================= */
const TPLS = [
  { n: "Explain simply", r: "a patient teacher", t: "Explain [TOPIC] in simple words with one everyday example, then ask me 3 questions to check my understanding.", f: "Short paragraphs and a 3-point summary" },
  { n: "Summarize", r: "a careful editor", t: "Summarize the text below in 5 bullet points and list any open questions.\n[PASTE TEXT]", f: "Bullet list" },
  { n: "Lesson plan", r: "an experienced teacher", t: "Create a [MINUTES]-minute lesson plan on [TOPIC] for [CLASS], with a warm-up, activities and a quick check.", f: "Table with timings" },
  { n: "Email", r: "a clear business writer", t: "Write a polite email to [PERSON] about [TOPIC].", f: "Subject line plus a short email" },
  { n: "Debug code", r: "a senior developer", t: "Find the bug in this code and explain the fix in simple words.\n[PASTE CODE]", f: "Explanation, then corrected code" },
  { n: "Study plan", r: "a study coach", t: "Make a [DAYS]-day study plan for [EXAM] with [HOURS] hours per day.", f: "Day-by-day table" }
];
const OPEN = { chatgpt: ["ChatGPT", "https://chatgpt.com/", "?q="], claude: ["Claude", "https://claude.ai/new", "?q="], perplexity: ["Perplexity", "https://www.perplexity.ai/search", "?q="], gemini: ["Gemini", "https://gemini.google.com/app", ""] };
function studioView() {
  return `<h1>✍️ Prompt Studio Pro</h1><p>Build a strong prompt in 30 seconds, then copy it or open it in your favourite AI. Everything stays on this device.</p>
    <div class="optrow">${TPLS.map((t, i) => `<button type="button" class="opt" data-px="stpl" data-i="${i}">${t.n}</button>`).join("")}</div>
    <div id="studio" class="fgrid" style="grid-template-columns:1fr">
    <label>Act as<input id="sr" placeholder="e.g. a patient maths teacher"></label>
    <label>Task<textarea id="st" placeholder="What should the AI do?"></textarea></label>
    <label>Context<textarea id="sc" placeholder="Background the AI needs"></textarea></label>
    <label>Output format<input id="sf" list="fmts" placeholder="e.g. table, bullet list"><datalist id="fmts"><option value="Bullet list"><option value="Table"><option value="Step-by-step"><option value="Short paragraph"></datalist></label>
    <label>Tone<input id="so" list="tones" placeholder="e.g. friendly, formal"><datalist id="tones"><option value="Friendly"><option value="Formal"><option value="Simple"><option value="Direct"></datalist></label>
    <label>Rules<input id="sk" placeholder="e.g. under 150 words, no jargon"></label></div>
    <textarea id="sout" class="tkbox" readonly aria-label="Your prompt"></textarea>
    <div class="actions"><button class="primary" data-px="scopy">Copy prompt</button>${Object.entries(OPEN).map(([k, v]) => `<button data-px="open" data-u="${k}">Copy &amp; open ${v[0]}</button>`).join("")}</div>
    <p class="note">Some sites fill the prompt in for you and some do not. It is always copied first, so paste it if the box is empty.</p>
    <h2>History</h2><div id="shist"></div>`;
}
function composePrompt() {
  const v = id => (($q("#" + id) || {}).value || "").trim(), L = [];
  if (v("sr")) L.push("Act as " + v("sr") + ".");
  if (v("st")) L.push("Task: " + v("st"));
  if (v("sc")) L.push("Context: " + v("sc"));
  if (v("sf")) L.push("Output format: " + v("sf"));
  if (v("so")) L.push("Tone: " + v("so"));
  if (v("sk")) L.push("Rules: " + v("sk"));
  return L.join("\n");
}
const hist = () => load("nimbu.phist", []);
function drawHist() {
  const b = $q("#shist"); if (!b) return; const h = hist();
  b.innerHTML = h.length ? h.map((p, i) => `<div class="trow"><p>${esc(p.slice(0, 140))}${p.length > 140 ? "…" : ""}</p><div class="actions"><button class="small" data-px="hcopy" data-i="${i}">Copy</button><button class="small" data-px="hdel" data-i="${i}">✕</button></div></div>`).join("") : `<p class="empty">Prompts you copy will appear here.</p>`;
}
function pushHist(p) { const h = hist().filter(x => x !== p); h.unshift(p); save("nimbu.phist", h.slice(0, 15)); drawHist(); }
/* ================= 8. ADD-A-TOOL GENERATOR ================= */
function adminView() {
  return `<h1>➕ Add-a-tool generator</h1><p>Fill the boxes, copy the line, and paste it into <b>tools-extra.js</b> just before the closing <code>];</code> of the list. Then raise the <code>?v=</code> number on that script in nimbu.html.</p>
    <div id="admin" class="fgrid" style="grid-template-columns:1fr">
    <label>Tool name<input id="an" placeholder="e.g. Example AI"></label>
    <label>Official website<input id="au" placeholder="https://..."></label>
    <label>Category<input id="ac" list="cats" placeholder="e.g. Writing"><datalist id="cats">${CATS.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
    <label>Pricing<select id="ap"><option value="f">Freemium</option><option value="fr">Free</option><option value="p">Paid</option><option value="o">Open source</option><option value="u">Unknown</option></select></label>
    <label>Level<select id="al"><option>all</option><option>beginner</option><option>pro</option></select></label>
    <div class="optrow">${[["s", "Students"], ["t", "Teachers"], ["sc", "Schools"], ["u", "Universities"], ["st", "Startups"]].map(([v, l]) => `<label class="opt"><input type="checkbox" class="aa" value="${v}"> ${l}</label>`).join("")}</div>
    <label>Tags (comma separated)<input id="at" placeholder="e.g. writing, essays, grammar"></label>
    <label>Short description<textarea id="ad" maxlength="160" placeholder="One clear sentence"></textarea></label></div>
    <div id="awarn" class="note" style="display:none"></div>
    <textarea id="aout" class="codeout" readonly></textarea><p><button class="primary" data-px="acopy">Copy line</button></p>`;
}
function genRow() {
  const v = id => ($q("#" + id) || {}).value || "";
  const name = v("an").trim(), url = v("au").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const aud = [...document.querySelectorAll(".aa:checked")].map(c => c.value).join(",");
  const tags = v("at").split(",").map(s => s.trim()).filter(Boolean).join(",");
  const row = "[" + [slug, name, url, v("ac").trim(), v("ap"), v("al"), aud, tags, v("ad").trim()].map(x => JSON.stringify(x)).join(",") + "],";
  const out = $q("#aout"); if (out) out.value = name ? row : "";
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
  const dup = TOOLS.find(t => t.slug === slug || (url && host(t.url) === host(url)));
  const w = $q("#awarn"); if (w) { w.style.display = dup && name ? "block" : "none"; w.textContent = dup ? "Already in the directory: " + dup.name : ""; }
}
/* ================= 9. COMMAND PALETTE ================= */
const PAGES = [["Home", "#/"], ["All tools", "#/tools"], ["Prompts", "#/prompts"], ["Saved", "#/favs"], ["Compare", "#/compare"], ["Find my AI", "#/find"], ["AI Stack Builder", "#/stack"], ["Workflow Recipes", "#/recipes"], ["My Toolbox", "#/toolbox"], ["Prompt Studio Pro", "#/studio"], ["Make a list", "#/lists"], ["Collections", "#/collections"], ["For students", "#/for/students"], ["For teachers", "#/for/teachers"], ["School safety checklist", "#/safety"], ["Suggest a tool", "#/suggest"]];
let pidx = 0;
document.body.insertAdjacentHTML("beforeend", `<div id="pal" hidden><div class="pbox"><input id="pin" placeholder="Search tools and pages…" autocomplete="off" aria-label="Search everything"><div id="pres"></div><small class="phint">Tip: Ctrl+K or ⌘K opens this anywhere</small></div></div>`);
function palItems(q) {
  q = q.trim().toLowerCase();
  const pg = PAGES.filter(p => !q || p[0].toLowerCase().includes(q)).slice(0, q ? 5 : 7).map(p => ({ l: p[0], h: p[1], s: "Page" }));
  const tl = q ? TOOLS.map(t => ({ t, s: t.name.toLowerCase().startsWith(q) ? 3 : t.name.toLowerCase().includes(q) ? 2 : hayOf(t).includes(q) ? 1 : 0 }))
    .filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 8).map(x => ({ l: x.t.name, h: "#/tool/" + x.t.slug, s: x.t.cats[0] })) : [];
  return pg.concat(tl);
}
function drawPal() {
  const items = palItems($q("#pin").value);
  pidx = Math.min(pidx, Math.max(0, items.length - 1));
  $q("#pres").innerHTML = items.length ? items.map((it, i) => `<a href="${it.h}" class="${i === pidx ? "on" : ""}"><b>${esc(it.l)}</b><small>${esc(it.s)}</small></a>`).join("") : `<div class="sugg-empty">No matches.</div>`;
}
function openPal() { $q("#pal").hidden = false; $q("#pin").value = ""; pidx = 0; drawPal(); $q("#pin").focus(); }
function closePal() { const p = $q("#pal"); if (p) p.hidden = true; }

/* ================= 10. HINDI (starter) ================= */
const DICT = {
  "Tools": "टूल्स", "Prompts": "प्रॉम्प्ट्स", "Ask NIMBU": "NIMBU से पूछें", "Compare": "तुलना", "Saved": "सेव किए", "Theme": "थीम",
  "Find my AI": "मेरा AI खोजें", "For you": "आपके लिए", "Toolkit": "टूलकिट", "Stack": "स्टैक", "Recipes": "रेसिपी", "Toolbox": "टूलबॉक्स",
  "Find the": "किसी भी काम के लिए", "Perfect AI": "सही AI", "for Anything.": "खोजें।",
  "NIMBU is an independent directory of AI tools. Search by task, filter by price, save favorites, and compare tools side by side.": "NIMBU AI टूल्स की एक स्वतंत्र डायरेक्टरी है। काम के हिसाब से खोजें, कीमत से फ़िल्टर करें, पसंदीदा सेव करें और टूल्स की आमने-सामने तुलना करें।",
  "Search": "खोजें", "Explore AI tools": "AI टूल्स देखें", "Discover prompts": "प्रॉम्प्ट्स देखें", "🎲 Surprise me": "🎲 कुछ नया दिखाओ",
  "Categories": "श्रेणियाँ", "Recently added": "हाल में जोड़े गए", "Prompt of the day": "आज का प्रॉम्प्ट", "AI tools": "AI टूल्स",
  "With a free option": "फ्री विकल्प वाले", "Ready prompts": "तैयार प्रॉम्प्ट्स", "Built for learners and builders": "सीखने वालों और बनाने वालों के लिए",
  "Students": "छात्र", "Teachers": "शिक्षक", "Schools": "स्कूल", "Universities": "विश्वविद्यालय", "Startups": "स्टार्टअप",
  "🧭 Find my AI in 4 taps": "🧭 4 टैप में अपना AI खोजें", "🧰 Education toolkit": "🧰 एजुकेशन टूलकिट", "NIMBU power tools": "NIMBU पावर टूल्स",
  "Open tool": "टूल खोलें", "☆ Save": "☆ सेव करें", "★ Saved": "★ सेव किया", "✓ Comparing": "✓ तुलना में", "Copy link": "लिंक कॉपी करें",
  "Copy prompt": "प्रॉम्प्ट कॉपी करें", "Clear comparison": "तुलना हटाएँ", "Visit official site": "आधिकारिक साइट खोलें", "Back to tools": "टूल्स पर वापस",
  "Related tools": "संबंधित टूल्स", "Apply": "लागू करें", "Send": "भेजें", "Prompt Studio": "प्रॉम्प्ट स्टूडियो", "Nothing saved yet.": "अभी कुछ सेव नहीं किया।",
  "Page not found.": "पेज नहीं मिला।", "Go home": "होम जाएँ", "Browse tools": "टूल्स देखें", "Clear conversation": "बातचीत साफ़ करें",
  "Free": "फ्री", "Freemium": "फ्रीमियम", "Paid": "पेड", "Open source": "ओपन सोर्स", "Pricing unknown": "कीमत पता नहीं", "Not yet verified": "अभी सत्यापित नहीं",
  "NIMBU is an independent directory. It does not own or operate the tools listed. Links go to external sites. Your favorites and theme are stored only in this browser.": "NIMBU एक स्वतंत्र डायरेक्टरी है। यह सूचीबद्ध टूल्स का मालिक या संचालक नहीं है। लिंक बाहरी साइटों पर जाते हैं। आपके फ़ेवरेट और थीम केवल इसी ब्राउज़र में सेव रहते हैं।",
  "Built by Aryan · Every AI. One Universe.": "Aryan द्वारा बनाया गया · Every AI. One Universe.",
  "What do you want to do with AI?": "आप AI से क्या करना चाहते हैं?", "Search name, task, tag, price": "नाम, काम, टैग, कीमत खोजें"
};
function translate(root) {
  if (lang() !== "hi") return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const t = n.nodeValue.trim(); if (t && DICT[t]) n.nodeValue = n.nodeValue.replace(t, DICT[t]); });
  root.querySelectorAll("[placeholder]").forEach(el => { const p = el.getAttribute("placeholder"); if (DICT[p]) el.setAttribute("placeholder", DICT[p]); });
}
document.documentElement.lang = lang() === "hi" ? "hi" : "en";
/* ================= wiring ================= */
function homePromo() {
  const html = `<section class="power"><h2>NIMBU power tools</h2><div class="aud-grid">
    <a class="aud" href="#/stack"><span class="ai">🧱</span><b>AI Stack Builder</b><small>Pick a goal, get a stack and a shareable card.</small></a>
    <a class="aud" href="#/recipes"><span class="ai">🔗</span><b>Workflow Recipes</b><small>Chain tools together, step by step.</small></a>
    <a class="aud" href="#/lists"><span class="ai">📋</span><b>Make a list</b><small>Create and share your own tool list.</small></a>
    <a class="aud" href="#/toolbox"><span class="ai">🧰</span><b>My Toolbox</b><small>Notes and monthly costs for saved tools.</small></a>
    <a class="aud" href="#/studio"><span class="ai">✍️</span><b>Prompt Studio Pro</b><small>Build, copy and reuse strong prompts.</small></a></div></section>`;
  const a = $q(".audbar") || $q(".stats"); if (a) a.insertAdjacentHTML("afterend", html);
}
function after(r) {
  if (r === "") homePromo();
  else if (r === "tool") toolExtras((location.hash.split("?")[0].split("/")[2]) || "");
  else if (r === "compare") compareExtras();
  else if (r === "stack") mountCard();
  else if (r === "lists") drawLists();
  else if (r === "toolbox") updateTotals();
  else if (r === "studio") { const o = $q("#sout"); if (o) o.value = composePrompt(); drawHist(); }
  else if (r === "admin") genRow();
}
const VIEWS = { stack: stackView, recipes: recipesView, lists: listsView, list: listView, toolbox: toolboxView, studio: studioView, report: reportView, admin: adminView };
const TITLES = { stack: "AI Stack Builder", recipes: "Workflow Recipes", lists: "Make a list", list: "Shared list", toolbox: "My Toolbox", studio: "Prompt Studio Pro", report: "Report a problem", admin: "Add a tool" };
const prev = window.render;
window.render = function () {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  const parts = path.split("/").filter(Boolean);
  const view = VIEWS[parts[0]];
  if (view) {
    $app.innerHTML = view(parts, new URLSearchParams(qs || ""));
    const isNew = location.hash !== lastRoute; lastRoute = location.hash;
    $app.classList.toggle("enter", isNew);
    document.title = TITLES[parts[0]] + " | NIMBU";
    document.getElementById("cmpCount").textContent = cmp.length ? `(${cmp.length})` : "";
    reveal(isNew);
  } else prev();
  after(parts[0] || "");
  translate(document.body);
};

/* compare cap: max 4 tools */
document.addEventListener("click", e => {
  const b = e.target.closest('[data-act="cmp"]');
  if (b && !cmp.includes(b.dataset.id) && cmp.length >= 4) { e.stopPropagation(); e.preventDefault(); toast("You can compare up to 4 tools"); }
}, true);

document.addEventListener("click", async e => {
  const pal = $q("#pal");
  if (pal && !pal.hidden && e.target === pal) closePal();
  if (e.target.closest("#pres a")) { closePal(); return; }
  const b = e.target.closest("[data-px]"); if (!b) return;
  const k = b.dataset.px;
  if (k === "pal") openPal();
  else if (k === "lang") { save("nimbu.lang", lang() === "hi" ? "en" : "hi"); location.reload(); }
  else if (k === "dlcard") { const bl = await cardBlob(); if (bl) { const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "nimbu-stack.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); } }
  else if (k === "sharecard" && cur) {
    const text = "My AI stack for " + cur.g.name, bl = await cardBlob();
    try {
      const f = bl ? new File([bl], "nimbu-stack.png", { type: "image/png" }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], text, url: cur.link });
      else if (navigator.share) await navigator.share({ text, url: cur.link });
      else copy(cur.link, "Link copied");
    } catch { /* share cancelled */ }
  }
  else if (k === "copystack" && cur) copy(cur.link, "Link copied");
  else if (k === "savestack" && cur) saveAll(cur.picks.map(p => p.t.slug));
  else if (k === "rp") { const r = RECIPES.find(x => x.id === b.dataset.r); if (r) copy(r.steps[b.dataset.i].p, "Prompt copied"); }
  else if (k === "recsave") { const r = RECIPES.find(x => x.id === b.dataset.r); if (r) saveAll(r.steps.map(s => s.s)); }
  else if (k === "ladd") { if (draft.t.length < 25 && !draft.t.includes(b.dataset.s)) draft.t.push(b.dataset.s); drawLists(); }
  else if (k === "ldel") { draft.t = draft.t.filter(s => s !== b.dataset.s); drawLists(); }
  else if (k === "lfav") { favTools.forEach(s => { if (draft.t.length < 25 && !draft.t.includes(s)) draft.t.push(s); }); drawLists(); }
  else if (k === "lcopy") copy(listLink(), "Link copied");
  else if (k === "lsaveall") saveAll((b.dataset.t || "").split(",").filter(Boolean));
  else if (k === "pagecopy") copy(location.href, "Link copied");
  else if (k === "exp") copy(dump(), "Backup copied");
  else if (k === "expfile") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([dump()], { type: "application/json" })); a.download = "nimbu-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  else if (k === "imp") {
    try {
      const o = JSON.parse($q("#imp").value); if (!o || typeof o !== "object") throw 0;
      if (!confirm("Replace the matching data on this device?")) return;
      Object.keys(o).forEach(key => { if (key.startsWith("nimbu.") && typeof o[key] === "string") localStorage.setItem(key, o[key]); });
      toast("Imported. Reloading..."); setTimeout(() => location.reload(), 800);
    } catch { toast("That backup is not valid."); }
  }
  else if (k === "stpl") { const t = TPLS[b.dataset.i]; $q("#sr").value = t.r; $q("#st").value = t.t; $q("#sf").value = t.f; $q("#sout").value = composePrompt(); }
  else if (k === "scopy") { const t = composePrompt(); if (!t) toast("Write a task first"); else { copy(t, "Prompt copied"); pushHist(t); } }
  else if (k === "open") {
    const t = composePrompt(); if (!t) { toast("Write a task first"); return; }
    const [, u, q] = OPEN[b.dataset.u];
    copy(t, "Copied. Paste it if the box is empty."); pushHist(t);
    window.open(q && t.length <= 1500 ? u + q + encodeURIComponent(t) : u, "_blank", "noopener");
  }
  else if (k === "hcopy") copy(hist()[b.dataset.i] || "", "Prompt copied");
  else if (k === "hdel") { const h = hist(); h.splice(b.dataset.i, 1); save("nimbu.phist", h); drawHist(); }
  else if (k === "acopy") { const o = $q("#aout"); if (o && o.value) copy(o.value, "Line copied"); }
});

document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "pin") { pidx = 0; drawPal(); }
  else if (el.id === "ln") { draft.n = el.value; drawLists(); }
  else if (el.id === "ls") drawLists();
  else if (el.id === "tcur") { save("nimbu.cur", el.value.slice(0, 4)); updateTotals(); }
  else if (el.dataset && el.dataset.pxIn) {
    const row = el.closest(".trow"), s = row && row.dataset.s;
    if (s) { const box = load("nimbu.toolbox", {}); box[s] = box[s] || {}; box[s][el.dataset.pxIn] = el.value; save("nimbu.toolbox", box); updateTotals(); }
  }
  else if (el.closest && el.closest("#studio")) { const o = $q("#sout"); if (o) o.value = composePrompt(); }
  else if (el.closest && el.closest("#admin")) genRow();
});

document.addEventListener("submit", async e => {
  if (e.target.id !== "rpForm") return;
  const f = e.target, d = Object.fromEntries(new FormData(f)), st = $q("#rpStatus");
  if (d._gotcha) return;
  st.textContent = "Sending...";
  try {
    const r = await fetch(FORM, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ _subject: "NIMBU report: " + d.tool, ...d }) });
    if (r.ok) { f.reset(); st.textContent = "✅ Thank you. We will check it."; } else st.textContent = "Could not send. Try again later.";
  } catch { st.textContent = "No connection. Try again."; }
});

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPal(); return; }
  const p = $q("#pal"); if (!p || p.hidden) return;
  if (e.key === "Escape") closePal();
  else if (e.key === "ArrowDown") { e.preventDefault(); pidx++; drawPal(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); pidx = Math.max(0, pidx - 1); drawPal(); }
  else if (e.key === "Enter") { const a = $q("#pres a.on") || $q("#pres a"); if (a) { location.hash = a.getAttribute("href"); closePal(); } }
});

/* nav, header buttons, footer links */
const nav = $q('nav[aria-label="Main"]');
if (nav) [["#/stack", "Stack"], ["#/recipes", "Recipes"], ["#/toolbox", "Toolbox"]].forEach(([h, l]) => nav.insertAdjacentHTML("beforeend", `<a href="${h}">${l}</a>`));
const tbx = $q(".themebox");
if (tbx) tbx.insertAdjacentHTML("beforebegin", `<button type="button" class="small" data-px="lang" aria-label="Language">${lang() === "hi" ? "EN" : "हिं"}</button> <button type="button" class="small" data-px="pal" aria-label="Search everything">🔎</button>`);
const foot = $q("footer");
if (foot) foot.insertAdjacentHTML("beforeend", `<p><a href="#/studio">Prompt Studio Pro</a> · <a href="#/lists">Make a list</a> · <a href="#/recipes">Recipes</a></p>`);

/* installable app */
if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

render();
})();
