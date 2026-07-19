/* =========================================================
   SOURCE'S OFFICE — MEETING 001
   Rollout Review
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE = {
  meeting: "sourceOffice_rollout_meeting",
  highlights: "sourceOffice_rollout_highlights",
  guideSeen: "sourceOffice_rollout_guide_seen"
};

const TOTAL_PAGES = 8;

const PAGE_TITLES = [
  "Before We Start",
  "The Timeline",
  "Where I Felt It",
  "Different Platforms",
  "Fan Fatigue",
  "The Wrong Conversation",
  "The Paid Campaign",
  "What Could Have Been"
];

const AUDIO_SOURCES = {
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
  6: "",
  7: "",
  8: ""
};

/* =========================================================
   STATE
   ========================================================= */

let currentPage = 1;
let highlights = [];
let currentSelection = null;
let activeHighlightId = null;
let notesDrawerMode = "page";
let toastTimer = null;
let scrollSaveTimer = null;

/* =========================================================
   ELEMENTS
   ========================================================= */

const pages = [...document.querySelectorAll(".meeting-content-page")];
const pageButtons = [...document.querySelectorAll(".meeting-page-menu-item")];

const previousMeetingPage = document.getElementById("previousMeetingPage");
const nextMeetingPage = document.getElementById("nextMeetingPage");
const previousPageName = document.getElementById("previousPageName");
const nextPageName = document.getElementById("nextPageName");
const meetingPaginationText = document.getElementById(
  "meetingPaginationText"
);
const meetingPaginationDots = document.getElementById(
  "meetingPaginationDots"
);

const currentPageLabel = document.getElementById("currentPageLabel");
const currentPageTitle = document.getElementById("currentPageTitle");
const meetingProgressFill = document.getElementById(
  "meetingProgressFill"
);
const meetingProgressPercent = document.getElementById(
  "meetingProgressPercent"
);

const continueMeetingButton = document.getElementById(
  "continueMeetingButton"
);
const continueMeetingLocation = document.getElementById(
  "continueMeetingLocation"
);

const pageHighlightCount = document.getElementById(
  "pageHighlightCount"
);
const pageNoteCount = document.getElementById("pageNoteCount");
const meetingNoteCount = document.getElementById("meetingNoteCount");

const officeGuideOverlay = document.getElementById(
  "officeGuideOverlay"
);
const showOfficeGuide = document.getElementById("showOfficeGuide");
const closeOfficeGuide = document.getElementById("closeOfficeGuide");
const enterMeetingButton = document.getElementById(
  "enterMeetingButton"
);

const selectionNotePreview = document.getElementById(
  "selectionNotePreview"
);
const selectionPreviewText = document.getElementById(
  "selectionPreviewText"
);
const selectionSectionName = document.getElementById(
  "selectionSectionName"
);
const cancelSelectionButton = document.getElementById(
  "cancelSelectionButton"
);
const confirmHighlightButton = document.getElementById(
  "confirmHighlightButton"
);

const noteEditorOverlay = document.getElementById("noteEditorOverlay");
const closeNoteEditor = document.getElementById("closeNoteEditor");
const noteEditorQuote = document.getElementById("noteEditorQuote");
const noteEditorText = document.getElementById("noteEditorText");
const noteCharacterCount = document.getElementById(
  "noteCharacterCount"
);
const saveNoteButton = document.getElementById("saveNoteButton");
const openDeleteOptionsButton = document.getElementById(
  "openDeleteOptionsButton"
);

const deleteOptionsOverlay = document.getElementById(
  "deleteOptionsOverlay"
);
const closeDeleteOptionsButton = document.getElementById(
  "closeDeleteOptionsButton"
);
const cancelDeleteOptionsButton = document.getElementById(
  "cancelDeleteOptionsButton"
);
const deleteOptionsTitle = document.getElementById(
  "deleteOptionsTitle"
);
const deleteOptionsDescription = document.getElementById(
  "deleteOptionsDescription"
);
const deleteOptionsWithNote = document.getElementById(
  "deleteOptionsWithNote"
);
const deleteOptionsHighlightOnly = document.getElementById(
  "deleteOptionsHighlightOnly"
);
const deleteNoteOnlyButton = document.getElementById(
  "deleteNoteOnlyButton"
);
const deleteNoteAndHighlightButton = document.getElementById(
  "deleteNoteAndHighlightButton"
);
const deleteHighlightOnlyButton = document.getElementById(
  "deleteHighlightOnlyButton"
);

