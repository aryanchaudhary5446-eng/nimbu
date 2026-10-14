
"use strict";

(() => {
  if (document.getElementById("kitto-launcher")) return;

  const face = `
    <span class="kitto-eye"></span>
    <span class="kitto-eye"></span>
  `;

  const launcher = document.createElement("button");
  launcher.id = "kitto-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open KITTO AI chat");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = `<span class="kitto-face">${face}</span>`;

  const panel = document.createElement("section");
  panel.id = "kitto-panel";
  panel.setAttribute("aria-label", "KITTO AI assistant");
  panel.setAttribute("aria-hidden", "true");

  panel.innerHTML = `
    <header id="kitto-header">
      <span class="kitto-face" aria-hidden="true">${face}</span>
      <div>
        <div id="kitto-title">KITTO AI</div>
        <div id="kitto-status">● Your AI companion</div>
      </div>
      <button id="kitto-close" type="button"
        aria-label="Close KITTO chat">×</button>
    </header>

    <div id="kitto-messages" role="log" aria-live="polite"></div>

    <div id="kitto-suggestions">
      <button class="kitto-suggestion" type="button">Help me with a task</button>
      <button class="kitto-suggestion" type="button">Give me ideas</button>
      <button class="kitto-suggestion" type="button">Explain something</button>
    </div>

    <form id="kitto-form">
      <textarea id="kitto-input" rows="1"
        placeholder="Message KITTO..."
        aria-label="Message KITTO" required></textarea>
      <button id="kitto-send" type="submit"
        aria-label="Send message">➤</button>
    </form>
  `;

  document.body.append(launcher, panel);

  const messages = panel.querySelector("#kitto-messages");
  const form = panel.querySelector("#kitto-form");
  const input = panel.querySelector("#kitto-input");
  const send = panel.querySelector("#kitto-send");
  const close = panel.querySelector("#kitto-close");
  const suggestions = panel.querySelector("#kitto-suggestions");
  const status = panel.querySelector("#kitto-status");

  let busy = false;
  let history = [];

  function openChat() {
    panel.classList.add("kitto-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("kitto-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  function addMessage(text, who) {
    const row = document.createElement("div");
    row.className = "kitto-row" +
      (who === "user" ? " kitto-user" : "");

    if (who !== "user") {
      const avatar = document.createElement("span");
      avatar.className = "kitto-message-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.innerHTML = face;
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "kitto-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "kitto-row";
    row.id = "kitto-typing-row";

    const avatar = document.createElement("span");
    avatar.className = "kitto-message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.innerHTML = face;

    const bubble = document.createElement("div");
    bubble.className = "kitto-bubble kitto-typing";
    bubble.setAttribute("aria-label", "KITTO is replying");

    for (let i = 0; i < 3; i++) {
      bubble.appendChild(document.createElement("span"));
    }

    row.append(avatar, bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  addMessage(
    "Hey! I'm KITTO, your AI companion. What can I help you with?",
    "assistant"
  );

  launcher.addEventListener("click", () => {
    if (panel.classList.contains("kitto-open")) closeChat();
    else openChat();
  });

  close.addEventListener("click", closeChat);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" &&
        panel.classList.contains("kitto-open")) {
      closeChat();
    }
  });

  suggestions.addEventListener("click", event => {
    const button = event.target.closest(".kitto-suggestion");
    if (!button || busy) return;

    input.value = button.textContent === "Help me with a task"
      ? "Help me with a task."
      : button.textContent === "Give me ideas"
      ? "Give me creative ideas for a useful AI project."
      : "Explain a topic in simple words.";

    form.requestSubmit();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question || busy) return;

    busy = true;
    send.disabled = true;
    input.disabled = true;
    suggestions.hidden = true;

    addMessage(question, "user");
    input.value = "";

    const typing = showTyping();
    status.textContent = "● Replying";

    try {
      const client = window.NIMBU_SUPABASE;

      if (!client || !client.functions) {
        throw new Error(
          "KITTO connection isn't loaded. Refresh NIMBU and try again."
        );
      }

      const { data, error } = await client.functions.invoke(
        "swift-endpoint",
        {
          body: { question }
        }
      );

      if (error) throw error;

      const answer = data && data.answer;
      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The AI returned an empty reply. Please try again.");
      }

      history.push(
        { role: "user", content: question },
        { role: "assistant", content: answer }
      );

      // Keep recent context available in this widget session.
      if (history.length > 12) history = history.slice(-12);

      typing.remove();
      addMessage(answer, "assistant");
      status.textContent = "● Your AI companion";
    } catch (error) {
      typing.remove();
      addMessage(
        "I couldn't get a reply just now. Please check your connection and try again.",
        "assistant"
      );
      status.textContent = "● Connection issue";
      console.error("KITTO AI error:", error);
    } finally {
      busy = false;
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

})();
