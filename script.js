// API Configuration
const OPENAI_API_KEY = // retrieve from .env file
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Journal Entry Storage
let journalEntries = [];
let currentEntryId = null;
let selectedStickyNoteColor = "#fef08a";
let selectedHighlightColor = "#fef08a";
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;

// DOM Elements
const newEntryBtn = document.getElementById("newEntryBtn");
const entriesList = document.getElementById("entriesList");
const emptyState = document.getElementById("emptyState");
const journalEditor = document.getElementById("journalEditor");
const entryTitle = document.getElementById("entryTitle");
const entryContent = document.getElementById("entryContent");
const fontSelect = document.getElementById("fontSelect");
const highlightBtn = document.getElementById("highlightBtn");
const highlightColorSelect = document.getElementById("highlightColor");
const stickyNoteBtn = document.getElementById("stickyNoteBtn");
const stickerBtn = document.getElementById("stickerBtn");
const saveEntryBtn = document.getElementById("saveEntryBtn");
const deleteEntryBtn = document.getElementById("deleteEntryBtn");
const analyzeEntryBtn = document.getElementById("analyzeEntryBtn");
const stickerModal = document.getElementById("stickerModal");
const closeStickerModal = document.getElementById("closeStickerModal");
const stickyNoteModal = document.getElementById("stickyNoteModal");
const closeStickyNoteModal = document.getElementById("closeStickyNoteModal");
const stickyNoteText = document.getElementById("stickyNoteText");
const addStickyNoteBtn = document.getElementById("addStickyNoteBtn");
const aiAnalysisSection = document.getElementById("aiAnalysisSection");
const analysisLoading = document.getElementById("analysisLoading");
const analysisResultsContainer = document.getElementById(
  "analysisResultsContainer"
);
const emotionAnalysis = document.getElementById("emotionAnalysis");
const adviceContent = document.getElementById("adviceContent");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadEntries();
  setupEventListeners();
  renderEntriesList();
});

// Setup Event Listeners
function setupEventListeners() {
  newEntryBtn.addEventListener("click", createNewEntry);
  saveEntryBtn.addEventListener("click", saveCurrentEntry);
  deleteEntryBtn.addEventListener("click", deleteCurrentEntry);
  analyzeEntryBtn.addEventListener("click", analyzeJournalEntry);
  fontSelect.addEventListener("change", changeFontFamily);
  highlightBtn.addEventListener("click", toggleHighlight);
  highlightColorSelect.addEventListener("change", (e) => {
    selectedHighlightColor = e.target.value;
  });
  stickyNoteBtn.addEventListener("click", () => openModal(stickyNoteModal));
  stickerBtn.addEventListener("click", () => openModal(stickerModal));
  closeStickerModal.addEventListener("click", () => closeModal(stickerModal));
  closeStickyNoteModal.addEventListener("click", () =>
    closeModal(stickyNoteModal)
  );
  addStickyNoteBtn.addEventListener("click", addStickyNote);

  // Sticker selection
  document.querySelectorAll(".sticker-item").forEach((item) => {
    item.addEventListener("click", () => {
      insertSticker(item.getAttribute("data-sticker"));
      closeModal(stickerModal);
    });
  });

  // Sticky note color selection
  document.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", () => {
      document
        .querySelectorAll(".color-option")
        .forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedStickyNoteColor = option.getAttribute("data-color");
    });
  });

  // Auto-save on content change
  entryContent.addEventListener("input", debounce(autoSave, 2000));
  entryTitle.addEventListener("input", debounce(autoSave, 2000));
}

// Load entries from localStorage
function loadEntries() {
  const saved = localStorage.getItem("journalEntries");
  if (saved) {
    journalEntries = JSON.parse(saved);
  }
}

// Save entries to localStorage
function saveEntries() {
  localStorage.setItem("journalEntries", JSON.stringify(journalEntries));
}

// Create new entry
function createNewEntry() {
  const newEntry = {
    id: Date.now(),
    title: "Untitled Entry",
    content: "",
    date: new Date().toISOString(),
    font: "Inter",
  };

  journalEntries.unshift(newEntry);
  saveEntries();
  renderEntriesList();
  loadEntry(newEntry.id);
}

// Load entry into editor
function loadEntry(entryId) {
  const entry = journalEntries.find((e) => e.id === entryId);
  if (!entry) return;

  currentEntryId = entryId;
  entryTitle.value = entry.title;
  entryContent.innerHTML = entry.content;
  fontSelect.value = entry.font;
  changeFontFamily();

  emptyState.style.display = "none";
  journalEditor.style.display = "block";

  // Make existing sticky notes and stickers draggable
  setTimeout(() => {
    entryContent.querySelectorAll(".sticky-note").forEach((note) => {
      makeDraggable(note);
    });
  }, 100);

  // Update active state in list
  document.querySelectorAll(".entry-item").forEach((item) => {
    item.classList.toggle(
      "active",
      parseInt(item.getAttribute("data-id")) === entryId
    );
  });
}

