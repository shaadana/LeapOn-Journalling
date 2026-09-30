// API Configuration
const OPENAI_API_KEY = //retrieve from .env file
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Mentor Mindset System Prompt
const MENTOR_MINDSET_PROMPT = `You are an expert in David Yeager's "Mentor Mindset" and related practices. Your goal is to analyze a user-provided message and give comprehensive advice on how to respond using the most appropriate practices.

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

10. **Mentoring Committee Approach**: Help them identify multiple sources of support

**SITUATIONAL PRACTICES:**
11. **Academic Struggles**: Combine Trifecta + Purpose Note + Stress Reframing
12. **Social Issues**: Use Belonging Stories + Fast Friends elements
13. **Motivation Problems**: Purpose Note + Transparency + Agency
14. **Anxiety/Overwhelm**: Stress Reframing + Collaborative Troubleshooting
15. **Conflict**: Validate + Seek Understanding + Honor Agency
16. **Low Self-Esteem**: Belonging Story + Growth Mindset + Stress Reframing

Choose the 2-3 most relevant practices based on the specific message content and emotional needs.`;

// DOM Elements
const messageInput = document.getElementById("messageInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsSection = document.getElementById("resultsSection");
const loadingIndicator = document.getElementById("loadingIndicator");
const analysisResults = document.getElementById("analysisResults");
const analysisContent = document.getElementById("analysisContent");
const suggestionsContent = document.getElementById("suggestionsContent");

// Chart instance
let emotionChart = null;

// Event Listeners
analyzeBtn.addEventListener("click", analyzeMessage);
clearBtn.addEventListener("click", clearAll);
messageInput.addEventListener("input", validateInput);

// Validate input field
function validateInput() {
  analyzeBtn.disabled = messageInput.value.trim().length === 0;
}

// Clear all inputs and results
function clearAll() {
  messageInput.value = "";
  resultsSection.style.display = "none";
  analysisContent.innerHTML = "";
  suggestionsContent.innerHTML = "";
  analyzeBtn.disabled = true;

  // Destroy existing chart
  if (emotionChart) {
    emotionChart.destroy();
    emotionChart = null;
  }
}

// Analyze message using OpenAI API
async function analyzeMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Show loading state
  resultsSection.style.display = "block";
  loadingIndicator.style.display = "flex";
  analysisResults.style.display = "none";
  analyzeBtn.disabled = true;

  try {
    // Prepare the prompt for analysis
    const analysisPrompt = `Analyze the following message for emotions and detect what practices should be used in response using the Mentor Mindset framework. :

Message: "${message}"

Provide your response in this exact format:

EMOTIONS: [List 3-5 emotions with percentages that add up to 100, format: "Emotion: X%"]

KEY THEMES:
- [Theme 1]
- [Theme 2]
- [Theme 3]

RECOMMENDED PRACTICES:
- [Practice name]: [Why it's appropriate]`;

    // Get analysis from OpenAI
    const analysis = await callOpenAI(analysisPrompt);

    // Prepare the prompt for response suggestions
    const suggestionsPrompt = `Based on this message and analysis, provide 2-3 specific response examples using the recommended Mentor Mindset practices.
    The response should RESPOND and communicate with the initial message. It should be from the perspective of the user who typed in/received the message. 
    It should NOT rephrase the typed message.  

Message: "${message}"

Analysis: ${analysis}

Format each response as:

RESPONSE 1: [Practice Name]
"[Actual response text here]"
Why it works: [Brief explanation]`;

    // Get response suggestions from OpenAI
    const suggestions = await callOpenAI(suggestionsPrompt);

    // Display results
    displayResults(analysis, suggestions);
  } catch (error) {
    console.error("Error analyzing message:", error);
    showError("Failed to analyze message. Please try again.");
  } finally {
    // Hide loading indicator
    loadingIndicator.style.display = "none";
    analyzeBtn.disabled = false;
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
        model: "gpt-4o",
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
        temperature: 0.7,
        max_tokens: 1024,
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

// Display analysis and suggestions
function displayResults(analysis, suggestions) {
  // Show results section
  analysisResults.style.display = "grid";

  // Extract emotions and create chart
  const emotions = extractEmotions(analysis);
  if (emotions.length > 0) {
    createEmotionChart(emotions);
  }

  // Format and display analysis
  analysisContent.innerHTML = formatAnalysis(analysis);

  // Format and display suggestions
  suggestionsContent.innerHTML = formatSuggestions(suggestions);
}

// Extract emotions from analysis text
function extractEmotions(text) {
  const emotions = [];
  const emotionMatch = text.match(/EMOTIONS?:([^\n]*(?:\n(?!\n)[^\n]*)*)/i);

  if (emotionMatch) {
    const emotionText = emotionMatch[1];
    const emotionRegex = /([A-Za-z\s]+):\s*(\d+)%/g;
    let match;

    while ((match = emotionRegex.exec(emotionText)) !== null) {
      emotions.push({
        name: match[1].trim(),
        value: parseInt(match[2]),
      });
    }
  }

  return emotions;
}

// Create emotion pie chart
function createEmotionChart(emotions) {
  const ctx = document.getElementById("emotionChart");

  // Destroy existing chart
  if (emotionChart) {
    emotionChart.destroy();
  }

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  emotionChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: emotions.map((e) => e.name),
      datasets: [
        {
          data: emotions.map((e) => e.value),
          backgroundColor: colors.slice(0, emotions.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: "Inter",
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ": " + context.parsed + "%";
            },
          },
        },
      },
    },
  });
}

