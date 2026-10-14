"use strict";
/* NIMBU app mode. Does nothing in a normal browser tab. */
(() => {
  const html = document.documentElement;
  if (!html.classList.contains("is-app")) return;
  const $q = (s, r = document) => r.querySelector(s);
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const hi = get("nimbu.lang", "en") === "hi";
  const T = hi ? ["होम", "टूल्स", "स्टैक", "सेव", "और"] : ["Home", "Tools", "Stack", "Saved", "More"];
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* ignore */ } };
  const parts = () => (location.hash.slice(1) || "/").split("?")[0].split("/").filter(Boolean);
  const tabOf = s => ({ "": "home", tools: "tools", tool: "tools", stack: "stack", recipes: "stack", lists: "stack", list: "stack", favs: "saved", toolbox: "saved" }[s] || "more");

  const ITEMS = [["💬", "Prompts", "#/prompts"], ["🤖", "Ask NIMBU", "#/ask"], ["⚖️", "Compare", "#/compare"], ["🧭", "Find my AI", "#/find"], ["🎓", "For you", "#/for"], ["🎒", "Toolkit", "#/toolkit"], ["🔗", "Recipes", "#/recipes"], ["🧰", "Toolbox", "#/toolbox"], ["✍️", "Prompt Studio", "#/studio"], ["📋", "Make a list", "#/lists"], ["📚", "Collections", "#/collections"], ["🛡️", "School safety", "#/safety"], ["➕", "Suggest a tool", "#/suggest"]];

  document.body.insertAdjacentHTML("beforeend", `
    <nav id="tabbar" aria-label="App navigation">
      <a href="#/" data-t="home"><i>🏠</i><span>${T[0]}</span></a>
      <a href="#/tools" data-t="tools"><i>🔍</i><span>${T[1]}</span></a>
      <a href="#/stack" data-t="stack"><i>🧱</i><span>${T[2]}</span></a>
      <a href="#/favs" data-t="saved"><i>⭐</i><span>${T[3]}</span></a>
      <button type="button" id="moreBtn" data-t="more"><i>☰</i><span>${T[4]}</span></button>
    </nav>
    <div id="sheet" hidden>
      <div class="sheet-bg"></div>
      <div class="sheet-box" role="dialog" aria-label="More">
        <div class="grab"></div>
        <div class="sgrid">${ITEMS.map(([i, l, h]) => `<a href="${h}"><i>${i}</i><span>${l}</span></a>`).join("")}</div>
        <div class="srow">
          <label>Theme <select id="amTheme"><option value="midnight">Midnight</option><option value="snow">Snow</option><option value="aurora">Aurora</option><option value="sunset">Sunset</option></select></label>
          <button type="button" data-am="lang">${hi ? "English" : "हिंदी"}</button>
          <button type="button" data-am="share">Share NIMBU</button>
        </div>
      </div>
    </div>`);

  const logo = $q("header.top .logo");
  if (logo) logo.insertAdjacentHTML("beforebegin", '<button type="button" id="appback" hidden aria-label="Back">←</button>');

  const sheet = $q("#sheet"), th = $q("#amTheme");
  th.value = html.dataset.theme || "midnight";
  th.addEventListener("change", () => {
    html.dataset.theme = th.value;
    try { localStorage.setItem("nimbu.theme", JSON.stringify(th.value)); } catch { /* blocked */ }
    const t = document.getElementById("theme"); if (t) t.value = th.value;
  });
  const openSheet = () => { th.value = html.dataset.theme || "midnight"; sheet.hidden = false; html.classList.add("sheet-open"); };
  const closeSheet = () => { sheet.hidden = true; html.classList.remove("sheet-open"); };

  function sync() {
    const p = parts(), t = tabOf(p[0] || "");
    document.querySelectorAll("#tabbar [data-t]").forEach(el => {
      if (t === el.dataset.t) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
    const rootTab = p.length <= 1 && ["", "tools", "stack", "favs"].includes(p[0] || "");
    const back = $q("#appback"); if (back) back.hidden = rootTab;
  }

  window.addEventListener("hashchange", () => { sync(); closeSheet(); });
  document.addEventListener("click", e => {
    const tab = e.target.closest("#tabbar a");
    if (tab) {
      buzz();
      if (tab.getAttribute("href") === (location.hash || "#/")) window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (e.target.closest("#moreBtn")) { buzz(); openSheet(); return; }
    if (e.target.closest(".sheet-bg") || e.target.closest("#sheet a")) closeSheet();
    if (e.target.closest("#appback")) { buzz(); if (history.length > 1) history.back(); else location.hash = "#/"; }
    const am = e.target.closest("[data-am]");
    if (am && am.dataset.am === "lang") {
      try { localStorage.setItem("nimbu.lang", JSON.stringify(hi ? "en" : "hi")); } catch { /* blocked */ }
      location.reload();
    }
    if (am && am.dataset.am === "share") {
      const url = location.href.split("#")[0];
      if (navigator.share) navigator.share({ title: "NIMBU", text: "Find the right AI tool for any task.", url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
  sync();
})();