// Save current entry
function saveCurrentEntry() {
  if (!currentEntryId) return;

  const entry = journalEntries.find((e) => e.id === currentEntryId);
  if (!entry) return;

  entry.title = entryTitle.value || "Untitled Entry";
  entry.content = entryContent.innerHTML;
  entry.font = fontSelect.value;
  entry.lastModified = new Date().toISOString();

  saveEntries();
  renderEntriesList();
  showNotification("Entry saved!", "success");
}

// Auto-save
function autoSave() {
  if (currentEntryId) {
    saveCurrentEntry();
  }
}

// Delete current entry
function deleteCurrentEntry() {
  if (!currentEntryId) return;

  if (!confirm("Are you sure you want to delete this entry?")) return;

  journalEntries = journalEntries.filter((e) => e.id !== currentEntryId);
  saveEntries();
  renderEntriesList();

  currentEntryId = null;
  journalEditor.style.display = "none";
  emptyState.style.display = "flex";

  showNotification("Entry deleted", "success");
}

// Render entries list
function renderEntriesList() {
  if (journalEntries.length === 0) {
    entriesList.innerHTML =
      '<p style="padding: 1rem; text-align: center; color: #8b6f47;">No entries yet</p>';
    return;
  }

  entriesList.innerHTML = journalEntries
    .map((entry) => {
      const date = new Date(entry.date);
      const preview = stripHtml(entry.content).substring(0, 100);

      return `
            <div class="entry-item ${
              entry.id === currentEntryId ? "active" : ""
            }" data-id="${entry.id}">
                <div class="entry-item-title">${escapeHtml(entry.title)}</div>
                <div class="entry-item-date">${formatDate(date)}</div>
                ${
                  preview
                    ? `<div class="entry-item-preview">${escapeHtml(
                        preview
                      )}...</div>`
                    : ""
                }
            </div>
        `;
    })
    .join("");

  // Add click listeners
  document.querySelectorAll(".entry-item").forEach((item) => {
    item.addEventListener("click", () => {
      loadEntry(parseInt(item.getAttribute("data-id")));
    });
  });
}

// Change font family
function changeFontFamily() {
  const font = fontSelect.value;
  entryContent.style.fontFamily =
    font === "Inter"
      ? "Inter, sans-serif"
      : font === "Times New Roman"
      ? "Times New Roman, serif"
      : font === "Papyrus"
      ? "Papyrus, fantasy"
      : "Indie Flower, cursive";
}

// Toggle highlight
function toggleHighlight() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) {
    showNotification("Please select some text to highlight", "info");
    return;
  }

  // Check if we're inside the entry content
  if (!entryContent.contains(range.commonAncestorContainer)) {
    showNotification("Please select text within your journal entry", "info");
    return;
  }

  const span = document.createElement("span");
  span.className = "highlight";
  span.style.background = selectedHighlightColor;

  try {
    range.surroundContents(span);
  } catch (e) {
    // If surroundContents fails, use alternative method
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  // Clear selection
  selection.removeAllRanges();

  showNotification("Text highlighted!", "success");
}

// Insert sticker
function insertSticker(emoji) {
  const span = document.createElement("span");
  span.className = "sticker";
  span.textContent = emoji;
  span.contentEditable = "false";

  // Add space after sticker for easier typing
  const space = document.createTextNode(" ");

  // Focus on entry content first
  entryContent.focus();

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(space);
    range.insertNode(span);

    // Move cursor after the sticker
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    entryContent.appendChild(span);
    entryContent.appendChild(space);
  }

  showNotification("Sticker added!", "success");
}

// Add sticky note
function addStickyNote() {
  const text = stickyNoteText.value.trim();
  if (!text) {
    showNotification("Please enter some text for the sticky note", "info");
    return;
  }

  const stickyNote = document.createElement("div");
  stickyNote.className = "sticky-note";
  stickyNote.style.background = selectedStickyNoteColor;

  // Create text content
  const textNode = document.createTextNode(text);
  stickyNote.appendChild(textNode);

  // Create remove button
  const removeBtn = document.createElement("button");
  removeBtn.className = "sticky-note-remove";
  removeBtn.innerHTML = "×";
  removeBtn.onclick = function () {
    this.parentElement.remove();
    showNotification("Sticky note removed", "success");
  };
  stickyNote.appendChild(removeBtn);

  // Make sticky note non-editable but allow removal
  stickyNote.contentEditable = "false";

  // Focus on entry content
  entryContent.focus();

  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.insertNode(stickyNote);

    // Add space after sticky note
    const space = document.createTextNode(" ");
    range.collapse(false);
    range.insertNode(space);
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    entryContent.appendChild(stickyNote);
    entryContent.appendChild(document.createTextNode(" "));
  }

  // Make sticky note draggable
  makeDraggable(stickyNote);

  stickyNoteText.value = "";
  closeModal(stickyNoteModal);
  showNotification("Sticky note added!", "success");
}

