/* NIMBU Debate Room configuration. Public, non-secret settings only. */
(function (global) {
  "use strict";
  global.NIMBU_DEBATE_CONFIG = Object.freeze({
    version: 1,
    mode: "demo",
    storageKey: "nimbu.debateRoom.v1",
    maxQuestionLength: 1200,
    maxSavedDebates: 30,
    maxCritiqueRounds: 2,
    liveEndpoint: "", // Optional same-origin/server endpoint. Never put API keys here.
    personas: [
      { id: "builder", name: "Builder", role: "Practical strategist", icon: "✦", color: "violet" },
      { id: "skeptic", name: "Skeptic", role: "Risk challenger", icon: "◈", color: "rose" },
      { id: "researcher", name: "Researcher", role: "Evidence auditor", icon: "⌕", color: "cyan" },
      { id: "judge", name: "Judge", role: "Neutral synthesizer", icon: "⚖", color: "amber" }
    ]
  });
})(window);