const meetingNotesDrawer = document.getElementById(
  "meetingNotesDrawer"
);
const notesDrawerOverlay = document.getElementById(
  "notesDrawerOverlay"
);
const openMeetingNotes = document.getElementById("openMeetingNotes");
const closeMeetingNotes = document.getElementById(
  "closeMeetingNotes"
);
const showCurrentPageNotes = document.getElementById(
  "showCurrentPageNotes"
);
const showAllMeetingNotes = document.getElementById(
  "showAllMeetingNotes"
);
const savedNotesList = document.getElementById("savedNotesList");
const emptyNotesMessage = document.getElementById(
  "emptyNotesMessage"
);
const pageHighlightsButton = document.getElementById(
  "pageHighlightsButton"
);
const pageNotesButton = document.getElementById("pageNotesButton");

const meetingAudio = document.getElementById("meetingAudio");
const audioPlayButton = document.getElementById("audioPlayButton");
const audioPageTitle = document.getElementById("audioPageTitle");
const audioTimeDisplay = document.getElementById("audioTimeDisplay");
const audioProgressSlider = document.getElementById(
  "audioProgressSlider"
);
const audioBackButton = document.getElementById("audioBackButton");
const audioForwardButton = document.getElementById(
  "audioForwardButton"
);
const audioSpeedSelect = document.getElementById("audioSpeedSelect");

const meetingToast = document.getElementById("meetingToast");

/* =========================================================
   HELPERS
   ========================================================= */