// Format analysis text
function formatAnalysis(text) {
  if (!text) return "<p>No content available.</p>";

  let html = "";
  const sections = text.split(/\n\n+/);

  sections.forEach((section) => {
    if (!section.trim()) return;

    // Check for section headers
    if (section.match(/^(KEY THEMES|RECOMMENDED PRACTICES):/i)) {
      const lines = section.split("\n");
      const header = lines[0];
      html += `<h4>${header}</h4><ul>`;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.startsWith("-")) {
          html += `<li>${line.substring(1).trim()}</li>`;
        } else if (line) {
          html += `<li>${line}</li>`;
        }
      }
      html += "</ul>";
    } else if (!section.match(/^EMOTIONS?:/i)) {
      // Regular paragraph (skip emotions section as it's in the chart)
      html += `<p>${section}</p>`;
    }
  });

  return html;
}

// Format suggestions text
function formatSuggestions(text) {
  if (!text) return "<p>No content available.</p>";

  let html = "";
  const responses = text.split(/RESPONSE \d+:/i).filter((r) => r.trim());

  responses.forEach((response, index) => {
    const lines = response.trim().split("\n");
    let practiceName = "";
    let responseText = "";
    let explanation = "";

    lines.forEach((line) => {
      line = line.trim();
      if (!line) return;

      if (
        line.startsWith('"') ||
        (responseText && !line.toLowerCase().startsWith("why"))
      ) {
        responseText += line + " ";
      } else if (line.toLowerCase().startsWith("why")) {
        explanation = line;
      } else if (!practiceName && !line.startsWith('"')) {
        practiceName = line;
      }
    });

    if (responseText || practiceName) {
      html += '<div style="margin-bottom: 1.5rem;">';
      if (practiceName) {
        html += `<span class="practice-label">${practiceName}</span>`;
      }
      if (responseText) {
        html += `<p style="font-style: italic; margin: 0.5rem 0; padding: 1rem; background: white; border-radius: 8px;">${responseText.replace(
          /"/g,
          ""
        )}</p>`;
      }
      if (explanation) {
        html += `<p style="font-size: 0.9rem; color: #065f46; margin-top: 0.5rem;">${explanation}</p>`;
      }
      html += "</div>";
    }
  });

  // Fallback to simple formatting if structured parsing fails
  if (!html) {
    const lines = text.split("\n");
    html = "<ul>";
    lines.forEach((line) => {
      line = line.trim();
      if (line && line.startsWith("-")) {
        html += `<li>${line.substring(1).trim()}</li>`;
      } else if (line) {
        html += `<p>${line}</p>`;
      }
    });
    html += "</ul>";
  }

  return html;
}

// Show error message
function showError(message) {
  analysisContent.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
  analysisResults.style.display = "block";
}

// Initialize
validateInput();
