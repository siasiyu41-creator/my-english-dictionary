
const API_URL = "https://my-english-dictionary-api.sia-siyu-41.workers.dev/";

let words = [];
let baseWords = [];
let custom = JSON.parse(localStorage.getItem("myDictionaryCustom") || "[]");
let reviewed = JSON.parse(localStorage.getItem("myDictionaryReviewed") || "{}");
let aiGenerated = new Set();
let generating = false;

const $ = id => document.getElementById(id);

const escapeHTML = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function all() {
  return [...words];
}

function setStatus(message, isError = false) {
  let status = $("aiStatus");

  if (!status) {
    status = document.createElement("p");
    status.id = "aiStatus";
    status.setAttribute("role", "status");
    status.style.margin = "10px 0";
    status.style.fontSize = "14px";
    $("search").insertAdjacentElement("afterend", status);
  }

  status.textContent = message;
  status.style.color = isError ? "#b42318" : "inherit";
}

async function init() {
  try {
    const response = await fetch("data/words.json");
    if (!response.ok) throw new Error("Could not load words");

    baseWords = await response.json();
  } catch (error) {
    baseWords = [];
  }

  words = [...baseWords, ...custom];
  render();
  updateStats();
}

function updateStats() {
  $("wordCount").textContent = all().length;
  $("reviewCount").textContent = Object.keys(reviewed).length;
  $("dueCount").textContent =
    all().length - Object.keys(reviewed).length;
}

function render() {
  const q = $("search").value.toLowerCase().trim();

  let list = all().filter(w =>
    [
      w.word,
      w.coreMeaning,
      w.definition,
      ...(w.collocations || [])
    ].join(" ").toLowerCase().includes(q)
  );

  if ($("sort").value === "az") {
    list.sort((a, b) => a.word.localeCompare(b.word));
  }

  $("wordList").innerHTML = list.map(w => `
    <button class="word-row" data-word="${escapeHTML(w.word)}">
      <span class="word-name">${escapeHTML(w.word)}</span>
      <span class="word-pos">${escapeHTML(w.partOfSpeech || "")}</span>
      <span class="word-meaning">${escapeHTML(w.coreMeaning || "")}</span>
      <span class="arrow">↗</span>
    </button>
  `).join("");

  $("empty").hidden = !!list.length;

  document.querySelectorAll(".word-row").forEach(button => {
    button.onclick = () => showDetail(button.dataset.word);
  });
}

