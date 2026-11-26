
const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(message, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = message;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

async function sendMessage() {
  const message = userInput.value.trim();

  if (!message) return;

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.remove();

  addMessage(message, "user");
  userInput.value = "";

  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";

  const loading = addMessage("Nova is thinking...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    loading.textContent = data.reply || "No response received.";

  } catch (error) {
    loading.textContent = "Error: " + error.message;
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send ➤";
    userInput.focus();
  }
}

function newChat() {
  chatArea.innerHTML = `
    <div class="welcome" id="welcome">
      <h1>Welcome to Nova AI ✨</h1>
      <p>Your intelligent Agentic AI assistant.<br>
      Ask questions, solve problems and plan your studies.</p>
    </div>
  `;
}

userInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});
