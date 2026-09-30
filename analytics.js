// Load journal entries from localStorage
function loadJournalEntries() {
  const saved = localStorage.getItem("journalEntries");
  return saved ? JSON.parse(saved) : [];
}

// Load emotion data from localStorage
function loadEmotionData() {
  const saved = localStorage.getItem("journalEmotions");
  return saved ? JSON.parse(saved) : {};
}

// Initialize analytics
document.addEventListener("DOMContentLoaded", () => {
  const entries = loadJournalEntries();
  const emotionData = loadEmotionData();

  if (entries.length === 0) {
    document.getElementById("noDataState").style.display = "flex";
    document.querySelector(".summary-cards").style.display = "none";
    document.querySelector(".charts-section").style.display = "none";
    document.querySelector(".recent-emotions-section").style.display = "none";
    return;
  }

  // Calculate and display summary statistics
  displaySummaryStats(entries, emotionData);

  // Create charts
  createEmotionsTimeChart(entries, emotionData);
  createEmotionPieChart(emotionData);
  createEntryFrequencyChart(entries);
  createWordCountChart(entries);

  // Display recent emotions
  displayRecentEmotions(entries, emotionData);
});

// Display summary statistics
function displaySummaryStats(entries, emotionData) {
  // Total entries
  document.getElementById("totalEntries").textContent = entries.length;

  // Entries this month
  const now = new Date();
  const thisMonth = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  }).length;
  document.getElementById("entriesThisMonth").textContent = thisMonth;

  // Calculate streak
  const streak = calculateStreak(entries);
  document.getElementById("currentStreak").textContent = streak;

  // Top emotion
  const topEmotion = getTopEmotion(emotionData);
  document.getElementById("topEmotion").textContent = topEmotion || "N/A";
}

// Calculate journaling streak
function calculateStreak(entries) {
  if (entries.length === 0) return 0;

  const sortedDates = entries
    .map((e) => new Date(e.date).toDateString())
    .sort((a, b) => new Date(b) - new Date(a));

  const uniqueDates = [...new Set(sortedDates)];

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if there's an entry today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let currentDate = new Date();
  for (const dateStr of uniqueDates) {
    const entryDate = new Date(dateStr);
    const diffDays = Math.floor((currentDate - entryDate) / 86400000);

    if (diffDays <= 1) {
      streak++;
      currentDate = entryDate;
    } else {
      break;
    }
  }

  return streak;
}

// Get top emotion
function getTopEmotion(emotionData) {
  const emotionCounts = {};

  Object.values(emotionData).forEach((emotions) => {
    if (Array.isArray(emotions)) {
      emotions.forEach((emotion) => {
        const emotionName = emotion.split(":")[0].trim();
        emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + 1;
      });
    }
  });

  if (Object.keys(emotionCounts).length === 0) return null;

  return Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
}

// Create emotions over time chart
function createEmotionsTimeChart(entries, emotionData) {
  const ctx = document.getElementById("emotionsTimeChart");

  // Get last 7 entries with emotions
  const recentEntries = entries
    .filter((e) => emotionData[e.id])
    .slice(0, 7)
    .reverse();

  const labels = recentEntries.map((e) => {
    const date = new Date(e.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Extract emotion categories
  const emotionCategories = [
    "Happy",
    "Sad",
    "Anxious",
    "Excited",
    "Calm",
    "Stressed",
  ];
  const datasets = emotionCategories.map((emotion, index) => {
    const colors = [
      "#10b981",
      "#ef4444",
      "#f59e0b",
      "#8b5cf6",
      "#3b82f6",
      "#ec4899",
    ];

    return {
      label: emotion,
      data: recentEntries.map((entry) => {
        const emotions = emotionData[entry.id] || [];
        return emotions.some((e) =>
          e.toLowerCase().includes(emotion.toLowerCase())
        )
          ? 1
          : 0;
      }),
      borderColor: colors[index],
      backgroundColor: colors[index] + "20",
      tension: 0.4,
    };
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

// Create emotion distribution pie chart
function createEmotionPieChart(emotionData) {
  const ctx = document.getElementById("emotionPieChart");

  const emotionCounts = {};
  Object.values(emotionData).forEach((emotions) => {
    if (Array.isArray(emotions)) {
      emotions.forEach((emotion) => {
        const emotionName = emotion.split(":")[0].trim();
        emotionCounts[emotionName] = (emotionCounts[emotionName] || 0) + 1;
      });
    }
  });

  const sortedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: sortedEmotions.map((e) => e[0]),
      datasets: [
        {
          data: sortedEmotions.map((e) => e[1]),
          backgroundColor: [
            "#4f46e5",
            "#10b981",
            "#f59e0b",
            "#ec4899",
            "#3b82f6",
            "#8b5cf6",
            "#ef4444",
            "#14b8a6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Create entry frequency chart
function createEntryFrequencyChart(entries) {
  const ctx = document.getElementById("entryFrequencyChart");

  // Get last 30 days
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push(date.toDateString());
  }

  const entryCounts = last30Days.map((dateStr) => {
    return entries.filter((e) => new Date(e.date).toDateString() === dateStr)
      .length;
  });

  const labels = last30Days.map((dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Entries",
          data: entryCounts,
          backgroundColor: "#4f46e5",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

// Create word count trend chart
function createWordCountChart(entries) {
  const ctx = document.getElementById("wordCountChart");

  const recentEntries = entries.slice(0, 10).reverse();

  const labels = recentEntries.map((e) => {
    const date = new Date(e.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const wordCounts = recentEntries.map((e) => {
    const text = stripHtml(e.content);
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Word Count",
          data: wordCounts,
          borderColor: "#10b981",
          backgroundColor: "#10b98120",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Display recent emotions
function displayRecentEmotions(entries, emotionData) {
  const container = document.getElementById("recentEmotionsList");

  const recentWithEmotions = entries
    .filter((e) => emotionData[e.id])
    .slice(0, 5);

  if (recentWithEmotions.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #64748b;">No emotion data available yet. Use the AI Analysis feature in your journal entries!</p>';
    return;
  }

  container.innerHTML = recentWithEmotions
    .map((entry) => {
      const date = new Date(entry.date);
      const emotions = emotionData[entry.id] || [];

      return `
            <div class="emotion-entry">
                <div class="emotion-date">
                    ${date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                </div>
                <div class="emotion-tags">
                    ${emotions
                      .map((emotion) => {
                        const emotionName = emotion.split(":")[0].trim();
                        const emotionClass = getEmotionClass(emotionName);
                        return `<span class="emotion-tag ${emotionClass}">${emotionName}</span>`;
                      })
                      .join("")}
                </div>
            </div>
        `;
    })
    .join("");
}

// Get emotion class for styling
function getEmotionClass(emotion) {
  const positive = [
    "happy",
    "joy",
    "excited",
    "grateful",
    "hopeful",
    "calm",
    "content",
    "proud",
  ];
  const negative = [
    "sad",
    "angry",
    "anxious",
    "stressed",
    "worried",
    "frustrated",
    "disappointed",
  ];

  const lowerEmotion = emotion.toLowerCase();

  if (positive.some((p) => lowerEmotion.includes(p))) return "positive";
  if (negative.some((n) => lowerEmotion.includes(n))) return "negative";
  return "neutral";
}

// Utility function
function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
