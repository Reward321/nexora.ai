
const companySelect = document.getElementById("companySelect");
const companyName = document.getElementById("companyName");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const suggestions = document.getElementById("suggestions");

let currentCompany = null;
let busy = false;

function addMessage(text, type, sources = []) {
  const message = document.createElement("div");
  message.className = `message ${type}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = type === "user"
    ? "You"
    : (currentCompany?.name || "Assistant");

  const body = document.createElement("div");
  body.textContent = text;

  message.append(label, body);

  if (type === "assistant" && sources.length) {
    const sourceBox = document.createElement("div");
    sourceBox.className = "sources";
    sourceBox.textContent = "Policy sources: " + sources.join(", ");
    message.appendChild(sourceBox);
  }

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function showWelcome() {
  chatMessages.replaceChildren();

  const box = document.createElement("div");
  box.className = "empty-state";

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.textContent = "✳";

  const heading = document.createElement("h3");
  heading.textContent = currentCompany
    ? `Ask ${currentCompany.name} a question`
    : "Ask a policy question";

  const paragraph = document.createElement("p");
  paragraph.textContent = currentCompany
    ? currentCompany.welcome_message
    : "Choose a company to get started.";

  box.append(icon, heading, paragraph);
  chatMessages.appendChild(box);
}

async function loadCompanies() {
  companySelect.innerHTML = '<option value="">Loading...</option>';

  try {
    const response = await fetch("/api/companies");
    if (!response.ok) throw new Error("Could not load companies.");

    const companies = await response.json();
    companySelect.replaceChildren();

    if (!companies.length) {
      companySelect.add(new Option("No published companies", ""));
      showWelcome();
      return;
    }

    for (const company of companies) {
      companySelect.add(new Option(company.name, company.slug));
    }

    await loadCompany(companySelect.value);
  } catch (error) {
    companySelect.replaceChildren(
      new Option("Could not load companies", "")
    );
    companyName.textContent = "Connection error";
    chatMessages.replaceChildren();
    addMessage(
      error.message + " Check your Vercel and Supabase configuration.",
      "assistant"
    );
  }
}

async function loadCompany(slug) {
  if (!slug) {
    currentCompany = null;
    companyName.textContent = "Policy assistant";
    showWelcome();
    return;
  }

  companyName.textContent = "Loading company...";
  chatMessages.replaceChildren();

  try {
    const response = await fetch(
      "/api/company?slug=" + encodeURIComponent(slug)
    );

    if (!response.ok) throw new Error("Could not load this company.");

    currentCompany = await response.json();
    companyName.textContent = currentCompany.name;
    showWelcome();
  } catch (error) {
    currentCompany = null;
    companyName.textContent = "Could not load company";
    addMessage(error.message, "assistant");
  }
}

async function sendQuestion(question) {
  if (busy || !currentCompany) return;

  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;

  if (cleanQuestion.length > 1000) {
    addMessage("Please keep your question under 1,000 characters.", "assistant");
    return;
  }

  busy = true;
  sendButton.disabled = true;
  questionInput.disabled = true;

  const emptyState = chatMessages.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  addMessage(cleanQuestion, "user");
  questionInput.value = "";

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.textContent = "Reading the policy...";
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: currentCompany.slug,
        question: cleanQuestion
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The assistant could not answer.");
    }

    typing.remove();
    addMessage(data.answer, "assistant", data.sources || []);
  } catch (error) {
    typing.remove();
    addMessage(
      error.message || "Something went wrong. Please try again.",
      "assistant"
    );
  } finally {
    busy = false;
    sendButton.disabled = false;
    questionInput.disabled = false;
    questionInput.focus();
  }
}

companySelect.addEventListener("change", () => {
  loadCompany(companySelect.value);
});

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  sendQuestion(questionInput.value);
});

clearButton.addEventListener("click", () => {
  if (busy) return;
  showWelcome();
});

suggestions.addEventListener("click", event => {
  const button = event.target.closest("button[data-question]");
  if (!button) return;
  sendQuestion(button.dataset.question);
});

questionInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

loadCompanies();