function showView(view) {
  ["wordsView", "detailView", "reviewView", "addView"]
    .forEach(id => $(id).hidden = true);

  if (view === "words") $("wordsView").hidden = false;
  if (view === "review") $("reviewView").hidden = false;
  if (view === "add") $("addView").hidden = false;

  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function showDetail(name) {
  const w = all().find(x =>
    x.word.toLowerCase() === name.toLowerCase()
  );

  if (!w) return;

  const isSaved = !aiGenerated.has(w.word.toLowerCase());

  showView("words");
  $("wordsView").hidden = true;
  $("detailView").hidden = false;

  const list = (arr, fn) =>
    `<ul>${(arr || []).map(fn).join("")}</ul>`;

  $("detailView").innerHTML = `
    <div class="detail-top">
      <button class="back" id="back">← All words</button>
      <span class="pospill">${escapeHTML(w.partOfSpeech || "")}</span>
    </div>

    <div class="detail-hero">
      <div>
        <h2>${escapeHTML(w.word)}</h2>
        <div class="pron">
  ${escapeHTML(w.pronunciation || "")}
  ${w.pronunciation ? " · " : ""}
  ${escapeHTML(w.partOfSpeech || "")}
</div>


      </div>
      <div class="visual"
        title="${escapeHTML(w.visual?.scene || "")}">
        ${escapeHTML(w.visual?.emoji || "📖")}
      </div>
    </div>

    <p class="meaning">${escapeHTML(w.coreMeaning || "")}</p>
    <p>${escapeHTML(w.definition || "")}</p>

    ${isSaved ? "" : `
      <button class="primary" id="saveAIWord">
        Save to my dictionary
      </button>
    `}

    <div class="detail-grid">
      <div>
        <section class="detail-section">
          <h3>Synonyms & distinctions</h3>
          ${list(w.synonyms, x => `
            <li>
              <span class="synonym">${escapeHTML(x.word)}</span>
              <small>${escapeHTML(x.difference)}</small>
            </li>
          `)}
        </section>

        <section class="detail-section">
          <h3>Common collocations</h3>
          ${list(w.collocations, x =>
            `<li>${escapeHTML(x)}</li>`
          )}
        </section>

        <section class="detail-section">
          <h3>Word family</h3>
          ${list(w.wordFamily, x =>
            `<li>${escapeHTML(x)}</li>`
          )}
        </section>
      </div>

      <div>
        <section class="detail-section">
          <h3>Natural examples</h3>
          ${(w.examples || []).map(x =>
            `<div class="example">${escapeHTML(x)}</div>`
          ).join("")}
        </section>

        <section class="detail-section">
          <h3>IELTS-ready examples</h3>
          ${(w.ielts || []).map(x =>
            `<div class="example">${escapeHTML(x)}</div>`
          ).join("")}
        </section>

        <section class="detail-section">
          <h3>Roots & word structure</h3>
          <p>
            ${escapeHTML([
              w.roots?.prefix,
              w.roots?.base,
              w.roots?.suffix
            ].filter(Boolean).join(" + "))}
          </p>
          <p>${escapeHTML(w.roots?.explanation || "")}</p>
        </section>

        <section class="detail-section">
          <h3>Visual association</h3>
          <p>${escapeHTML(w.visual?.scene || "")}</p>
        </section>
      </div>
    </div>
  `;
  
  $("back").onclick = () => {
    $("detailView").hidden = true;
    $("wordsView").hidden = false;
  };

  const saveButton = $("saveAIWord");

  if (saveButton) {
    saveButton.onclick = () => {
      custom.push(w);

      localStorage.setItem(
        "myDictionaryCustom",
        JSON.stringify(custom)
      );

      aiGenerated.delete(w.word.toLowerCase());

      saveButton.remove();
      setStatus(`"${w.word}" saved to your dictionary!`);

      updateStats();
      render();
    };
  }
}

async function generateWord(input) {
  const word = input.trim();

  if (!word || generating) return;

  const existing = all().find(w =>
    w.word.toLowerCase() === word.toLowerCase()
  );

  if (existing) {
    showDetail(existing.word);
    return;
  }

  if (!/^[a-zA-Z][a-zA-Z -]{0,59}$/.test(word)) {
    setStatus("Please enter a valid English word.", true);
    return;
  }

  generating = true;
  setStatus(`Generating "${word}"... Please wait.`);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ word })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed (${response.status})`
      );
    }

    const entry = data.entry;

    if (!entry || !entry.word) {
      throw new Error("The AI returned an invalid entry.");
    }

    const newWord = {
      ...entry,
      word: entry.word || word,
      synonyms: entry.synonyms || [],
      collocations: entry.collocations || [],
      examples: entry.examples || [],
      ielts: entry.ielts || [],
      wordFamily: entry.wordFamily || [],
      roots: entry.roots || {},
      visual: entry.visual || {}
    };

    words.push(newWord);
    aiGenerated.add(newWord.word.toLowerCase());

    $("search").value = newWord.word;

    render();
    updateStats();
    showDetail(newWord.word);

    setStatus(
      `AI entry generated. Save it to add it to your dictionary.`
    );

  } catch (error) {
    console.error(error);
    setStatus(
      `Could not generate this word: ${error.message}`,
      true
    );
  } finally {
    generating = false;
  }
}

function startReview() {
  showView("review");

  const pool = all().filter(w => !reviewed[w.word]);
  const card = $("reviewCard");

  if (!pool.length) {
    card.innerHTML = `
      <p>You've reviewed every word in this collection.
      Add more words or reset your review progress.</p>
      <button class="secondary" id="resetReview">
        Reset progress
      </button>
    `;

    $("resetReview").onclick = () => {
      reviewed = {};
      localStorage.setItem("myDictionaryReviewed", "{}");
      updateStats();
      startReview();
    };

    return;
  }

  const w = pool[Math.floor(Math.random() * pool.length)];

  card.innerHTML = `
    <div class="review-word">${escapeHTML(w.word)}</div>
    <p class="review-prompt">
      Can you explain this word in English?
    </p>
    <button class="secondary" id="reveal">
      Reveal meaning
    </button>

    <div id="revealed" hidden class="answer">
      <strong>${escapeHTML(w.partOfSpeech || "")}</strong>
      <p>${escapeHTML(w.coreMeaning || "")}</p>
      <p>${escapeHTML(w.examples?.[0] || "")}</p>

      <div class="review-actions">
        <button class="primary" id="known">I knew it</button>
        <button class="secondary" id="again">Review again</button>
      </div>
    </div>
  `;

  $("reveal").onclick = () => {
    $("revealed").hidden = false;
  };

  $("known").onclick = () => {
    reviewed[w.word] = new Date().toISOString();

    localStorage.setItem(
      "myDictionaryReviewed",
      JSON.stringify(reviewed)
    );

    updateStats();
    startReview();
  };

  $("again").onclick = () => startReview();
}

document.querySelectorAll(".tab").forEach(button => {
  button.onclick = () =>
    button.dataset.view === "review"
      ? startReview()
      : showView(button.dataset.view);
});

$("search").addEventListener("input", () => {
  showView("words");
  $("detailView").hidden = true;
  render();
  setStatus("");
});

$("search").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    generateWord($("search").value);
  }
});

$("sort").onchange = render;

$("addForm").onsubmit = event => {
  event.preventDefault();

  const word = $("newWord").value.trim();

  if (all().some(w =>
    w.word.toLowerCase() === word.toLowerCase()
  )) {
    alert("This word is already in your dictionary.");
    return;
  }

  const newWord = {
    word,
    partOfSpeech: $("newPos").value.trim(),
    coreMeaning: $("newMeaning").value.trim(),
    definition: $("newMeaning").value.trim(),
    examples: $("newExample").value.trim()
      ? [$("newExample").value.trim()]
      : [],
    synonyms: [],
    collocations: [],
    wordFamily: [],
    roots: {
      explanation: "Add a root or word-family note when you learn one."
    },
    visual: {
      emoji: "📘",
      scene: "Add a visual association."
    },
    ielts: []
  };

  custom.push(newWord);

  localStorage.setItem(
    "myDictionaryCustom",
    JSON.stringify(custom)
  );

  words = [...baseWords, ...custom];

  event.target.reset();
  updateStats();
  render();
  showView("words");
};

$("exportBtn").onclick = () => {
  const blob = new Blob(
    [JSON.stringify(all(), null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-english-dictionary.json";
  a.click();

  URL.revokeObjectURL(a.href);
};

$("importFile").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());

    if (!Array.isArray(data)) throw new Error();

    custom = data;

    localStorage.setItem(
      "myDictionaryCustom",
      JSON.stringify(custom)
    );

    words = [...baseWords, ...custom];

    updateStats();
    render();

    alert("Dictionary imported.");
  } catch (error) {
    alert("Could not import this JSON file.");
  }

  event.target.value = "";
};

document.addEventListener("keydown", event => {
  if (
    event.key === "/" &&
    document.activeElement.tagName !== "INPUT" &&
    document.activeElement.tagName !== "TEXTAREA"
  ) {
    event.preventDefault();
    $("search").focus();
  }
});

init();
