// API Configuration
const OPENAI_API_KEY = // retrieve from .env file
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Mentor Mindset System Prompt
const MENTOR_MINDSET_PROMPT = `You are an expert in David Yeager's "Mentor Mindset" and related practices. Your goal is to help generate messages that effectively use these practices.

COMPREHENSIVE MENTOR PRACTICES TOOLKIT:

**CORE PRACTICES:**
1. **The Sergio Trifecta (Validate, Seek, Collaborate)**:
   - V: Validate feelings without judgment ("I can understand why you'd feel that way")
   - S: Seek to understand through curious questions ("Can you tell me more about...")  
   - O: Offer to collaborate as partners ("Let's think about this together")

2. **Transparency Statements**: Explain your intentions early ("I'm giving you feedback because I want to help you succeed")

3. **Honor Agency & Status**: Respect their autonomy, avoid invoking your authority ("What do you think would work?")

4. **Stress Reframing**: Frame stress as caring/potential for growth ("The fact that you're worried shows you care")

**ADVANCED PRACTICES:**
5. **Collaborative Troubleshooting (Surface, Validate, Bridge)**:
   - Surface: "What were you thinking when..."
   - Validate: "That makes sense because..."
   - Bridge: "Building on that, what if we..."

6. **Purpose Note (Skills, Personal Benefit, Greater Good)**:
   - What skills will they gain?
   - How will it benefit them personally?
   - How can they help others with these skills?

7. **Belonging Stories (Struggle, Change, Action, Ripple)**:
   - S: Acknowledge the struggle is normal
   - C: Change is possible with effort
   - A: Specific actions they can take
   - R: How it will positively impact their future

8. **Growth Mindset Messaging**: Emphasize "not yet" vs "can't do"

9. **Fast Friends Protocol**: Build connection through graduated self-disclosure

10. **Mentoring Committee Approach**: Help them identify multiple sources of support`;

// Practice descriptions mapping
const PRACTICE_DESCRIPTIONS = {
  "sergio-trifecta": "The Sergio Trifecta (Validate, Seek, Collaborate)",
  transparency: "Transparency Statements",
  "honor-agency": "Honor Agency & Status",
  "stress-reframing": "Stress Reframing",
  "collaborative-troubleshooting": "Collaborative Troubleshooting",
  "purpose-note": "Purpose Note",
  "belonging-stories": "Belonging Stories",
  "growth-mindset": "Growth Mindset Messaging",
};

// DOM Elements
const messageIntent = document.getElementById("messageIntent");
const generateBtn = document.getElementById("generateBtn");
const clearGenBtn = document.getElementById("clearGenBtn");
const generatorResults = document.getElementById("generatorResults");
const generatorLoading = document.getElementById("generatorLoading");
const generatedContent = document.getElementById("generatedContent");
const generatedText = document.getElementById("generatedText");
const copyBtn = document.getElementById("copyBtn");
const senderRole = document.getElementById("senderRole");
const recipientRole = document.getElementById("recipientRole");
const messageLength = document.getElementById("messageLength");
const formality = document.getElementById("formality");
const additionalContext = document.getElementById("additionalContext");

// Event Listeners
generateBtn.addEventListener("click", generateMessage);
clearGenBtn.addEventListener("click", clearForm);
copyBtn.addEventListener("click", copyToClipboard);
messageIntent.addEventListener("input", validateForm);

// Validate form
function validateForm() {
  const hasIntent = messageIntent.value.trim().length > 0;
  const selectedPractices = getSelectedPractices();
  generateBtn.disabled = !hasIntent || selectedPractices.length === 0;
}

// Get selected practices
function getSelectedPractices() {
  const checkboxes = document.querySelectorAll(
    '.practice-checkbox input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map((cb) => cb.value);
}

// Clear form
function clearForm() {
  messageIntent.value = "";
  additionalContext.value = "";
  senderRole.value = "";
  recipientRole.value = "";
  messageLength.value = "moderate";
  formality.value = "friendly";

  // Uncheck all practices
  document
    .querySelectorAll('.practice-checkbox input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });

  generatorResults.style.display = "none";
  generatedText.textContent = "";
  validateForm();
}

// Generate message
async function generateMessage() {
  const intent = messageIntent.value.trim();
  const selectedPractices = getSelectedPractices();

  if (!intent || selectedPractices.length === 0) {
    alert("Please enter your message intent and select at least one practice.");
    return;
  }

  // Show loading state
  generatorResults.style.display = "block";
  generatorLoading.style.display = "flex";
  generatedContent.style.display = "none";
  generateBtn.disabled = true;

  try {
    // Build the prompt
    const practicesList = selectedPractices
      .map((p) => PRACTICE_DESCRIPTIONS[p])
      .join(", ");

    let prompt = `Generate a message using the Mentor Mindset framework.\n\n`;
    prompt += `MESSAGE INTENT: ${intent}\n\n`;
    prompt += `PRACTICES TO USE: ${practicesList}\n\n`;

    if (senderRole.value) {
      prompt += `SENDER ROLE: ${senderRole.value}\n`;
    }
    if (recipientRole.value) {
      prompt += `RECIPIENT ROLE: ${recipientRole.value}\n`;
    }

    prompt += `MESSAGE LENGTH: ${messageLength.value}\n`;
    prompt += `FORMALITY: ${formality.value}\n`;

    if (additionalContext.value.trim()) {
      prompt += `\nADDITIONAL CONTEXT: ${additionalContext.value}\n`;
    }
    if (specialNeeds.value.trim()) {
      prompt += `Write a message optimal for an individual with a(n) ${specialNeeds.value}\n`;
    }
    prompt += `\nPlease generate a message that naturally incorporates the selected Mentor Mindset practices. Write only the message itself, without explanations or labels.`;

    // Call OpenAI API
    const message = await callOpenAI(prompt);

    // Display result
    displayGeneratedMessage(message);
  } catch (error) {
    console.error("Error generating message:", error);
    showError("Failed to generate message. Please try again.");
  } finally {
    generatorLoading.style.display = "none";
    generateBtn.disabled = false;
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
            content: MENTOR_MINDSET_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No message generated.";
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to get response from the AI service.");
  }
}

// Display generated message
function displayGeneratedMessage(message) {
  generatedText.textContent = message;
  generatedContent.style.display = "block";
  copyBtn.classList.remove("copied");
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
}

// Copy to clipboard
async function copyToClipboard() {
  const text = generatedText.textContent;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
    alert("Failed to copy to clipboard");
  }
}

// Show error
function showError(message) {
  generatedText.textContent = message;
  generatedContent.style.display = "block";
}

// Add event listeners to checkboxes for validation
document
  .querySelectorAll('.practice-checkbox input[type="checkbox"]')
  .forEach((cb) => {
    cb.addEventListener("change", validateForm);
  });

// Initialize
validateForm();
