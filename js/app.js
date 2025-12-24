// Campus AI - Apple Style Chat Assistant
const API_KEY = "API_KEY_HERE";

// DOM Elements
const messagesDiv = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const welcomeScreen = document.getElementById("welcomeScreen");
const messagesContainer = document.getElementById("messagesContainer");
const inputArea = document.querySelector(".input-area");
const typingIndicator = document.getElementById("typingIndicator");

// Initialize chat history
let chatHistory = [];

// Chat Functions
async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;

  // Show chat interface and hide welcome screen
  welcomeScreen.style.display = 'none';
  messagesContainer.style.display = 'block';
  inputArea.style.display = 'block';

  // Add user message
  addMessage("You", userText, "user");
  userInput.value = "";
  
  // Show typing indicator
  typingIndicator.classList.add("active");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userText }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    typingIndicator.classList.remove("active");

    if (data.choices && data.choices[0]) {
      addMessage("Campus AI", data.choices[0].message.content, "ai");
      // Save to history
      saveToHistory(userText, data.choices[0].message.content);
    } else {
      addMessage("Error", "Sorry, I couldn't process your request.", "ai");
    }

  } catch (error) {
    typingIndicator.classList.remove("active");
    addMessage("Error", "Something went wrong. Please try again.", "ai");
    console.error("API Error:", error);
  }
}

function addMessage(sender, text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const avatarIcon = className === "user" ? "fas fa-user" : "fas fa-robot";
  const avatarBg = className === "user" ? "var(--apple-blue)" : "linear-gradient(135deg, #FF2D55, #FF9500)";
  
  messageDiv.innerHTML = `
    <div class="message-avatar" style="background: ${avatarBg}">
      <i class="${avatarIcon}"></i>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-sender">${sender}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${formatMessage(text)}</div>
    </div>
  `;
  
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatMessage(text) {
  // Basic markdown formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

function saveToHistory(userMessage, aiResponse) {
  const historyItem = {
    id: Date.now(),
    user: userMessage,
    ai: aiResponse,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString()
  };
  
  chatHistory.unshift(historyItem); // Add to beginning
  if (chatHistory.length > 10) chatHistory.pop(); // Keep only last 10
  
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = document.getElementById("chatHistory");
  const historyEmpty = document.querySelector(".history-empty");
  
  if (chatHistory.length === 0) {
    historyEmpty.style.display = "block";
    return;
  }
  
  historyEmpty.style.display = "none";
  
  // Clear existing items (except empty state)
  const items = historyList.querySelectorAll(".history-item");
  items.forEach(item => item.remove());
  
  // Add history items
  chatHistory.forEach(item => {
    const historyItem = document.createElement("button");
    historyItem.className = "history-item";
    historyItem.innerHTML = `
      <i class="fas fa-comment history-icon"></i>
      <div class="history-preview">
        <div class="history-title">${item.user.substring(0, 30)}${item.user.length > 30 ? '...' : ''}</div>
        <div class="history-time">${item.time} • ${item.date}</div>
      </div>
    `;
    
    historyItem.addEventListener("click", () => loadHistory(item));
    historyList.appendChild(historyItem);
  });
}

function loadHistory(item) {
  welcomeScreen.style.display = 'none';
  messagesContainer.style.display = 'block';
  inputArea.style.display = 'block';
  
  // Clear current messages
  messagesDiv.innerHTML = '';
  
  // Add the historical conversation
  addMessage("You", item.user, "user");
  addMessage("Campus AI", item.ai, "ai");
}

// Event Listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Quick Actions and Suggestions
document.querySelectorAll(".action-card, .suggestion-chip").forEach(button => {
  button.addEventListener("click", function() {
    const prompt = this.getAttribute("data-prompt");
    userInput.value = prompt;
    setTimeout(() => sendMessage(), 100);
  });
});

// Mobile Sidebar Functionality
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.createElement('div');
  
  // Create overlay element
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);
  
  // Toggle sidebar on mobile
  menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close sidebar when clicking overlay
  sidebarOverlay.addEventListener('click', function() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(event) {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(event.target) && 
          !menuToggle.contains(event.target) &&
          sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
  
  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > 1024) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }, 250);
  });
  
  // ESC key closes sidebar
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // Modal functionality
  const settingsBtn = document.getElementById('settingsBtn');
  const helpBtn = document.getElementById('helpBtn');
  const themeToggle = document.getElementById('themeToggle');
  const settingsModal = document.getElementById('settingsModal');
  const helpModal = document.getElementById('helpModal');
  const closeSettings = document.getElementById('closeSettings');
  const closeHelp = document.getElementById('closeHelp');
  
  // Settings modal
  settingsBtn?.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });
  
  closeSettings?.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });
  
  // Help modal
  helpBtn?.addEventListener('click', () => {
    helpModal.classList.add('active');
  });
  
  closeHelp?.addEventListener('click', () => {
    helpModal.classList.remove('active');
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
    if (event.target === helpModal) {
      helpModal.classList.remove('active');
    }
  });
  
  // Theme toggle
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.style.colorScheme === 'dark';
    document.documentElement.style.colorScheme = isDark ? 'light' : 'dark';
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  });
  
  // Initialize
  updateHistoryDisplay();
});