function makeId() {
  return `hl_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function setBodyLock() {
  const anyOpen =
    officeGuideOverlay.classList.contains("is-open") ||
    noteEditorOverlay.classList.contains("is-open") ||
    deleteOptionsOverlay.classList.contains("is-open") ||
    meetingNotesDrawer.classList.contains("is-open");

  document.body.classList.toggle("is-locked", anyOpen);
}

function showToast(message) {
  meetingToast.textContent = message;
  meetingToast.classList.add("is-visible");
  meetingToast.setAttribute("aria-hidden", "false");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    meetingToast.classList.remove("is-visible");
    meetingToast.setAttribute("aria-hidden", "true");
  }, 2400);
}

function getMeetingState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.meeting)) || {};
  } catch {
    return {};
  }
}

function saveMeetingState(extra = {}) {
  const previous = getMeetingState();

  const next = {
    ...previous,
    page: currentPage,
    scrollY: window.scrollY,
    audioTimes: previous.audioTimes || {},
    ...extra
  };

  localStorage.setItem(STORAGE.meeting, JSON.stringify(next));
}

function loadHighlights() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE.highlights)
    );

    highlights = Array.isArray(stored) ? stored : [];
  } catch {
    highlights = [];
  }
}

function saveHighlights() {
  localStorage.setItem(
    STORAGE.highlights,
    JSON.stringify(highlights)
  );
}

function getHighlight(id) {
  return highlights.find((item) => item.id === id) || null;
}

function getPageRoot(pageNumber) {
  return document.getElementById(`meetingPage${pageNumber}`);
}

function getReadableRoot(pageNumber) {
  return document.querySelector(
    `[data-page-reading-area="${pageNumber}"]`
  );
}

function getSectionName(node) {
  const section =
    node?.nodeType === Node.ELEMENT_NODE
      ? node.closest("[data-section-name]")
      : node?.parentElement?.closest("[data-section-name]");

  return section?.dataset.sectionName || PAGE_TITLES[currentPage - 1];
}

function getCharacterOffset(root, container, offset) {
  const range = document.createRange();

  range.selectNodeContents(root);

  try {
    range.setEnd(container, offset);
    return range.toString().length;
  } catch {
    return 0;
  }
}

function locateTextPosition(root, characterOffset) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  let consumed = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.nodeValue.length;

    if (characterOffset <= consumed + length) {
      return {
        node,
        offset: clamp(characterOffset - consumed, 0, length)
      };
    }

    consumed += length;
  }

  return null;
}

function createRangeFromOffsets(root, start, end) {
  const startPosition = locateTextPosition(root, start);
  const endPosition = locateTextPosition(root, end);

  if (!startPosition || !endPosition) {
    return null;
  }

  const range = document.createRange();

  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);

  return range;
}

function clearNativeSelection() {
  const selection = window.getSelection();

  if (selection) {
    selection.removeAllRanges();
  }
}

/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function buildPaginationDots() {
  meetingPaginationDots.innerHTML = "";

  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    const button = document.createElement("button");

    button.type = "button";
    button.setAttribute("aria-label", `Go to page ${page}`);

    button.addEventListener("click", () => {
      showPage(page);
    });

    meetingPaginationDots.appendChild(button);
  }
}

function updatePageUI() {
  const title = PAGE_TITLES[currentPage - 1];

  currentPageLabel.textContent =
    `Meeting 001 · Page ${currentPage} of ${TOTAL_PAGES}`;

  currentPageTitle.textContent = title;
  meetingPaginationText.textContent =
    `Page ${currentPage} of ${TOTAL_PAGES}`;

  audioPageTitle.textContent = title;

  previousMeetingPage.disabled = currentPage === 1;
  nextMeetingPage.disabled = currentPage === TOTAL_PAGES;

  previousPageName.textContent =
    currentPage === 1
      ? "Lobby"
      : PAGE_TITLES[currentPage - 2];

  nextPageName.textContent =
    currentPage === TOTAL_PAGES
      ? "Complete"
      : PAGE_TITLES[currentPage];

  pageButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      Number(button.dataset.pageTarget) === currentPage
    );
  });

  [...meetingPaginationDots.children].forEach((dot, index) => {
    dot.classList.toggle("active", index + 1 === currentPage);
  });

  const percent = Math.round(
    (currentPage / TOTAL_PAGES) * 100
  );

  meetingProgressFill.style.width = `${percent}%`;
  meetingProgressPercent.textContent = `${percent}%`;

  updateCounters();
  renderMarginNotes();
  renderNotesDrawer();
  loadAudioForPage();
}

function showPage(pageNumber, options = {}) {
  currentPage = clamp(
    Number(pageNumber) || 1,
    1,
    TOTAL_PAGES
  );

  pages.forEach((page) => {
    const isActive =
      Number(page.dataset.pageNumber) === currentPage;

    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  updatePageUI();
  saveMeetingState();

  if (options.scrollToTop !== false) {
    window.scrollTo({
      top: 0,
      behavior: options.instant ? "auto" : "smooth"
    });
  }
}

/* =========================================================
   HIGHLIGHT CREATION
   ========================================================= */

function handleTextSelection() {
  if (
    noteEditorOverlay.classList.contains("is-open") ||
    deleteOptionsOverlay.classList.contains("is-open") ||
    meetingNotesDrawer.classList.contains("is-open")
  ) {
    return;
  }

  const selection = window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0 ||
    selection.isCollapsed
  ) {
    return;
  }

  const text = selection
    .toString()
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length < 2) {
    return;
  }

  const range = selection.getRangeAt(0);
  const readingRoot = getReadableRoot(currentPage);

  if (
    !readingRoot ||
    !readingRoot.contains(range.commonAncestorContainer)
  ) {
    return;
  }

  if (
    range.startContainer.parentElement?.closest(
      ".saved-highlight"
    ) ||
    range.endContainer.parentElement?.closest(
      ".saved-highlight"
    )
  ) {
    return;
  }

  const start = getCharacterOffset(
    readingRoot,
    range.startContainer,
    range.startOffset
  );

  const end = getCharacterOffset(
    readingRoot,
    range.endContainer,
    range.endOffset
  );

  if (end <= start) {
    return;
  }

  currentSelection = {
    page: currentPage,
    text,
    start,
    end,
    sectionName: getSectionName(
      range.commonAncestorContainer
    )
  };

  selectionPreviewText.textContent = text;
  selectionSectionName.textContent =
    currentSelection.sectionName;

  selectionNotePreview.classList.add("is-open");
  selectionNotePreview.setAttribute("aria-hidden", "false");
}

function cancelSelection() {
  currentSelection = null;

  selectionNotePreview.classList.remove("is-open");
  selectionNotePreview.setAttribute("aria-hidden", "true");

  clearNativeSelection();
}

function confirmHighlight() {
  if (!currentSelection) {
    return;
  }

  const overlapping = highlights.some((item) => {
    if (item.page !== currentSelection.page) {
      return false;
    }

    return (
      currentSelection.start < item.end &&
      currentSelection.end > item.start
    );
  });

  if (overlapping) {
    showToast(
      "That selection overlaps an existing highlight."
    );

    cancelSelection();
    return;
  }

  const highlight = {
    id: makeId(),
    page: currentSelection.page,
    text: currentSelection.text,
    start: currentSelection.start,
    end: currentSelection.end,
    sectionName: currentSelection.sectionName,
    note: "",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  highlights.push(highlight);

  saveHighlights();
  cancelSelection();
  renderAllHighlights();
  openNoteEditorFor(highlight.id, true);
  updateCounters();
}

/* =========================================================
   HIGHLIGHT RENDERING
   ========================================================= */

function unwrapRenderedHighlights() {
  document
    .querySelectorAll(".saved-highlight")
    .forEach((mark) => {
      const parent = mark.parentNode;

      if (!parent) {
        return;
      }

      parent.replaceChild(
        document.createTextNode(mark.textContent),
        mark
      );

      parent.normalize();
    });
}

function applyHighlight(highlight) {
  const root = getReadableRoot(highlight.page);

  if (!root) {
    return;
  }

  const range = createRangeFromOffsets(
    root,
    highlight.start,
    highlight.end
  );

  if (!range || range.collapsed) {
    return;
  }

  const mark = document.createElement("mark");

  mark.className = "saved-highlight";
  mark.dataset.highlightId = highlight.id;
  mark.title = highlight.note
    ? "Open note"
    : "Add a note";

  try {
    range.surroundContents(mark);
  } catch {
    const fragment = range.extractContents();

    mark.appendChild(fragment);
    range.insertNode(mark);
  }

  mark.addEventListener("click", (event) => {
    event.stopPropagation();
    openNoteEditorFor(highlight.id);
  });
}

function renderAllHighlights() {
  unwrapRenderedHighlights();

  [...highlights]
    .sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page;
      }

      return b.start - a.start;
    })
    .forEach(applyHighlight);

  renderMarginNotes();
  renderNotesDrawer();
  updateCounters();
}

/* =========================================================
   NOTE EDITOR
   ========================================================= */

function openNoteEditorFor(id, newHighlight = false) {
  const highlight = getHighlight(id);

  if (!highlight) {
    return;
  }

  activeHighlightId = id;

  noteEditorQuote.textContent = highlight.text;
  noteEditorText.value = highlight.note || "";
  noteCharacterCount.textContent = String(
    noteEditorText.value.length
  );

  openDeleteOptionsButton.hidden = newHighlight;

  saveNoteButton.textContent = highlight.note
    ? "Save Changes"
    : "Save";

  noteEditorOverlay.classList.add("is-open");
  noteEditorOverlay.setAttribute("aria-hidden", "false");

  setBodyLock();

  setTimeout(() => {
    noteEditorText.focus();
  }, 80);
}

function closeNoteEditorModal() {
  activeHighlightId = null;

  noteEditorOverlay.classList.remove("is-open");
  noteEditorOverlay.setAttribute("aria-hidden", "true");

  setBodyLock();
}

function saveActiveNote() {
  const highlight = getHighlight(activeHighlightId);

  if (!highlight) {
    return;
  }

  highlight.note = noteEditorText.value.trim();
  highlight.updatedAt = Date.now();

  saveHighlights();
  renderAllHighlights();
  closeNoteEditorModal();

  showToast(
    highlight.note
      ? "Note saved."
      : "Highlight saved."
  );
}

function openDeleteOptions() {
  const highlight = getHighlight(activeHighlightId);

  if (!highlight) {
    return;
  }

  const hasNote = Boolean(highlight.note?.trim());

  deleteOptionsWithNote.hidden = !hasNote;
  deleteOptionsHighlightOnly.hidden = hasNote;

  if (hasNote) {
    deleteOptionsTitle.textContent =
      "What would you like to delete?";

    deleteOptionsDescription.textContent =
      "You can remove only your note or remove the note and highlight together.";
  } else {
    deleteOptionsTitle.textContent =
      "Delete this highlight?";

    deleteOptionsDescription.textContent =
      "This highlight does not have a written note attached.";
  }

  deleteOptionsOverlay.classList.add("is-open");
  deleteOptionsOverlay.setAttribute("aria-hidden", "false");

  setBodyLock();
}

function closeDeleteOptions() {
  deleteOptionsOverlay.classList.remove("is-open");
  deleteOptionsOverlay.setAttribute("aria-hidden", "true");

  setBodyLock();
}

function deleteNoteOnly() {
  const highlight = getHighlight(activeHighlightId);

  if (!highlight) {
    return;
  }

  highlight.note = "";
  highlight.updatedAt = Date.now();

  saveHighlights();
  closeDeleteOptions();
  closeNoteEditorModal();
  renderAllHighlights();

  showToast("Note deleted. Highlight kept.");
}

function deleteHighlightAndNote() {
  if (!activeHighlightId) {
    return;
  }

  highlights = highlights.filter(
    (item) => item.id !== activeHighlightId
  );

  saveHighlights();

  closeDeleteOptions();
  closeNoteEditorModal();
  renderAllHighlights();

  showToast("Highlight deleted.");
}

/* =========================================================
   MARGIN NOTES
   ========================================================= */

function renderMarginNotes() {
  document
    .querySelectorAll("[data-page-note-margin]")
    .forEach((margin) => {
      margin.innerHTML = "";
    });

  const pageItems = highlights
    .filter((item) => item.page === currentPage)
    .sort((a, b) => a.start - b.start);

  const margin = document.querySelector(
    `[data-page-note-margin="${currentPage}"]`
  );

  const pageRoot = getPageRoot(currentPage);

  if (!margin || !pageRoot) {
    return;
  }

  pageItems.forEach((item, index) => {
    const mark = document.querySelector(
      `.saved-highlight[data-highlight-id="${item.id}"]`
    );

    const card = document.createElement("article");

    card.className = "margin-note-card";
    card.dataset.highlightId = item.id;

    const relativeTop = mark
      ? mark.getBoundingClientRect().top -
        pageRoot.getBoundingClientRect().top
      : index * 150;

    card.style.top = `${Math.max(
      0,
      relativeTop - 10
    )}px`;

    card.innerHTML = `
      <p class="margin-note-quote">
        “${escapeHtml(item.text)}”
      </p>

      ${
        item.note
          ? `
            <p class="margin-note-text">
              ${escapeHtml(item.note)}
            </p>
          `
          : `
            <p class="margin-note-empty">
              Highlight saved. No note added.
            </p>
          `
      }

      <div class="margin-note-actions">
        <button
          type="button"
          data-edit-highlight="${item.id}"
        >
          Edit
        </button>

        <button
          type="button"
          data-delete-highlight="${item.id}"
        >
          Delete
        </button>
      </div>
    `;

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      returnToHighlight(item.id);
    });

    card
      .querySelector("[data-edit-highlight]")
      .addEventListener("click", () => {
        openNoteEditorFor(item.id);
      });

    card
      .querySelector("[data-delete-highlight]")
      .addEventListener("click", () => {
        activeHighlightId = item.id;

        openNoteEditorFor(item.id);
        openDeleteOptions();
      });

    margin.appendChild(card);
  });

  preventMarginNoteOverlap(margin);
}

function preventMarginNoteOverlap(margin) {
  const cards = [
    ...margin.querySelectorAll(".margin-note-card")
  ];

  let nextAvailableTop = 0;

  cards.forEach((card) => {
    const requestedTop =
      Number.parseFloat(card.style.top) || 0;

    const finalTop = Math.max(
      requestedTop,
      nextAvailableTop
    );

    card.style.top = `${finalTop}px`;

    nextAvailableTop =
      finalTop + card.offsetHeight + 18;
  });

  if (cards.length) {
    margin.style.minHeight = `${nextAvailableTop}px`;
  }
}

/* =========================================================
   NOTES DRAWER
   ========================================================= */

function openNotesDrawer(mode = "page") {
  notesDrawerMode = mode;

  meetingNotesDrawer.classList.add("is-open");
  meetingNotesDrawer.setAttribute("aria-hidden", "false");

  notesDrawerOverlay.classList.add("is-open");
  notesDrawerOverlay.setAttribute("aria-hidden", "false");

  openMeetingNotes.setAttribute("aria-expanded", "true");

  renderNotesDrawer();
  setBodyLock();
}

function closeNotesDrawerPanel() {
  meetingNotesDrawer.classList.remove("is-open");
  meetingNotesDrawer.setAttribute("aria-hidden", "true");

  notesDrawerOverlay.classList.remove("is-open");
  notesDrawerOverlay.setAttribute("aria-hidden", "true");

  openMeetingNotes.setAttribute("aria-expanded", "false");

  setBodyLock();
}

function renderNotesDrawer() {
  showCurrentPageNotes.classList.toggle(
    "active",
    notesDrawerMode === "page"
  );

  showAllMeetingNotes.classList.toggle(
    "active",
    notesDrawerMode === "all"
  );

  const items = highlights
    .filter(
      (item) =>
        notesDrawerMode === "all" ||
        item.page === currentPage
    )
    .sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page;
      }

      return a.start - b.start;
    });

  savedNotesList
    .querySelectorAll(".saved-note-drawer-card")
    .forEach((card) => {
      card.remove();
    });

  emptyNotesMessage.hidden = items.length > 0;

  items.forEach((item) => {
    const card = document.createElement("article");

    card.className = "saved-note-drawer-card";
    card.dataset.highlightId = item.id;

    card.innerHTML = `
      <span class="drawer-note-page">
        Page ${item.page} · ${escapeHtml(item.sectionName)}
      </span>

      <blockquote>
        “${escapeHtml(item.text)}”
      </blockquote>

      ${
        item.note
          ? `
            <p>
              ${escapeHtml(item.note)}
            </p>
          `
          : `
            <p>
              <em>No note added.</em>
            </p>
          `
      }

      <div class="drawer-card-actions">
        <button
          type="button"
          data-edit-drawer="${item.id}"
        >
          Edit
        </button>

        <button
          type="button"
          data-delete-drawer="${item.id}"
        >
          Delete
        </button>
      </div>
    `;

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      closeNotesDrawerPanel();
      returnToHighlight(item.id);
    });

    card
      .querySelector("[data-edit-drawer]")
      .addEventListener("click", (event) => {
        event.stopPropagation();

        closeNotesDrawerPanel();
        openNoteEditorFor(item.id);
      });

    card
      .querySelector("[data-delete-drawer]")
      .addEventListener("click", (event) => {
        event.stopPropagation();

        closeNotesDrawerPanel();
        openNoteEditorFor(item.id);
        openDeleteOptions();
      });

    savedNotesList.appendChild(card);
  });
}

/* =========================================================
   RETURN TO HIGHLIGHT
   ========================================================= */

function returnToHighlight(id) {
  const highlight = getHighlight(id);

  if (!highlight) {
    return;
  }

  const afterPageChange = () => {
    requestAnimationFrame(() => {
      const mark = document.querySelector(
        `.saved-highlight[data-highlight-id="${id}"]`
      );

      if (!mark) {
        return;
      }

      mark.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      mark.classList.add("is-return-target");

      setTimeout(() => {
        mark.classList.remove("is-return-target");
      }, 1600);
    });
  };

  if (highlight.page !== currentPage) {
    showPage(highlight.page, {
      scrollToTop: false
    });

    setTimeout(afterPageChange, 80);
  } else {
    afterPageChange();
  }
}

/* =========================================================
   COUNTERS + RESUME
   ========================================================= */

function updateCounters() {
  const pageItems = highlights.filter(
    (item) => item.page === currentPage
  );

  const pageNotes = pageItems.filter((item) =>
    Boolean(item.note?.trim())
  );

  const allNotes = highlights.filter((item) =>
    Boolean(item.note?.trim())
  );

  pageHighlightCount.textContent = String(
    pageItems.length
  );

  pageNoteCount.textContent = String(
    pageNotes.length
  );

  meetingNoteCount.textContent = String(
    allNotes.length
  );
}

function updateContinueButton() {
  const state = getMeetingState();

  const hasProgress =
    Number(state.page) > 1 ||
    Number(state.scrollY) > 250 ||
    Object.values(state.audioTimes || {}).some(
      (value) => Number(value) > 2
    );

  continueMeetingButton.hidden = !hasProgress;

  if (hasProgress) {
    const page = clamp(
      Number(state.page) || 1,
      1,
      TOTAL_PAGES
    );

    continueMeetingLocation.textContent =
      `Page ${page}: ${PAGE_TITLES[page - 1]}`;
  }
}

function resumeMeeting() {
  const state = getMeetingState();

  const page = clamp(
    Number(state.page) || 1,
    1,
    TOTAL_PAGES
  );

  showPage(page, {
    scrollToTop: false,
    instant: true
  });

  requestAnimationFrame(() => {
    window.scrollTo({
      top: Number(state.scrollY) || 0,
      behavior: "smooth"
    });
  });

  showToast("Returned to where you left off.");
}

/* =========================================================
   OFFICE GUIDE
   ========================================================= */

function openGuide() {
  officeGuideOverlay.classList.add("is-open");
  officeGuideOverlay.setAttribute("aria-hidden", "false");

  setBodyLock();
}

function closeGuide() {
  officeGuideOverlay.classList.remove("is-open");
  officeGuideOverlay.setAttribute("aria-hidden", "true");

  localStorage.setItem(STORAGE.guideSeen, "true");

  setBodyLock();
}

/* =========================================================
   AUDIO
   ========================================================= */

function loadAudioForPage() {
  const state = getMeetingState();
  const source = AUDIO_SOURCES[currentPage] || "";

  meetingAudio.pause();
  meetingAudio.currentTime = 0;
  meetingAudio.src = source;

  audioPlayButton.innerHTML =
    '<span aria-hidden="true">▶</span>';

  audioProgressSlider.value = "0";
  audioTimeDisplay.textContent = "0:00 / 0:00";

  if (!source) {
    audioPlayButton.disabled = true;
    audioProgressSlider.disabled = true;
    audioBackButton.disabled = true;
    audioForwardButton.disabled = true;

    return;
  }

  audioPlayButton.disabled = false;
  audioProgressSlider.disabled = false;
  audioBackButton.disabled = false;
  audioForwardButton.disabled = false;

  meetingAudio.addEventListener(
    "loadedmetadata",
    () => {
      const savedTime =
        Number(state.audioTimes?.[currentPage]) || 0;

      meetingAudio.currentTime = Math.min(
        savedTime,
        meetingAudio.duration || 0
      );

      updateAudioUI();
    },
    {
      once: true
    }
  );
}

function updateAudioUI() {
  const duration = meetingAudio.duration || 0;
  const current = meetingAudio.currentTime || 0;

  const percent = duration
    ? (current / duration) * 100
    : 0;

  audioProgressSlider.value = String(percent);

  audioTimeDisplay.textContent =
    `${formatTime(current)} / ${formatTime(duration)}`;
}

function saveAudioTime() {
  const state = getMeetingState();

  const audioTimes = {
    ...(state.audioTimes || {}),
    [currentPage]: meetingAudio.currentTime || 0
  };

  saveMeetingState({
    audioTimes
  });
}

/* =========================================================
   RESOURCE FOLDERS
   ========================================================= */

function handleResourceFolder(button) {
  const key = button.dataset.resourceFile;

  const labels = {
    "rollout-timeline":
      "The rollout timeline folder is ready for your dates, screenshots and links.",

    "campaign-files":
      "The campaign files folder is ready for your evidence.",

    "campaign-screenshots":
      "The screenshots folder is ready for your images.",

    "campaign-notes":
      "The campaign notes folder is ready for your written observations."
  };

  showToast(
    labels[key] ||
      "This office folder is ready to be connected."
  );
}

/* =========================================================
   EVENTS
   ========================================================= */

previousMeetingPage.addEventListener("click", () => {
  if (currentPage > 1) {
    showPage(currentPage - 1);
  }
});

nextMeetingPage.addEventListener("click", () => {
  if (currentPage < TOTAL_PAGES) {
    showPage(currentPage + 1);
  }
});

pageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(Number(button.dataset.pageTarget));
  });
});

showOfficeGuide.addEventListener("click", openGuide);
closeOfficeGuide.addEventListener("click", closeGuide);
enterMeetingButton.addEventListener("click", closeGuide);

officeGuideOverlay.addEventListener("click", (event) => {
  if (event.target === officeGuideOverlay) {
    closeGuide();
  }
});

document.addEventListener("mouseup", () => {
  setTimeout(handleTextSelection, 10);
});

document.addEventListener("touchend", () => {
  setTimeout(handleTextSelection, 120);
});

cancelSelectionButton.addEventListener(
  "click",
  cancelSelection
);

confirmHighlightButton.addEventListener(
  "click",
  confirmHighlight
);

closeNoteEditor.addEventListener(
  "click",
  closeNoteEditorModal
);

saveNoteButton.addEventListener(
  "click",
  saveActiveNote
);

noteEditorText.addEventListener("input", () => {
  noteCharacterCount.textContent = String(
    noteEditorText.value.length
  );
});

noteEditorOverlay.addEventListener("click", (event) => {
  if (event.target === noteEditorOverlay) {
    closeNoteEditorModal();
  }
});

openDeleteOptionsButton.addEventListener(
  "click",
  openDeleteOptions
);

closeDeleteOptionsButton.addEventListener(
  "click",
  closeDeleteOptions
);

cancelDeleteOptionsButton.addEventListener(
  "click",
  closeDeleteOptions
);

deleteNoteOnlyButton.addEventListener(
  "click",
  deleteNoteOnly
);

deleteNoteAndHighlightButton.addEventListener(
  "click",
  deleteHighlightAndNote
);

deleteHighlightOnlyButton.addEventListener(
  "click",
  deleteHighlightAndNote
);

deleteOptionsOverlay.addEventListener(
  "click",
  (event) => {
    if (event.target === deleteOptionsOverlay) {
      closeDeleteOptions();
    }
  }
);

openMeetingNotes.addEventListener("click", () => {
  openNotesDrawer("page");
});

closeMeetingNotes.addEventListener(
  "click",
  closeNotesDrawerPanel
);

notesDrawerOverlay.addEventListener(
  "click",
  closeNotesDrawerPanel
);

showCurrentPageNotes.addEventListener("click", () => {
  notesDrawerMode = "page";
  renderNotesDrawer();
});

showAllMeetingNotes.addEventListener("click", () => {
  notesDrawerMode = "all";
  renderNotesDrawer();
});

pageHighlightsButton.addEventListener("click", () => {
  openNotesDrawer("page");
});

pageNotesButton.addEventListener("click", () => {
  openNotesDrawer("page");
});

continueMeetingButton.addEventListener(
  "click",
  resumeMeeting
);

document
  .querySelectorAll("[data-resource-file]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      handleResourceFolder(button);
    });
  });

audioPlayButton.addEventListener("click", async () => {
  if (!meetingAudio.src) {
    return;
  }

  if (meetingAudio.paused) {
    try {
      await meetingAudio.play();

      audioPlayButton.innerHTML =
        '<span aria-hidden="true">❚❚</span>';
    } catch {
      showToast("The audio file could not be played.");
    }
  } else {
    meetingAudio.pause();

    audioPlayButton.innerHTML =
      '<span aria-hidden="true">▶</span>';
  }
});

audioBackButton.addEventListener("click", () => {
  meetingAudio.currentTime = Math.max(
    0,
    meetingAudio.currentTime - 10
  );

  updateAudioUI();
});

audioForwardButton.addEventListener("click", () => {
  meetingAudio.currentTime = Math.min(
    meetingAudio.duration || 0,
    meetingAudio.currentTime + 10
  );

  updateAudioUI();
});

audioProgressSlider.addEventListener("input", () => {
  if (!meetingAudio.duration) {
    return;
  }

  meetingAudio.currentTime =
    (Number(audioProgressSlider.value) / 100) *
    meetingAudio.duration;

  updateAudioUI();
});

audioSpeedSelect.addEventListener("change", () => {
  meetingAudio.playbackRate =
    Number(audioSpeedSelect.value) || 1;
});

meetingAudio.addEventListener("timeupdate", () => {
  updateAudioUI();
  saveAudioTime();
});

meetingAudio.addEventListener("pause", () => {
  audioPlayButton.innerHTML =
    '<span aria-hidden="true">▶</span>';

  saveAudioTime();
});

meetingAudio.addEventListener("ended", () => {
  audioPlayButton.innerHTML =
    '<span aria-hidden="true">▶</span>';

  saveAudioTime();
});

window.addEventListener("scroll", () => {
  clearTimeout(scrollSaveTimer);

  scrollSaveTimer = setTimeout(() => {
    saveMeetingState();
  }, 180);
});

window.addEventListener("resize", () => {
  renderMarginNotes();
});

window.addEventListener("beforeunload", () => {
  saveMeetingState();
  saveAudioTime();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    cancelSelection();
    closeDeleteOptions();

    if (
      noteEditorOverlay.classList.contains("is-open")
    ) {
      closeNoteEditorModal();
    }

    if (
      meetingNotesDrawer.classList.contains("is-open")
    ) {
      closeNotesDrawerPanel();
    }

    if (
      officeGuideOverlay.classList.contains("is-open")
    ) {
      closeGuide();
    }
  }

  const typing = document.activeElement?.matches(
    "textarea, input, select"
  );

  if (
    !typing &&
    event.key === "ArrowLeft" &&
    currentPage > 1
  ) {
    showPage(currentPage - 1);
  }

  if (
    !typing &&
    event.key === "ArrowRight" &&
    currentPage < TOTAL_PAGES
  ) {
    showPage(currentPage + 1);
  }
});

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {
  loadHighlights();
  buildPaginationDots();

  const state = getMeetingState();

  currentPage = clamp(
    Number(state.page) || 1,
    1,
    TOTAL_PAGES
  );

  pages.forEach((page) => {
    const isActive =
      Number(page.dataset.pageNumber) === currentPage;

    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  renderAllHighlights();
  updatePageUI();
  updateContinueButton();

  if (!localStorage.getItem(STORAGE.guideSeen)) {
    openGuide();
  }

  requestAnimationFrame(() => {
    if (Number(state.scrollY) > 0) {
      window.scrollTo({
        top: Number(state.scrollY),
        behavior: "auto"
      });
    }
  });
}

initialize();
