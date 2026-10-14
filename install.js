"use strict";
/* NIMBU install banner. Shows only in the browser, never inside the installed app. */
(() => {
  const inApp = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const KEY = "nimbu.noInstall";
  const hidden = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
  if (inApp || hidden()) return;

  const css = document.createElement("style");
  css.textContent = "#instbar{position:fixed;left:12px;right:12px;bottom:max(14px,env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:16px;background:var(--panel,#141a2b);color:var(--text,#fff);border:1px solid var(--line,#333);box-shadow:0 12px 30px rgba(0,0,0,.35);max-width:520px;margin:0 auto}#instbar span{flex:1;font-size:.92rem;line-height:1.4}#instbar button{min-height:40px}#instbar .x{background:none;border:0;font-size:1.2rem;color:inherit}";
  document.head.appendChild(css);

  let deferred = null;
  function show(text, withBtn) {
    if (document.getElementById("instbar")) return;
    const d = document.createElement("div"); d.id = "instbar";
    d.innerHTML = `<span>${text}</span>${withBtn ? '<button class="primary" id="instgo">Install</button>' : ""}<button class="x" id="instx" aria-label="Close">✕</button>`;
    document.body.appendChild(d);
    document.getElementById("instx").onclick = () => { try { localStorage.setItem(KEY, "1"); } catch { /* blocked */ } d.remove(); };
    const go = document.getElementById("instgo");
    if (go) go.onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch { /* ignore */ } deferred = null; d.remove(); };
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferred = e;
    show("📲 Install NIMBU as an app. It works like the website, right from your home screen.", true);
  });
  window.addEventListener("appinstalled", () => { const b = document.getElementById("instbar"); if (b) b.remove(); });

  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
    setTimeout(() => show("📲 To install: tap Share, then Add to Home Screen.", false), 3000);
  }
})();