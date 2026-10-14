"use strict";
/* NIMBU app mode v2. Does nothing in a normal browser tab. */
(() => {
  const html = document.documentElement;
  if (!html.classList.contains("is-app")) return;
  const $q = (s, r = document) => r.querySelector(s);
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const hi = get("nimbu.lang", "en") === "hi";
  const T = hi ? ["होम", "टूल्स", "स्टैक", "सेव", "मेन्यू"] : ["Home", "Tools", "Stack", "Saved", "Menu"];
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* ignore */ } };
  const app = $q("#app");
  const parts = () => (location.hash.slice(1) || "/").split("?")[0].split("/").filter(Boolean);
  const tabOf = s => ({ "": "home", tools: "tools", tool: "tools", stack: "stack", recipes: "stack", lists: "stack", list: "stack", favs: "saved", toolbox: "saved" }[s] || "more");

  /* no pinch-zoom inside the app */
  const vp = $q('meta[name="viewport"]');
  if (vp) vp.setAttribute("content", "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no");
  ["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

  const GROUPS = [
    ["Discover", [["🏠", "Home", "#/"], ["🔍", "All tools", "#/tools"], ["🧭", "Find my AI", "#/find"], ["🎲", "Surprise me", "#/tools"]]],
    ["For you", [["🎓", "Students", "#/for/students"], ["📚", "Teachers", "#/for/teachers"], ["🏫", "Schools", "#/for/schools"], ["🏛️", "Universities", "#/for/universities"], ["🚀", "Startups", "#/for/startups"]]],
    ["Create", [["🧱", "AI Stack Builder", "#/stack"], ["🔗", "Workflow Recipes", "#/recipes"], ["✍️", "Prompt Studio", "#/studio"], ["📋", "Make a list", "#/lists"], ["🎒", "Education toolkit", "#/toolkit"]]],
    ["My space", [["⭐", "Saved", "#/favs"], ["⚖️", "Compare", "#/compare"], ["🧰", "My Toolbox", "#/toolbox"]]],
    ["More", [["💬", "Prompts", "#/prompts"], ["🤖", "Ask NIMBU", "#/ask"], ["📖", "Collections", "#/collections"], ["🛡️", "School safety", "#/safety"], ["➕", "Suggest a tool", "#/suggest"]]]
  ];

  document.body.insertAdjacentHTML("beforeend", `
    <nav id="tabbar" aria-label="App navigation">
      <a href="#/" data-t="home"><i>🏠</i><span>${T[0]}</span></a>
      <a href="#/tools" data-t="tools"><i>🔍</i><span>${T[1]}</span></a>
      <a href="#/stack" data-t="stack"><i>🧱</i><span>${T[2]}</span></a>
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
    document.querySelectorAll("#tabbar [data-t]").forEach(el => {
      if (t === el.dataset.t) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    const root = p.length <= 1 && ["", "tools", "stack", "favs"].includes(p[0] || "");
    const back = $q("#appback"), menu = $q("#menuBtn");
    if (back) back.hidden = root;
    if (menu) menu.hidden = !root;
    const cur = location.hash || "#/";
    document.querySelectorAll("#drawer a").forEach(a => { if (a.getAttribute("href") === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }

  /* home sections: "See all" links + a flag so the CSS only restyles the home page */
  const SEE = { "Recently added": "#/tools", "Prompt of the day": "#/prompts", "Ask NIMBU": "#/ask", "Built for learners and builders": "#/for", "NIMBU power tools": "#/stack", "Categories": "#/tools" };
  function flag() {
    const home = (location.hash.slice(1) || "/").split("?")[0] === "/";
    app.classList.toggle("is-home", home);
    if (!home) return;
    app.querySelectorAll("h2").forEach(h => {
      if (h.querySelector(".seeall")) return;
      const href = SEE[(h.textContent || "").trim()];
      if (href) h.insertAdjacentHTML("beforeend", `<a class="seeall" href="${href}">See all ›</a>`);
    });
  }
  new MutationObserver(flag).observe(app, { childList: true });

  window.addEventListener("hashchange", () => { sync(); closeMenu(); });
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
    if (am.dataset.am === "surprise" && typeof TOOLS !== "undefined" && TOOLS.length) {
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
  sync(); flag();
})();