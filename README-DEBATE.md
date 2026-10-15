NIMBU Debate Room — Demo Edition
A standalone, mobile-first multi-perspective debate demo for the existing NIMBU GitHub Pages project. It uses vanilla HTML, CSS, and JavaScript. No build step, library, backend, or API key is required for Demo mode.
Important truth-in-labeling note
This edition creates illustrative, deterministic demo responses for Builder, Skeptic, Researcher, and Judge. It does not call four real AI models, perform web research, or verify sources. Every response card is labelled SIMULATED and the page states this near the question composer. Confidence and scorecard values are heuristic examples, not calibrated probabilities or validated model-quality metrics.
Files
debate.html — standalone page and semantic UI.
debate.css — scoped visual design; does not alter NIMBU's global styles.
debate.js — demo response engine, timeline, critique rounds, report, votes, export, and local history.
debate-config.js — public non-secret settings only.
README-DEBATE.md — this guide.
Run it as a standalone page
In the GitHub repository aryanchaudhary5446-eng/nimbu, create each of the five files above in the repository root.
Copy each file's complete contents into the matching GitHub file, then commit each file to main.
Wait for GitHub Pages to deploy.
Open https://aryanchaudhary5446-eng.github.io/nimbu/debate.html.
Enter a question and press Start debate. Try Run critique round, Generate consensus, the usefulness vote, copy/export, and saved debates.
Optional integration into the existing NIMBU navigation
Repository inspection found the main app uses a hash router in app.js with routes for /, /tools, /tool/<slug>, /prompts, /compare, /favs, and /ask. nimbu.html contains the top navigation and loads app.js near the end of the body. To add a link while keeping this feature isolated, make only these two small edits after the standalone page works.
A. Add a navigation link in nimbu.html
Inside the existing <nav aria-label="Main">, add this line, for example after the Ask NIMBU link:
<a href="#/debate">⚖ Debate Room</a>
B. Add the route in app.js
In the views object inside function render(), add this entry:
debate: () => `<iframe
  title="NIMBU Debate Room"
  src="./debate.html"
  style="display:block;width:100%;height:calc(100vh - 90px);min-height:1100px;border:0;border-radius:18px;background:#0b0c16;"
  loading="eager"
></iframe>`,
Place it near the existing ask: askView route, with a comma separating entries. For example:
ask: askView,
debate: () => `<iframe
  title="NIMBU Debate Room"
  src="./debate.html"
  style="display:block;width:100%;height:calc(100vh - 90px);min-height:1100px;border:0;border-radius:18px;background:#0b0c16;"
  loading="eager"
></iframe>`
This iframe approach intentionally keeps Debate Room JavaScript and CSS isolated from NIMBU's existing globals. The page is still available directly at /nimbu/debate.html.
C. Optional page title
Inside the render() function, update the document.title expression so the route gets a useful title. Replace the existing line with:
document.title = route === "ask" ? "KITTO AI | NIMBU" : route === "debate" ? "Debate Room | NIMBU" : toolName + "NIMBU";
Do not change unrelated routes or existing KITTO AI code.
How the demo works
Quick: no critique round; generate a report after independent demo positions appear.
Balanced: allows one critique round.
Thorough: allows up to two critique rounds.
Generate consensus: produces agreement, disagreement, assumptions, verification needs, risks, next steps, and an illustrative heuristic scorecard.
Vote: records which perspective was most useful to you. It is not a vote about truth.
Copy / export: copy a participant's response or copy/export the report as Markdown.
Save: the page stores history in this browser's localStorage. History is not synced across devices. If storage is blocked/full, use the export feature.
Theme: use the sun button in the page header to switch between dark and light appearance.
Test checklist
[ ]
Empty question shows a validation message.
[ ]
A question produces four clearly labelled simulated cards.
[ ]
Quick mode does not allow a critique round.
[ ]
Balanced mode permits one critique round.
[ ]
Thorough mode permits at most two critique rounds.
[ ]
Generate consensus shows all report sections.
[ ]
User vote changes the selected state.
[ ]
Copy answer and copy report work in a secure browser context.
[ ]
Markdown export downloads a .md file.
[ ]
Save, open, delete, and clear saved debates work.
[ ]
The layout stacks on narrow Android screens.
[ ]
No API key is present in any public file.
The source was checked for JavaScript syntax with Node.js. A real browser/mobile visual test has not been run in this environment; please perform the checklist above after deploying.
Real AI mode later
debate-config.js deliberately contains no provider keys and this version makes no network requests. A future live implementation should add a server-side endpoint (for example a Supabase Edge Function), keep provider keys in server-side secrets, validate input, cap rounds/response size/rate, handle partial failures, and clearly identify the providers that actually responded. Do not place provider API keys in these public files or in browser storage. Do not silently fall back to demo answers if live requests fail.