// Make element draggable
function makeDraggable(element) {
  element.addEventListener("mousedown", startDrag);
}

function startDrag(e) {
  // Don't drag if clicking the remove button
  if (e.target.classList.contains("sticky-note-remove")) return;

  draggedElement = e.currentTarget;
  draggedElement.classList.add("dragging");

  const rect = draggedElement.getBoundingClientRect();
  const parentRect = entryContent.getBoundingClientRect();

  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);

  e.preventDefault();
}

function drag(e) {
  if (!draggedElement) return;

  const parentRect = entryContent.getBoundingClientRect();

  let x = e.clientX - parentRect.left - offsetX;
  let y = e.clientY - parentRect.top - offsetY;

  // Keep within bounds
  x = Math.max(0, Math.min(x, parentRect.width - draggedElement.offsetWidth));
  y = Math.max(0, Math.min(y, parentRect.height - draggedElement.offsetHeight));

  draggedElement.style.left = x + "px";
  draggedElement.style.top = y + "px";
}

function stopDrag() {
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
    draggedElement = null;
  }
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
}

// Modal functions
function openModal(modal) {
  modal.classList.add("active");
}

function closeModal(modal) {
  modal.classList.remove("active");
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === "success" ? "#10b981" : "#4f46e5"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Analyze journal entry with AI
async function analyzeJournalEntry() {
  const content = stripHtml(entryContent.innerHTML);

  if (!content.trim()) {
    showNotification(
      "Please write something in your journal entry first!",
      "info"
    );
    return;
  }

  // Show analysis section and loading state
  aiAnalysisSection.style.display = "block";
  analysisLoading.style.display = "flex";
  analysisResultsContainer.style.display = "none";
  analyzeEntryBtn.disabled = true;

  try {
    // Call OpenAI API for emotional analysis
    const analysisPrompt = `Analyze the following journal entry and identify the main emotions present. List 3-5 key emotions with brief explanations of why you identified them.

Journal Entry: "${content}"

Provide your response in this format:
EMOTIONS:
- [Emotion 1]: [Brief explanation]
- [Emotion 2]: [Brief explanation]
etc.`;

    const emotionResponse = await callOpenAI(analysisPrompt);

    // Call OpenAI API for advice
    const advicePrompt = `Based on the following journal entry and emotional analysis, provide 2-3 sentences of thoughtful, supportive advice or insights that could help the person process their feelings or situation.

Journal Entry: "${content}"

Emotional Analysis: ${emotionResponse}

Provide warm, empathetic advice:`;

    const adviceResponse = await callOpenAI(advicePrompt);

    // Display results
    displayAnalysisResults(emotionResponse, adviceResponse);
  } catch (error) {
    console.error("Error analyzing entry:", error);
    showNotification("Failed to analyze entry. Please try again.", "error");
    aiAnalysisSection.style.display = "none";
  } finally {
    analysisLoading.style.display = "none";
    analyzeEntryBtn.disabled = false;
  }
}

// Call OpenAI API
async function callOpenAI(prompt) {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a compassionate and insightful emotional support assistant. You help people understand their emotions and provide thoughtful guidance.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No analysis available.";
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to get response from the AI service.");
  }
}

// Display analysis results
function displayAnalysisResults(emotions, advice) {
  // Format emotions
  const emotionLines = emotions.split("\n").filter((line) => line.trim());
  const emotionList = [];
  let emotionHTML = "<ul>";
  emotionLines.forEach((line) => {
    if (line.trim() && !line.match(/^EMOTIONS?:/i)) {
      const cleaned = line.replace(/^[-•*]\s*/, "");
      if (cleaned) {
        emotionHTML += `<li>${cleaned}</li>`;
        emotionList.push(cleaned);
      }
    }
  });
  emotionHTML += "</ul>";

  emotionAnalysis.innerHTML = emotionHTML;

  // Format advice
  adviceContent.innerHTML = `<p>${advice}</p>`;

  // Save emotion data for analytics
  saveEmotionData(currentEntryId, emotionList);

  // Show results
  analysisResultsContainer.style.display = "grid";

  // Scroll to results
  aiAnalysisSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Save emotion data for analytics
function saveEmotionData(entryId, emotions) {
  const emotionData = JSON.parse(
    localStorage.getItem("journalEmotions") || "{}"
  );
  emotionData[entryId] = emotions;
  localStorage.setItem("journalEmotions", JSON.stringify(emotionData));
}

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal(e.target);
  }
});
