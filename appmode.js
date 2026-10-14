"use strict";
/* NIMBU app mode v3. Does nothing in a normal browser tab. */
(() => {
  const html = document.documentElement;
  if (!html.classList.contains("is-app")) return;
  const $q = (s, r = document) => r.querySelector(s);
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const hi = get("nimbu.lang", "en") === "hi";
  const HI = {
    "Good morning": "सुप्रभात", "Good afternoon": "नमस्कार", "Good evening": "शुभ संध्या",
    "What do you want to do with AI today?": "आज आप AI से क्या करना चाहते हैं?", "Search AI tools…": "AI टूल्स खोजें…",
    "Quick start": "जल्दी शुरू करें", "Find my AI": "मेरा AI खोजें", "Stack Builder": "स्टैक बिल्डर", "Recipes": "रेसिपी",
    "Prompt Studio": "प्रॉम्प्ट स्टूडियो", "Compare": "तुलना", "My Toolbox": "मेरा टूलबॉक्स", "Tool of the day": "आज का टूल",
    "Recently viewed": "हाल में देखे", "New in NIMBU": "NIMBU में नया", "Browse": "ब्राउज़ करें",
    "For students & teachers": "छात्रों और शिक्षकों के लिए", "Categories": "श्रेणियाँ", "Collections": "कलेक्शन",
    "School safety checklist": "स्कूल सुरक्षा चेकलिस्ट", "Create": "बनाएँ", "All categories": "सभी श्रेणियाँ", "tools": "टूल्स"
  };
  const tx = s => (hi && HI[s]) || s;
  const T = hi ? ["होम", "टूल्स", "बनाएँ", "सेव", "मेन्यू"] : ["Home", "Tools", "Create", "Saved", "Menu"];
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* ignore */ } };
  const app = $q("#app");
  const parts = () => (location.hash.slice(1) || "/").split("?")[0].split("/").filter(Boolean);
  const tabOf = s => ({ "": "home", tools: "tools", tool: "tools", create: "create", stack: "create", recipes: "create", lists: "create", list: "create", studio: "create", toolkit: "create", favs: "saved", toolbox: "saved" }[s] || "more");

  /* no pinch-zoom inside the app */
  const vp = $q('meta[name="viewport"]');
  if (vp) vp.setAttribute("content", "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no");
  ["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

  /* ---------- app screens ---------- */
  const TILES = [["🧭", "Find my AI", "#/find"], ["🧱", "Stack Builder", "#/stack"], ["🔗", "Recipes", "#/recipes"], ["✍️", "Prompt Studio", "#/studio"], ["⚖️", "Compare", "#/compare"], ["🧰", "My Toolbox", "#/toolbox"]];
  const BROWSE = [["🎓", "For students & teachers", "Curated paths for every learner", "#/for"], ["🗂️", "Categories", "Browse every category", "#/cats"], ["📚", "Collections", "Hand-picked starting points", "#/collections"], ["🛡️", "School safety checklist", "Check before using AI in class", "#/safety"]];
  const CREATE = [["🧱", "AI Stack Builder", "Pick a goal and get a shareable stack", "#/stack"], ["🔗", "Workflow Recipes", "Chain tools together, step by step", "#/recipes"], ["✍️", "Prompt Studio", "Build and reuse strong prompts", "#/studio"], ["📋", "Make a list", "Create and share your own tool list", "#/lists"], ["🎒", "Education toolkit", "Lesson, quiz and study-plan prompts", "#/toolkit"], ["🧰", "My Toolbox", "Notes and costs for saved tools", "#/toolbox"]];
  const ICONS = [["chat", "💬"], ["cod", "💻"], ["program", "💻"], ["image", "🎨"], ["design", "🎨"], ["video", "🎬"], ["audio", "🎧"], ["music", "🎧"], ["writ", "✍️"], ["educat", "🎓"], ["research", "🔬"], ["science", "🔬"], ["market", "📣"], ["product", "✅"], ["automat", "⚙️"], ["present", "📊"], ["data", "📈"], ["business", "💼"], ["assistant", "🤖"]];
  const catIcon = c => { const l = c.toLowerCase(), m = ICONS.find(([k]) => l.includes(k)); return m ? m[1] : "🔹"; };
  const arow = (i, title, desc, href) => `<a class="arow" href="${href}"><span class="ai">${i}</span><span class="at"><b>${esc(title)}</b><small>${esc(desc)}</small></span><i>›</i></a>`;
  const atile = t => `<a class="atile" href="#/tool/${t.slug}">${toolLogo(t)}<b>${esc(t.name)}</b><small>${esc((t.cats || [""])[0])}</small></a>`;

  function appHome() {
    const h = new Date().getHours();
    const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const daily = TOOLS.length ? TOOLS[Math.floor(Date.now() / 864e5) % TOOLS.length] : null;
    const recent = load("nimbu.recent", []).map(s => TOOLS.find(t => t.slug === s)).filter(Boolean).slice(0, 8);
    const fresh = TOOLS.slice().sort((a, b) => String(b.added || "").localeCompare(String(a.added || ""))).slice(0, 8);
    return `<section class="am-hero"><p class="am-greet">${tx(greet)} 🍋</p><h1>${tx("What do you want to do with AI today?")}</h1>
      <form id="amSearch" class="am-search"><input id="amq" type="search" autocomplete="off" placeholder="${esc(tx("Search AI tools…"))}" aria-label="Search AI tools"><button class="primary" aria-label="Search">🔍</button></form>
      <div class="chips scroll">${["learn python", "presentation", "summarize pdf", "video clips", "automation"].map(p => `<a class="btn chip" href="#/tools?q=${encodeURIComponent(p)}">${p}</a>`).join("")}</div></section>
      <h2 class="sec">${tx("Quick start")}</h2>
      <div class="tiles">${TILES.map(([i, l, hr]) => `<a class="tile" href="${hr}"><span class="ai">${i}</span><b>${esc(tx(l))}</b></a>`).join("")}</div>
      ${daily ? `<h2 class="sec">${tx("Tool of the day")}</h2><div class="grid">${toolCard(daily)}</div>` : ""}
      ${recent.length ? `<h2 class="sec">${tx("Recently viewed")}</h2><div class="hrow">${recent.map(atile).join("")}</div>` : ""}
      <h2 class="sec">${tx("New in NIMBU")}</h2><div class="hrow">${fresh.map(atile).join("")}</div>
      <h2 class="sec">${tx("Browse")}</h2><div class="arows">${BROWSE.map(([i, l, d, hr]) => arow(i, tx(l), d, hr)).join("")}</div>`;
  }
  const catsView = () => `<h1>${tx("All categories")}</h1><div class="arows">${CATS.map(c => arow(catIcon(c), c, CAT_COUNT[c] + " " + tx("tools"), "#/tools?cat=" + encodeURIComponent(c))).join("")}</div>`;
  const createView = () => `<h1>${tx("Create")}</h1><p>Build stacks, recipes, prompts and lists.</p><div class="arows">${CREATE.map(([i, l, d, hr]) => arow(i, tx(l), d, hr)).join("")}</div>`;

  /* ---------- drawer + tab bar ---------- */
  const GROUPS = [
    ["Discover", [["🏠", "Home", "#/"], ["🔍", "All tools", "#/tools"], ["🗂️", "Categories", "#/cats"], ["🧭", "Find my AI", "#/find"], ["🎲", "Surprise me", "#/tools"]]],
    ["For you", [["🎓", "Students", "#/for/students"], ["📚", "Teachers", "#/for/teachers"], ["🏫", "Schools", "#/for/schools"], ["🏛️", "Universities", "#/for/universities"], ["🚀", "Startups", "#/for/startups"]]],
    ["Create", [["✨", "Create hub", "#/create"], ["🧱", "AI Stack Builder", "#/stack"], ["🔗", "Workflow Recipes", "#/recipes"], ["✍️", "Prompt Studio", "#/studio"], ["📋", "Make a list", "#/lists"], ["🎒", "Education toolkit", "#/toolkit"]]],
    ["My space", [["⭐", "Saved", "#/favs"], ["⚖️", "Compare", "#/compare"], ["🧰", "My Toolbox", "#/toolbox"]]],
    ["More", [["💬", "Prompts", "#/prompts"], ["🤖", "Ask NIMBU", "#/ask"], ["📖", "Collections", "#/collections"], ["🛡️", "School safety", "#/safety"], ["➕", "Suggest a tool", "#/suggest"]]]
  ];
  document.body.insertAdjacentHTML("beforeend", `
    <nav id="tabbar" aria-label="App navigation">
      <a href="#/" data-t="home"><i>🏠</i><span>${T[0]}</span></a>
      <a href="#/tools" data-t="tools"><i>🔍</i><span>${T[1]}</span></a>
      <a href="#/create" data-t="create"><i>✨</i><span>${T[2]}</span></a>
      <a href="#/favs" data-t="saved"><i>⭐</i><span>${T[3]}</span></a>
      <button type="button" id="moreBtn" data-t="more"><i>☰</i><span>${T[4]}</span></button>
    </nav>
    <div id="drawer" hidden>
      <div class="drawer-bg"></div>
      <aside class="drawer-box" aria-label="Menu">
        <div class="d-head"><span>🍋 NIMBU</span><button type="button" id="dClose" aria-label="Close menu">✕</button></div>
        ${GROUPS.map(([g, items]) => `<div class="d-sec">${g}</div>${items.map(([i, l, h]) => `<a href="${h}"${l === "Surprise me" ? ' data-am="surprise"' : ""}><i>${i}</i><span>${l}</span></a>`).join("")}`).join("")}
        <div class="d-foot">
          <label>Theme <select id="amTheme"><option value="midnight">Midnight</option><option value="snow">Snow</option><option value="aurora">Aurora</option><option value="sunset">Sunset</option></select></label>
          <button type="button" data-am="lang">${hi ? "English" : "हिंदी"}</button>
          <button type="button" data-am="share">Share NIMBU</button>
        </div>
      </aside>
    </div>`);

  const logo = $q("header.top .logo");
  if (logo) logo.insertAdjacentHTML("beforebegin", '<button type="button" id="appback" hidden aria-label="Back">←</button><button type="button" id="menuBtn" aria-label="Open menu">☰</button>');
  const drawer = $q("#drawer"), th = $q("#amTheme");
  const openMenu = () => { th.value = html.dataset.theme || "midnight"; drawer.hidden = false; html.classList.add("menu-open"); };
  const closeMenu = () => { drawer.hidden = true; html.classList.remove("menu-open"); };
  th.addEventListener("change", () => {
    html.dataset.theme = th.value;
    try { localStorage.setItem("nimbu.theme", JSON.stringify(th.value)); } catch { /* blocked */ }
    const t = document.getElementById("theme"); if (t) t.value = th.value;
  });

  function sync() {
    const p = parts(), t = tabOf(p[0] || "");
    document.querySelectorAll("#tabbar [data-t]").forEach(el => { if (t === el.dataset.t) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current"); });
    const root = p.length <= 1 && ["", "tools", "create", "favs"].includes(p[0] || "");
    const back = $q("#appback"), menu = $q("#menuBtn");
    if (back) back.hidden = root;
    if (menu) menu.hidden = !root;
    const cur = location.hash || "#/";
    document.querySelectorAll("#drawer a").forEach(a => { if (a.getAttribute("href") === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    app.classList.toggle("is-home", (p[0] || "") === "");
  }

  /* ---------- router wrapper ---------- */
  const prev = window.render;
  window.render = function () {
    const r = parts()[0] || "";
    if (r === "" || r === "cats" || r === "create") {
      app.innerHTML = r === "" ? appHome() : r === "cats" ? catsView() : createView();
      const isNew = location.hash !== lastRoute; lastRoute = location.hash;
      app.classList.toggle("enter", isNew);
      document.title = "NIMBU";
      const cc = document.getElementById("cmpCount"); if (cc) cc.textContent = cmp.length ? `(${cmp.length})` : "";
      reveal(isNew);
    } else prev();
    sync();
  };

  /* ---------- events ---------- */
  window.addEventListener("hashchange", () => { sync(); closeMenu(); });
  document.addEventListener("submit", e => {
    if (e.target.id !== "amSearch") return;
    const v = $q("#amq").value.trim();
    location.hash = "#/tools" + (v ? "?q=" + encodeURIComponent(v) : "");
  });
  document.addEventListener("click", e => {
    const tab = e.target.closest("#tabbar a");
    if (tab) {
      buzz();
      if (tab.getAttribute("href") === (location.hash || "#/")) window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (e.target.closest("#menuBtn") || e.target.closest("#moreBtn")) { buzz(); openMenu(); return; }
    if (e.target.closest(".drawer-bg") || e.target.closest("#dClose")) { closeMenu(); return; }
    if (e.target.closest("#drawer a")) closeMenu();
    if (e.target.closest("#appback")) { buzz(); if (history.length > 1) history.back(); else location.hash = "#/"; }
    const am = e.target.closest("[data-am]");
    if (!am) return;
    if (am.dataset.am === "surprise" && TOOLS.length) {
      e.preventDefault();
      location.hash = "#/tool/" + TOOLS[Math.floor(Math.random() * TOOLS.length)].slug;
    }
    if (am.dataset.am === "lang") {
      try { localStorage.setItem("nimbu.lang", JSON.stringify(hi ? "en" : "hi")); } catch { /* blocked */ }
      location.reload();
    }
    if (am.dataset.am === "share") {
      const url = location.href.split("#")[0];
      if (navigator.share) navigator.share({ title: "NIMBU", text: "Find the right AI tool for any task.", url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  render();
})();