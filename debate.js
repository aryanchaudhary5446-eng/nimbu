/* NIMBU Debate Room: self-contained demo engine. No network calls are made. */
(function (global) {
  "use strict";
  const cfg = global.NIMBU_DEBATE_CONFIG || { version: 1, mode: "demo", storageKey: "nimbu.debateRoom.v1", maxQuestionLength: 1200, maxSavedDebates: 30, maxCritiqueRounds: 2, personas: [] };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const root = $("#debateApp");
  if (!root) return;

  const PERSONAS = cfg.personas.length ? cfg.personas : [
    { id: "builder", name: "Builder", role: "Practical strategist", icon: "✦" },
    { id: "skeptic", name: "Skeptic", role: "Risk challenger", icon: "◈" },
    { id: "researcher", name: "Researcher", role: "Evidence auditor", icon: "⌕" },
    { id: "judge", name: "Judge", role: "Neutral synthesizer", icon: "⚖" }
  ];
  const MAX_Q = Number(cfg.maxQuestionLength) || 1200;
  let state = emptyState();
  let toastTimer = null;

  function emptyState() {
    return { id: "", question: "", createdAt: "", mode: "balanced", rounds: 0, phase: "idle", participants: [], userVote: "", report: null, demo: true };
  }
  function safeText(value) { return String(value == null ? "" : value); }
  function escapeHTML(value) {
    return safeText(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(cfg.storageKey) || "null");
      return parsed && parsed.version === cfg.version && Array.isArray(parsed.items) ? parsed.items.filter(item => item && typeof item.id === "string" && typeof item.question === "string") : [];
    } catch (_) { return []; }
  }
  function writeStore(items) {
    try { localStorage.setItem(cfg.storageKey, JSON.stringify({ version: cfg.version, items: items.slice(0, Number(cfg.maxSavedDebates) || 30) })); return true; }
    catch (_) { showToast("Browser storage is unavailable or full. You can still export this debate."); return false; }
  }
  function showToast(message) {
    const el = $("#ndr-toast"); if (!el) return;
    el.textContent = message; el.classList.add("is-visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
  }
  function topicType(question) {
    const q = question.toLowerCase();
    if (/startup|business|sell|customer|market|revenue|entrepreneur|product|company/.test(q)) return "business";
    if (/python|code|program|software|app|website|developer|dsa|engineering|computer/.test(q)) return "technology";
    if (/college|student|study|learn|education|exam|career|job|internship/.test(q)) return "education";
    if (/science|research|climate|health|medicine|experiment|evidence|environment/.test(q)) return "research";
    if (/should|better|choose|decision|compare|versus|\bvs\b|worth/.test(q)) return "decision";
    return "general";
  }
  function topicAdvice(type) {
    const advice = {
      business: { action: "Test demand before scaling", metric: "real customer conversations, activation, repeat use, and willingness to pay", risk: "People may praise an idea without becoming paying customers.", evidence: "Interview target users and run a small landing-page or concierge test before investing heavily." },
      technology: { action: "Build a small, testable prototype", metric: "correctness, usability, reliability, and time saved", risk: "A technically impressive demo may fail on edge cases or real devices.", evidence: "Write acceptance tests, test on the target device, and compare against a simple baseline." },
      education: { action: "Use a time-boxed learning experiment", metric: "retention, independent problem-solving, and consistent progress", risk: "Short-term speed can hide weak understanding or burnout.", evidence: "Compare a few weeks of outcomes with a clear baseline and keep the routine sustainable." },
      research: { action: "Separate hypotheses from verified findings", metric: "reproducibility, source quality, and uncertainty reduction", risk: "A plausible explanation can still be wrong when evidence is incomplete.", evidence: "Use primary sources, methods review, independent replication, and explicit uncertainty." },
      decision: { action: "Define criteria and run a reversible trial", metric: "the outcomes that matter most to the decision", risk: "A confident recommendation can overlook personal constraints or hidden trade-offs.", evidence: "Write down assumptions, compare alternatives using the same criteria, and set a review date." },
      general: { action: "Clarify the goal, constraints, and success criteria", metric: "observable progress toward the stated goal", risk: "A broad question may conceal important context or competing priorities.", evidence: "Gather relevant primary information and revisit the conclusion when new evidence appears." }
    };
    return advice[type] || advice.general;
  }
  function makeParticipants(question) {
    const type = topicType(question), a = topicAdvice(type);
    const shortQ = question.length > 180 ? question.slice(0, 177) + "…" : question;
    return [
      { id: "builder", name: "Builder", role: "Practical strategist", icon: "✦", initial: `For “${shortQ}”, I would start with a small, measurable plan rather than trying to solve every part at once. The most useful first move is to ${a.action.toLowerCase()}. Break the work into a first milestone, a feedback checkpoint, and a decision about what to do next.`, reasoning: `A bounded experiment creates something concrete to evaluate. Track ${a.metric}, and avoid adding complexity before the basic approach demonstrates value.`, assumptions: "There is enough time and access to run a small test, and the goal can be described in observable terms.", limitation: "This recommendation may change if the budget, deadline, safety requirements, or available resources are unusually constrained.", evidence: a.evidence, confidence: 72, critique: "The plan needs a sharper success threshold and a fallback if the first experiment fails.", revision: `I would keep the initial plan small, but define a stop/go threshold in advance. If the evidence does not meet that threshold, revise the approach instead of expanding it.`, feedback: "" },
      { id: "skeptic", name: "Skeptic", role: "Risk challenger", icon: "◈", initial: `The main danger in “${shortQ}” is assuming that a promising idea or confident plan will work in real conditions. Before committing, identify the cost of being wrong, who could be negatively affected, and what would make you stop.`, reasoning: `A plan can look successful while missing the actual goal. In this case, ${a.risk} Include an alternative and a low-cost way to discover problems early.`, assumptions: "The current information may be incomplete, and the decision has meaningful trade-offs.", limitation: "A risk-focused view can overemphasize failure and underweight the benefits of learning by doing.", evidence: "List the three most consequential failure modes, estimate their impact, and test the most likely or costly one first.", confidence: 68, critique: "The cautious approach could delay learning if it demands too much proof before a small, reversible test.", revision: "I would not block a small experiment. I would block an irreversible commitment until the main risks, costs, and exit criteria are explicit.", feedback: "" },
      { id: "researcher", name: "Researcher", role: "Evidence auditor", icon: "⌕", initial: `The question cannot be settled by confidence alone. First separate what is known, what is assumed, and what would count as useful evidence. I do not have live source retrieval in this demo, so I cannot verify specific factual claims or provide real citations.`, reasoning: `For this topic, the strongest next step is to seek ${a.evidence.toLowerCase()} Prefer primary data and independent checks over repetition of the same claim.`, assumptions: "The question can be investigated using observable outcomes, reliable sources, or a clearly stated decision framework.", limitation: "This is a method for checking the claim, not a finding from a live literature or web search.", evidence: `Evidence to collect: ${a.evidence} Record the source, date, method, and any conflicting results.`, confidence: 61, critique: "Evidence gathering should be proportionate; not every low-risk choice needs a formal research project.", revision: "Use a proportionate evidence standard: a quick check for reversible low-risk choices, and stronger independent evidence for costly or high-impact decisions.", feedback: "" },
      { id: "judge", name: "Judge", role: "Neutral synthesizer", icon: "⚖", initial: `A balanced starting conclusion is to pursue a limited, reversible next step while keeping the key uncertainty visible. Builder contributes a path forward; Skeptic asks what could go wrong; Researcher asks what would justify confidence.`, reasoning: `The useful overlap is a small test with a defined outcome, risk check, and evidence review. The disagreement is mainly about how much validation is needed before acting.`, assumptions: "The user wants a practical recommendation and can revisit the decision after learning more.", limitation: "This is a preliminary synthesis of the question, not an independent expert verdict or verified fact-check.", evidence: "Use the decision criteria and evidence-gathering approach described by the other roles, then update the conclusion based on observed results.", confidence: 66, critique: "The final recommendation should clearly state the decision rule, not just combine the other perspectives.", revision: `Proceed only with the smallest test that can answer the biggest open question. Agree on success and stop criteria beforehand, and preserve the option to change course.`, feedback: "" }
    ];
  }
  function maxRounds() { return state.mode === "quick" ? 0 : state.mode === "thorough" ? 2 : 1; }
  function renderPersonaStrip() {
    const el = $("#ndr-personas");
    el.innerHTML = PERSONAS.map(p => `<div class="ndr-persona" data-persona="${escapeHTML(p.id)}"><div class="ndr-persona-top"><span class="ndr-persona-icon">${escapeHTML(p.icon)}</span><div><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.role)}</small></div></div></div>`).join("");
  }
  function renderResponses() {
    const host = $("#ndr-responses");
    if (!state.participants.length) {
      host.innerHTML = `<div class="ndr-empty ndr-panel"><div class="ndr-empty-icon">◎</div><h3>Your debate starts here</h3><p>Submit a question to reveal four separate perspectives, then run critiques and generate a consensus report.</p></div>`;
      return;
    }
    host.innerHTML = state.participants.map(p => {
      const text = state.rounds && p.revision ? p.revision : p.initial;
      const critique = state.rounds ? `<div class="ndr-critiques"><h4>Critique / round ${state.rounds}</h4><p>${escapeHTML(p.critique)}</p>${p.revision ? `<h4>Reasoned revision</h4><p>${escapeHTML(p.revision)}</p>` : ""}</div>` : "";
      return `<article class="ndr-response-card" data-card="${escapeHTML(p.id)}"><header class="ndr-response-head"><div class="ndr-response-title"><span class="ndr-persona-icon">${escapeHTML(p.icon)}</span><div><h3>${escapeHTML(p.name)}</h3><small>${escapeHTML(p.role)}</small></div></div><span class="ndr-demo-tag">${state.demo ? "SIMULATED" : "AI RESPONSE"}</span></header><div class="ndr-response-body"><h4>Initial position</h4><p>${escapeHTML(p.initial)}</p><h4>Reasoning</h4><p>${escapeHTML(p.reasoning)}</p><h4>Assumptions</h4><p>${escapeHTML(p.assumptions)}</p><h4>Limitations</h4><p>${escapeHTML(p.limitation)}</p><h4>Evidence to seek</h4><p>${escapeHTML(p.evidence)}</p>${critique}<div class="ndr-confidence"><span>Heuristic confidence</span><div class="ndr-confidence-bar"><span style="width:${p.confidence}%"></span></div><b>${p.confidence}%</b></div></div><div class="ndr-card-actions"><button type="button" data-action="copy-answer" data-id="${p.id}">Copy answer</button><button type="button" data-action="expand" data-id="${p.id}" aria-expanded="true">Collapse details</button><button type="button" data-action="feedback" data-id="${p.id}" data-value="helpful" aria-pressed="${p.feedback === "helpful"}">♡ Helpful</button><button type="button" data-action="feedback" data-id="${p.id}" data-value="unhelpful" aria-pressed="${p.feedback === "unhelpful"}">Not useful</button></div></article>`;
    }).join("");
  }
  function renderTimeline() {
    const host = $("#ndr-timeline");
    const steps = [
      ["Question submitted", state.question ? "Question captured" : "Waiting for your question"],
      ["Independent positions", state.participants.length ? "Four separate demo positions generated" : "Each persona answers without seeing the others"],
      ["Critique and revision", state.rounds ? `${state.rounds} critique round${state.rounds > 1 ? "s" : ""} completed` : "Challenge assumptions, not just opinions"],
      ["Vote and consensus", state.report ? "Consensus report generated" : "Agreement and dissent remain visible"]
    ];
    const done = [!!state.question, !!state.participants.length, state.rounds > 0 || !!state.report, !!state.report];
    const currentIndex = !state.question ? 0 : !state.participants.length ? 1 : !state.report ? 2 : 3;
    host.innerHTML = steps.map((s, i) => `<li class="${done[i] ? "is-done" : ""} ${i === currentIndex ? "is-current" : ""}"><span>0${i + 1}</span><div><b>${escapeHTML(s[0])}</b><small>${escapeHTML(s[1])}</small></div></li>`).join("");
    $(`[data-action="critique"]`).disabled = !state.participants.length || state.rounds >= maxRounds() || !!state.report;
    $(`[data-action="critique"]`).textContent = state.rounds >= maxRounds() ? "Critique limit reached" : `Run critique round${state.rounds ? ` (${state.rounds}/${maxRounds()})` : ""}`;
    $(`[data-action="critique"]`).disabled = !state.participants.length || state.rounds >= maxRounds() || !!state.report;
    $(`[data-action="cancel"]`).disabled = !state.question;
    $("#ndr-debate-status").textContent = !state.question ? "Awaiting question" : state.report ? "Report ready" : state.rounds ? `Round ${state.rounds} complete` : "Independent answers ready";
  }
  function renderVotes() {
    const host = $("#ndr-vote-options");
    host.innerHTML = PERSONAS.map(p => `<button type="button" data-action="vote" data-id="${p.id}" aria-pressed="${state.userVote === p.id}" ${state.participants.length ? "" : "disabled"}>${escapeHTML(p.name)}</button>`).join("");
    $("#ndr-vote-result").textContent = state.userVote ? `You marked ${PERSONAS.find(p => p.id === state.userVote)?.name || state.userVote} as most useful. This is a usefulness vote, not a truth score.` : "No vote yet.";
  }
  function renderReport() {
    const section = $("#ndr-report-section");
    if (!state.report) { section.hidden = true; $("#ndr-report").innerHTML = ""; return; }
    section.hidden = false;
    const r = state.report;
    $("#ndr-consensus-status").textContent = r.status;
    const list = items => `<ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
    const cards = [
      { title: "Best-supported conclusion", body: `<p>${escapeHTML(r.conclusion)}</p>`, wide: true },
      { title: "Executive summary", body: `<p>${escapeHTML(r.summary)}</p>` },
      { title: "Points of agreement", body: list(r.agreement) },
      { title: "Points of disagreement", body: list(r.disagreement) },
      { title: "Strongest contributions", body: list(r.strengths) },
      { title: "Assumptions still open", body: list(r.assumptions) },
      { title: "Claims to verify", body: list(r.verify) },
      { title: "Risks and counterarguments", body: list(r.risks) },
      { title: "Recommended next steps", body: `<ol>${r.nextSteps.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ol>` },
      { title: "Heuristic scorecard", body: `<div class="ndr-score-list">${Object.entries(r.scores).map(([name, score]) => `<div class="ndr-score-row"><span>${escapeHTML(name)}</span><div class="ndr-score-track"><span style="width:${score}%"></span></div><b>${score}</b></div>`).join("")}</div><p class="ndr-muted">Illustrative rubric scores, not validated model-quality measurements.</p>` },
      { title: "Confidence and voting", body: `<p>${escapeHTML(r.confidenceExplanation)}</p><p>${escapeHTML(r.voteText)}</p>` }
    ];
    $("#ndr-report").innerHTML = cards.map(c => `<article class="ndr-report-card ${c.wide ? "wide" : ""}"><h3>${escapeHTML(c.title)}</h3>${c.body}</article>`).join("");
  }
  function renderHistory() {
    const items = readStore();
    const host = $("#ndr-history");
    if (!items.length) { host.innerHTML = `<p class="ndr-muted">Debates you save on this device will appear here.</p>`; return; }
    host.innerHTML = items.map(item => `<div class="ndr-history-item"><p><b>${escapeHTML(item.question.length > 110 ? item.question.slice(0, 107) + "…" : item.question)}</b><small>${escapeHTML(new Date(item.createdAt || Date.now()).toLocaleString())} · ${item.report ? "Report saved" : "Answers saved"}</small></p><div class="ndr-history-actions"><button type="button" data-action="load-history" data-id="${escapeHTML(item.id)}">Open</button><button type="button" data-action="delete-history" data-id="${escapeHTML(item.id)}">Delete</button></div></div>`).join("");
  }
  function renderAll() {
    renderPersonaStrip(); renderResponses(); renderTimeline(); renderVotes(); renderReport(); renderHistory();
    $("#ndr-char-count").textContent = `${$("#ndr-question").value.length} / ${MAX_Q}`;
  }
  function buildReport() {
    const type = topicType(state.question), a = topicAdvice(type);
    const ps = state.participants;
    const voteCounts = Object.fromEntries(PERSONAS.map(p => [p.id, p.id === state.userVote ? 1 : 0]));
    const avgConfidence = Math.round(ps.reduce((sum, p) => sum + p.confidence, 0) / Math.max(1, ps.length));
    const scores = {
      "Relevance": 78,
      "Logic": 72,
      "Evidence quality": 43,
      "Counterarguments": state.rounds ? 76 : 54,
      "Feasibility": 74,
      "Assumptions resolved": 48
    };
    let status = "Partial agreement";
    if (state.rounds >= 2) status = "Partial agreement";
    if (type === "research") status = "Insufficient evidence";
    if (type === "decision" && /versus|\bvs\b|choose|which|better/.test(state.question.toLowerCase())) status = "Split decision";
    const agreement = ["A small, reversible next step is more informative than a large commitment based only on intuition.", "The decision should have explicit success criteria and a review point.", "Uncertainty and limitations should be visible rather than hidden behind a confident-sounding answer."];
    const disagreement = ["How much evidence is needed before acting depends on the cost, risk, and reversibility of the decision.", "A fast experiment can be useful, but it should not be treated as proof that the broader idea will succeed."];
    const strengths = ["Builder: converts the question into an actionable plan.", "Skeptic: makes failure modes and exit criteria visible.", "Researcher: distinguishes evidence from assumptions and highlights verification needs.", "Judge: preserves the shared recommendation while recording unresolved trade-offs."];
    const assumptions = ["The question contains enough context to suggest a first step.", "The user can access the time, tools, or information needed for a small test.", "The demo personas' reasoning is illustrative and has not been independently verified."];
    const verify = [a.evidence, "Any time-sensitive factual claim should be checked against current primary sources.", "Costs, constraints, and likely outcomes should be measured in the user's actual context."];
    const risks = [a.risk, "The simulated personas may share blind spots and do not provide independent real-model validation.", "A majority vote or confidence percentage is not proof of correctness."];
    const nextSteps = ["Write down the exact outcome you want and the constraints that matter.", a.action + "; define a measurable success and stop/go threshold.", "Collect the most decision-relevant evidence and record its source.", "Review the result at a fixed date and revise the conclusion if the evidence changes."];
    const conclusion = `For “${state.question}”, the most defensible demo conclusion is to take a small, reversible next step, define success and stop criteria, and seek evidence on the most important uncertainty before making a larger commitment.`;
    return { status, conclusion, summary: `The council's simulated perspectives converge on a test-first approach. Builder emphasizes execution, Skeptic emphasizes downside risk, Researcher emphasizes evidence quality, and Judge combines those priorities. Because this is a local demo with no live model calls or source retrieval, treat this as a structured thinking aid rather than a verified answer.`, agreement, disagreement, strengths, assumptions, verify, risks, nextSteps, scores, confidenceExplanation: `Average persona confidence is ${avgConfidence}% (self-labelled heuristic). It reflects the demo's preset confidence values, not a calibrated probability that the conclusion is true. The evidence-quality score is intentionally lower because no live sources were checked.`, voteText: state.userVote ? `Your usefulness vote: ${PERSONAS.find(p => p.id === state.userVote)?.name || state.userVote}. This records your preference only; no independent expert vote was cast.` : "No user vote has been recorded. The demo does not claim that real AI models voted.", votes: voteCounts };
  }
   
async function startDebate(question) {
  const cleaned = safeText(question).trim();

  if (!cleaned) {
    showToast("Enter a question before starting.");
    $("#ndr-question").focus();
    return;
  }

  if (cleaned.length > MAX_Q) {
    showToast(`Keep the question under ${MAX_Q} characters.`);
    return;
  }

  const client = global.NIMBU_SUPABASE;

  if (!client || !client.functions) {
    showToast("Supabase connection is not loaded.");
    return;
  }

  const button = $('#ndr-form button[type="submit"]');
  if (button) button.disabled = true;

  state = emptyState();
  state.id = `debate-${Date.now()}`;
  state.question = cleaned;
  state.createdAt = new Date().toISOString();
  state.mode = $("#ndr-mode-select").value || "balanced";
  state.phase = "loading";
  state.demo = false;

  renderAll();
  showToast("Generating four AI perspectives...");

  const prompts = {
    builder: `You are Builder, a practical strategist. Give an actionable solution to this question: ${cleaned}. Include your proposal, reasoning, assumptions, limitations, and measurable next steps.`,
    skeptic: `You are Skeptic, a critical risk analyst. Challenge the proposed approaches to this question: ${cleaned}. Identify weak assumptions, risks, counterarguments, and what could change your view.`,
    researcher: `You are Researcher, an evidence auditor. Analyze this question: ${cleaned}. Separate known information from assumptions, identify claims requiring verification, and never invent sources or citations.`,
    judge: `You are Judge, a neutral evaluator. Independently assess this question: ${cleaned}. Compare likely trade-offs, explain uncertainty, and give a balanced provisional conclusion: ${cleaned}.`
  };

  try {
    const results = await Promise.all(
      PERSONAS.map(async persona => {
        const { data, error } = await client.functions.invoke(
          "swift-endpoint",
          { body: { question: prompts[persona.id] || cleaned } }
        );

        if (error) throw error;

        const answer = data && data.answer;
        if (typeof answer !== "string" || !answer.trim()) {
          throw new Error(`${persona.name} returned an empty response.`);
        }

        return { id: persona.id, answer: answer.trim() };
      })
    );

    const templates = makeParticipants(cleaned);

    state.participants = templates.map(persona => {
      const result = results.find(item => item.id === persona.id);
      return {
        ...persona,
        initial: result ? result.answer : persona.initial,
        reasoning: "AI-generated response. Review the position above and verify important claims independently.",
        confidence: 70,
        critique: "Critique not yet generated by the live AI backend.",
        revision: "",
        evidence: persona.id === "researcher"
          ? "The response identifies evidence to seek; sources have not been independently verified."
          : persona.evidence
      };
    });

    state.phase = "answers";
    state.demo = false;

    if ($("#ndr-save-toggle").checked) saveCurrent(false);

    renderAll();
    showToast("Four live AI responses are ready.");
  } catch (error) {
    console.error("Debate AI error:", error);
    state.participants = [];
    state.phase = "error";
    renderAll();
    showToast("AI request failed. Check Supabase logs and function configuration.");
  } finally {
    if (button) button.disabled = false;
  }
}

  function runCritique() {
    if (!state.participants.length) return;
    if (state.rounds >= maxRounds()) { showToast("This debate has reached its critique-round limit."); return; }
    state.rounds += 1; state.phase = "critique"; state.report = null;
    state.participants.forEach((p, index) => {
      p.confidence = Math.max(40, Math.min(86, p.confidence + (index % 2 === 0 ? 2 : -1)));
      if (state.rounds === 2) p.revision = p.revision + " In the second round, I would also record what evidence would change this recommendation and avoid overstating what the demo can establish.";
    });
    renderAll();
    if ($("#ndr-save-toggle").checked) saveCurrent(false);
    showToast(`Critique round ${state.rounds} completed in demo simulation.`);
  }
  function generateConsensus() {
    if (!state.participants.length) { showToast("Start a debate first."); return; }
    state.report = buildReport(); state.phase = "report";
    renderAll();
    if ($("#ndr-save-toggle").checked) saveCurrent(false);
    $("#ndr-report-section").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    showToast("Consensus report generated. It is a demo synthesis, not verified truth.");
  }
  function snapshot() { return JSON.parse(JSON.stringify(state)); }
  function saveCurrent(showMessage = true) {
    if (!state.question) { showToast("There is no debate to save yet."); return; }
    const items = readStore().filter(item => item.id !== state.id);
    items.unshift(snapshot());
    const ok = writeStore(items);
    renderHistory();
    if (showMessage && ok) showToast("Debate saved on this device.");
  }
  function loadHistory(id) {
    const item = readStore().find(entry => entry.id === id);
    if (!item) { showToast("That saved debate could not be found."); return; }
    state = item;
    $("#ndr-question").value = state.question || "";
    $("#ndr-mode-select").value = state.mode || "balanced";
    renderAll();
    $("#ndr-council-section").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Saved debate opened.");
  }
  function resetDebate() {
    state = emptyState(); $("#ndr-question").value = ""; $("#ndr-report-section").hidden = true; $("#ndr-question").focus(); renderAll();
    showToast("Ready for a new debate.");
  }
  function reportMarkdown() {
    if (!state.report) return "";
    const r = state.report;
    const bullet = list => list.map(item => `- ${item}`).join("\n");
    return `# NIMBU Debate Room — Demo report\n\n**Question:** ${state.question}\n\n**Mode:** ${state.mode}\n**Status:** ${r.status}\n\n> Demo simulation only. No live AI model calls or source verification were performed.\n\n## Best-supported conclusion\n${r.conclusion}\n\n## Executive summary\n${r.summary}\n\n## Points of agreement\n${bullet(r.agreement)}\n\n## Points of disagreement\n${bullet(r.disagreement)}\n\n## Strongest contributions\n${bullet(r.strengths)}\n\n## Assumptions still open\n${bullet(r.assumptions)}\n\n## Claims to verify\n${bullet(r.verify)}\n\n## Risks and counterarguments\n${bullet(r.risks)}\n\n## Recommended next steps\n${r.nextSteps.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\n## Heuristic scorecard\n${Object.entries(r.scores).map(([name, score]) => `- ${name}: ${score}/100 (illustrative heuristic)`).join("\n")}\n\n## Confidence\n${r.confidenceExplanation}\n\n## User usefulness vote\n${r.voteText}\n`;
  }
  async function copyText(text, success) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select();
        const ok = document.execCommand("copy"); area.remove(); if (!ok) throw new Error("copy unavailable");
      }
      showToast(success || "Copied to clipboard.");
    } catch (_) { showToast("Copy was blocked by the browser. Use Export Markdown instead."); }
  }
  function exportReport() {
    if (!state.report) { showToast("Generate a consensus report first."); return; }
    const blob = new Blob([reportMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `nimbu-debate-${new Date().toISOString().slice(0, 10)}.md`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast("Markdown export prepared.");
  }
  function responseText(id) {
    const p = state.participants.find(item => item.id === id); if (!p) return "";
    return `${p.name} — ${p.role}\n\nInitial position:\n${p.initial}\n\nReasoning:\n${p.reasoning}\n\nAssumptions:\n${p.assumptions}\n\nLimitations:\n${p.limitation}\n\nEvidence to seek:\n${p.evidence}${state.rounds ? `\n\nCritique:\n${p.critique}\n\nRevision:\n${p.revision}` : ""}\n\nDEMO SIMULATION — not a live AI response.`;
  }
  function handleClick(event) {
    const example = event.target.closest("[data-example]");
    if (example) { $("#ndr-question").value = example.dataset.example; $("#ndr-char-count").textContent = `${example.dataset.example.length} / ${MAX_Q}`; $("#ndr-question").focus(); return; }
    const btn = event.target.closest("[data-action]"); if (!btn) return;
    const action = btn.dataset.action, id = btn.dataset.id;
    if (action === "theme") {
      const light = document.body.dataset.theme !== "light"; document.body.dataset.theme = light ? "light" : "dark"; document.documentElement.dataset.debateTheme = light ? "light" : "dark"; return;
    }
    if (action === "reset") return resetDebate();
    if (action === "cancel") return resetDebate();
    if (action === "critique") return runCritique();
    if (action === "consensus") return generateConsensus();
    if (action === "vote") { state.userVote = id; renderVotes(); if (state.report) { state.report = buildReport(); renderReport(); } if ($("#ndr-save-toggle").checked) saveCurrent(false); return; }
    if (action === "feedback") {
      const p = state.participants.find(item => item.id === id); if (!p) return;
      p.feedback = p.feedback === btn.dataset.value ? "" : btn.dataset.value; renderResponses(); if ($("#ndr-save-toggle").checked) saveCurrent(false); return;
    }
    if (action === "copy-answer") return copyText(responseText(id), "Perspective copied.");
    if (action === "expand") {
      const card = $(`[data-card="${id}"]`); if (!card) return;
      const body = $(".ndr-response-body", card); const expanded = btn.getAttribute("aria-expanded") === "true";
      body.hidden = expanded; btn.setAttribute("aria-expanded", String(!expanded)); btn.textContent = expanded ? "Expand details" : "Collapse details"; return;
    }
    if (action === "copy-report") return copyText(reportMarkdown(), "Report copied.");
    if (action === "export-report") return exportReport();
    if (action === "save-report") return saveCurrent(true);
    if (action === "clear-history") { if (!confirm("Delete all saved debates from this device? This cannot be undone.")) return; writeStore([]); renderHistory(); showToast("Saved debate history cleared."); return; }
    if (action === "delete-history") { if (!confirm("Delete this saved debate?")) return; writeStore(readStore().filter(item => item.id !== id)); renderHistory(); showToast("Saved debate deleted."); return; }
    if (action === "load-history") return loadHistory(id);
  }
  $("#ndr-form").addEventListener("submit", event => { event.preventDefault(); startDebate($("#ndr-question").value); });
  $("#ndr-question").addEventListener("input", () => { $("#ndr-char-count").textContent = `${$("#ndr-question").value.length} / ${MAX_Q}`; });
  root.addEventListener("click", handleClick);
  $("#ndr-mode-select").addEventListener("change", () => { if (state.question) { state.mode = $("#ndr-mode-select").value; renderTimeline(); } });
  renderAll();
  global.NIMBUDebateRoom = Object.freeze({
    mode: "demo",
    render: () => { location.href = "./debate.html"; },
    getState: () => snapshot()
  });
})(window);
