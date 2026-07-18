/* =========================================================
   SOURCE'S OFFICE — MEETING 001
   Rollout Review
   ========================================================= */

"use strict";

const STORAGE = {
  meeting: "sourceOffice_rollout_meeting",
  highlights: "sourceOffice_rollout_highlights",
  guideSeen: "sourceOffice_rollout_guide_seen"
};

const TOTAL_PAGES = 9;
const PAGE_TITLES = [
  "Before We Start",
  "The Timeline",
  "Where I Felt It",
  "Different Platforms",
  "Fan Fatigue",
  "The Wrong Conversation",
  "The Paid Campaign",
  "What I Saw Instead",
  "Closing the File"
];

/* Add an MP3 path for each page when narration is ready. */
const AUDIO_SOURCES = {
  1: "", 2: "", 3: "", 4: "", 5: "",
  6: "", 7: "", 8: "", 9: ""
};

let currentPage = 1;
let highlights = [];
let currentSelection = null;
let activeHighlightId = null;
let notesDrawerMode = "page";
let toastTimer = null;
let scrollSaveTimer = null;

const $ = id => document.getElementById(id);
const $$ = selector => [...document.querySelectorAll(selector)];

const pages = $$(".meeting-content-page");
const pageButtons = $$(".meeting-page-menu-item");

const previousMeetingPage = $("previousMeetingPage");
const nextMeetingPage = $("nextMeetingPage");
const previousPageName = $("previousPageName");
const nextPageName = $("nextPageName");
const meetingPaginationText = $("meetingPaginationText");
const meetingPaginationDots = $("meetingPaginationDots");
const currentPageLabel = $("currentPageLabel");
const currentPageTitle = $("currentPageTitle");
const meetingProgressFill = $("meetingProgressFill");
const meetingProgressPercent = $("meetingProgressPercent");
const continueMeetingButton = $("continueMeetingButton");
const continueMeetingLocation = $("continueMeetingLocation");
const pageHighlightCount = $("pageHighlightCount");
const pageNoteCount = $("pageNoteCount");
const meetingNoteCount = $("meetingNoteCount");

const officeGuideOverlay = $("officeGuideOverlay");
const showOfficeGuide = $("showOfficeGuide");
const closeOfficeGuide = $("closeOfficeGuide");
const enterMeetingButton = $("enterMeetingButton");

const selectionNotePreview = $("selectionNotePreview");
const selectionPreviewText = $("selectionPreviewText");
const selectionSectionName = $("selectionSectionName");
const cancelSelectionButton = $("cancelSelectionButton");
const confirmHighlightButton = $("confirmHighlightButton");

const noteEditorOverlay = $("noteEditorOverlay");
const closeNoteEditor = $("closeNoteEditor");
const noteEditorQuote = $("noteEditorQuote");
const noteEditorText = $("noteEditorText");
const noteCharacterCount = $("noteCharacterCount");
const saveNoteButton = $("saveNoteButton");
const openDeleteOptionsButton = $("openDeleteOptionsButton");

const deleteOptionsOverlay = $("deleteOptionsOverlay");
const closeDeleteOptionsButton = $("closeDeleteOptionsButton");
const cancelDeleteOptionsButton = $("cancelDeleteOptionsButton");
const deleteOptionsTitle = $("deleteOptionsTitle");
const deleteOptionsDescription = $("deleteOptionsDescription");
const deleteOptionsWithNote = $("deleteOptionsWithNote");
const deleteOptionsHighlightOnly = $("deleteOptionsHighlightOnly");
const deleteNoteOnlyButton = $("deleteNoteOnlyButton");
const deleteNoteAndHighlightButton = $("deleteNoteAndHighlightButton");
const deleteHighlightOnlyButton = $("deleteHighlightOnlyButton");

const meetingNotesDrawer = $("meetingNotesDrawer");
const notesDrawerOverlay = $("notesDrawerOverlay");
const openMeetingNotes = $("openMeetingNotes");
const closeMeetingNotes = $("closeMeetingNotes");
const showCurrentPageNotes = $("showCurrentPageNotes");
const showAllMeetingNotes = $("showAllMeetingNotes");
const savedNotesList = $("savedNotesList");
const emptyNotesMessage = $("emptyNotesMessage");
const pageHighlightsButton = $("pageHighlightsButton");
const pageNotesButton = $("pageNotesButton");

const meetingAudio = $("meetingAudio");
const audioPlayButton = $("audioPlayButton");
const audioPageTitle = $("audioPageTitle");
const audioTimeDisplay = $("audioTimeDisplay");
const audioProgressSlider = $("audioProgressSlider");
const audioBackButton = $("audioBackButton");
const audioForwardButton = $("audioForwardButton");
const audioSpeedSelect = $("audioSpeedSelect");
const meetingToast = $("meetingToast");

function makeId() {
  return `hl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function setBodyLock() {
  const locked =
    officeGuideOverlay?.classList.contains("is-open") ||
    noteEditorOverlay?.classList.contains("is-open") ||
    deleteOptionsOverlay?.classList.contains("is-open") ||
    meetingNotesDrawer?.classList.contains("is-open");
  document.body.classList.toggle("is-locked", Boolean(locked));
}

function showToast(message) {
  if (!meetingToast) return;
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
  if (!storageAvailable()) return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE.meeting)) || {};
  } catch {
    return {};
  }
}

function saveMeetingState(extra = {}) {
  if (!storageAvailable()) return;
  const oldState = getMeetingState();
  localStorage.setItem(STORAGE.meeting, JSON.stringify({
    ...oldState,
    page: currentPage,
    scrollY: window.scrollY,
    audioTimes: oldState.audioTimes || {},
    ...extra
  }));
}

function loadHighlights() {
  if (!storageAvailable()) { highlights = []; return; }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE.highlights));
    highlights = Array.isArray(stored) ? stored : [];
  } catch {
    highlights = [];
  }
}

function saveHighlights() {
  if (!storageAvailable()) return;
  localStorage.setItem(STORAGE.highlights, JSON.stringify(highlights));
}

function getHighlight(id) {
  return highlights.find(item => item.id === id) || null;
}

function getPageRoot(pageNumber) {
  return $(`meetingPage${pageNumber}`);
}

function getReadableRoot(pageNumber) {
  return document.querySelector(`[data-page-reading-area="${pageNumber}"]`);
}

function getSectionName(node) {
  const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  return element?.closest("[data-section-name]")?.dataset.sectionName || PAGE_TITLES[currentPage - 1];
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
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.nodeValue.length;
    if (characterOffset <= consumed + length) {
      return { node, offset: clamp(characterOffset - consumed, 0, length) };
    }
    consumed += length;
  }
  return null;
}

function createRangeFromOffsets(root, start, end) {
  const startPosition = locateTextPosition(root, start);
  const endPosition = locateTextPosition(root, end);
  if (!startPosition || !endPosition) return null;
  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);
  return range;
}

function clearNativeSelection() {
  window.getSelection()?.removeAllRanges();
}

function buildPaginationDots() {
  if (!meetingPaginationDots) return;
  meetingPaginationDots.innerHTML = "";
  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Go to page ${page}`);
    button.addEventListener("click", () => showPage(page));
    meetingPaginationDots.appendChild(button);
  }
}

function updatePageUI() {
  const title = PAGE_TITLES[currentPage - 1];
  if (currentPageLabel) currentPageLabel.textContent = `Meeting 001 · Page ${currentPage} of ${TOTAL_PAGES}`;
  if (currentPageTitle) currentPageTitle.textContent = title;
  if (meetingPaginationText) meetingPaginationText.textContent = `Page ${currentPage} of ${TOTAL_PAGES}`;
  if (audioPageTitle) audioPageTitle.textContent = title;

  if (previousMeetingPage) previousMeetingPage.disabled = currentPage === 1;
  if (nextMeetingPage) nextMeetingPage.disabled = currentPage === TOTAL_PAGES;
  if (previousPageName) previousPageName.textContent = currentPage === 1 ? "Lobby" : PAGE_TITLES[currentPage - 2];
  if (nextPageName) nextPageName.textContent = currentPage === TOTAL_PAGES ? "Complete" : PAGE_TITLES[currentPage];

  pageButtons.forEach(button => {
    button.classList.toggle("active", Number(button.dataset.pageTarget) === currentPage);
  });

  if (meetingPaginationDots) {
    [...meetingPaginationDots.children].forEach((dot, index) => {
      dot.classList.toggle("active", index + 1 === currentPage);
    });
  }

  const percent = Math.round((currentPage / TOTAL_PAGES) * 100);
  if (meetingProgressFill) meetingProgressFill.style.width = `${percent}%`;
  if (meetingProgressPercent) meetingProgressPercent.textContent = `${percent}%`;

  updateCounters();
  renderMarginNotes();
  renderNotesDrawer();
  loadAudioForPage();
}

function showPage(pageNumber, options = {}) {
  currentPage = clamp(Number(pageNumber) || 1, 1, TOTAL_PAGES);
  pages.forEach(page => {
    const isActive = Number(page.dataset.pageNumber) === currentPage;
    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });
  updatePageUI();
  saveMeetingState();
  if (options.scrollToTop !== false) {
    window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
  }
}

function handleTextSelection() {
  if (
    noteEditorOverlay?.classList.contains("is-open") ||
    deleteOptionsOverlay?.classList.contains("is-open") ||
    meetingNotesDrawer?.classList.contains("is-open")
  ) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text.length < 2) return;

  const range = selection.getRangeAt(0);
  const readingRoot = getReadableRoot(currentPage);
  if (!readingRoot || !readingRoot.contains(range.commonAncestorContainer)) return;

  const startElement = range.startContainer.parentElement;
  const endElement = range.endContainer.parentElement;
  if (startElement?.closest(".saved-highlight") || endElement?.closest(".saved-highlight")) return;

  const start = getCharacterOffset(readingRoot, range.startContainer, range.startOffset);
  const end = getCharacterOffset(readingRoot, range.endContainer, range.endOffset);
  if (end <= start) return;

  currentSelection = {
    page: currentPage,
    text,
    start,
    end,
    sectionName: getSectionName(range.commonAncestorContainer)
  };

  if (selectionPreviewText) selectionPreviewText.textContent = text;
  if (selectionSectionName) selectionSectionName.textContent = currentSelection.sectionName;
  selectionNotePreview?.classList.add("is-open");
  selectionNotePreview?.setAttribute("aria-hidden", "false");
  scheduleSelectionPreviewPosition();
}

function cancelSelection() {
  currentSelection = null;
  selectionNotePreview?.classList.remove("is-open");
  selectionNotePreview?.setAttribute("aria-hidden", "true");
  clearNativeSelection();
}

function confirmHighlight() {
  if (!currentSelection) return;
  const overlaps = highlights.some(item =>
    item.page === currentSelection.page &&
    currentSelection.start < item.end &&
    currentSelection.end > item.start
  );

  if (overlaps) {
    showToast("That selection overlaps an existing highlight.");
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
}

function unwrapRenderedHighlights() {
  $$(".saved-highlight").forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function applyHighlight(highlight) {
  const root = getReadableRoot(highlight.page);
  if (!root) return;
  const range = createRangeFromOffsets(root, highlight.start, highlight.end);
  if (!range || range.collapsed) return;

  const mark = document.createElement("mark");
  mark.className = "saved-highlight";
  mark.dataset.highlightId = highlight.id;
  mark.title = highlight.note ? "Open note" : "Add a note";

  try {
    range.surroundContents(mark);
  } catch {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }

  mark.addEventListener("click", event => {
    event.stopPropagation();
    openNoteEditorFor(highlight.id);
  });
}

function renderAllHighlights() {
  unwrapRenderedHighlights();
  [...highlights]
    .sort((a, b) => a.page === b.page ? b.start - a.start : a.page - b.page)
    .forEach(applyHighlight);
  renderMarginNotes();
  renderNotesDrawer();
  updateCounters();
}

function openNoteEditorFor(id, newHighlight = false) {
  rememberFocus();
  const highlight = getHighlight(id);
  if (!highlight) return;
  activeHighlightId = id;
  if (noteEditorQuote) noteEditorQuote.textContent = highlight.text;
  if (noteEditorText) noteEditorText.value = highlight.note || "";
  if (noteCharacterCount) noteCharacterCount.textContent = String(noteEditorText?.value.length || 0);
  if (openDeleteOptionsButton) openDeleteOptionsButton.hidden = newHighlight;
  if (saveNoteButton) saveNoteButton.textContent = highlight.note ? "Save Changes" : "Save";
  noteEditorOverlay?.classList.add("is-open");
  noteEditorOverlay?.setAttribute("aria-hidden", "false");
  setBodyLock();
  syncNoteLimitUI();
  setTimeout(() => noteEditorText?.focus(), 80);
}

function closeNoteEditorModal() {
  activeHighlightId = null;
  noteEditorOverlay?.classList.remove("is-open");
  noteEditorOverlay?.setAttribute("aria-hidden", "true");
  setBodyLock();
  restoreFocus();
}

function saveActiveNote() {
  const highlight = getHighlight(activeHighlightId);
  if (!highlight) return;
  highlight.note = (noteEditorText?.value.trim() || "").slice(0, MAX_NOTE_LENGTH);
  highlight.updatedAt = Date.now();
  saveHighlights();
  renderAllHighlights();
  closeNoteEditorModal();
  showToast(highlight.note ? "Note saved." : "Highlight saved.");
  announce(highlight.note ? "Note saved." : "Highlight saved.");
}

function openDeleteOptions() {
  const highlight = getHighlight(activeHighlightId);
  if (!highlight) return;
  const hasNote = Boolean(highlight.note?.trim());
  if (deleteOptionsWithNote) deleteOptionsWithNote.hidden = !hasNote;
  if (deleteOptionsHighlightOnly) deleteOptionsHighlightOnly.hidden = hasNote;

  if (hasNote) {
    if (deleteOptionsTitle) deleteOptionsTitle.textContent = "What would you like to delete?";
    if (deleteOptionsDescription) deleteOptionsDescription.textContent =
      "You can remove only your note or remove the note and highlight together.";
  } else {
    if (deleteOptionsTitle) deleteOptionsTitle.textContent = "Delete this highlight?";
    if (deleteOptionsDescription) deleteOptionsDescription.textContent =
      "This highlight does not have a written note attached.";
  }

  deleteOptionsOverlay?.classList.add("is-open");
  deleteOptionsOverlay?.setAttribute("aria-hidden", "false");
  setBodyLock();
}

function closeDeleteOptions() {
  deleteOptionsOverlay?.classList.remove("is-open");
  deleteOptionsOverlay?.setAttribute("aria-hidden", "true");
  setBodyLock();
}

function deleteNoteOnly() {
  const highlight = getHighlight(activeHighlightId);
  if (!highlight) return;
  highlight.note = "";
  highlight.updatedAt = Date.now();
  saveHighlights();
  closeDeleteOptions();
  closeNoteEditorModal();
  renderAllHighlights();
  showToast("Note deleted. Highlight kept.");
}

function deleteHighlightAndNote() {
  if (!activeHighlightId) return;
  highlights = highlights.filter(item => item.id !== activeHighlightId);
  saveHighlights();
  closeDeleteOptions();
  closeNoteEditorModal();
  renderAllHighlights();
  showToast("Highlight deleted.");
}

function renderMarginNotes() {
  $$('[data-page-note-margin]').forEach(margin => { margin.innerHTML = ""; });
  const margin = document.querySelector(`[data-page-note-margin="${currentPage}"]`);
  const pageRoot = getPageRoot(currentPage);
  if (!margin || !pageRoot) return;

  const items = highlights
    .filter(item => item.page === currentPage)
    .sort((a, b) => a.start - b.start);

  items.forEach((item, index) => {
    const mark = document.querySelector(`.saved-highlight[data-highlight-id="${item.id}"]`);
    const card = document.createElement("article");
    card.className = "margin-note-card";
    card.dataset.highlightId = item.id;

    const top = mark
      ? mark.getBoundingClientRect().top - pageRoot.getBoundingClientRect().top
      : index * 150;
    card.style.top = `${Math.max(0, top - 10)}px`;

    card.innerHTML = `
      <p class="margin-note-quote">“${escapeHtml(item.text)}”</p>
      ${item.note
        ? `<p class="margin-note-text">${escapeHtml(item.note)}</p>`
        : `<p class="margin-note-empty">Highlight saved. No note added.</p>`}
      <div class="margin-note-actions">
        <button type="button" data-edit-highlight="${item.id}">Edit</button>
        <button type="button" data-delete-highlight="${item.id}">Delete</button>
      </div>`;

    card.addEventListener("click", event => {
      if (!event.target.closest("button")) returnToHighlight(item.id);
    });
    card.querySelector("[data-edit-highlight]")?.addEventListener("click", () => openNoteEditorFor(item.id));
    card.querySelector("[data-delete-highlight]")?.addEventListener("click", () => {
      activeHighlightId = item.id;
      openNoteEditorFor(item.id);
      openDeleteOptions();
    });
    margin.appendChild(card);
  });

  preventMarginNoteOverlap(margin);
}

function preventMarginNoteOverlap(margin) {
  const cards = [...margin.querySelectorAll(".margin-note-card")];
  let nextTop = 0;
  cards.forEach(card => {
    const requested = Number.parseFloat(card.style.top) || 0;
    const finalTop = Math.max(requested, nextTop);
    card.style.top = `${finalTop}px`;
    nextTop = finalTop + card.offsetHeight + 18;
  });
  if (cards.length) margin.style.minHeight = `${nextTop}px`;
}

function openNotesDrawer(mode = "page") {
  notesDrawerMode = mode;
  meetingNotesDrawer?.classList.add("is-open");
  meetingNotesDrawer?.setAttribute("aria-hidden", "false");
  notesDrawerOverlay?.classList.add("is-open");
  notesDrawerOverlay?.setAttribute("aria-hidden", "false");
  openMeetingNotes?.setAttribute("aria-expanded", "true");
  renderNotesDrawer();
  setBodyLock();
}

function closeNotesDrawerPanel() {
  meetingNotesDrawer?.classList.remove("is-open");
  meetingNotesDrawer?.setAttribute("aria-hidden", "true");
  notesDrawerOverlay?.classList.remove("is-open");
  notesDrawerOverlay?.setAttribute("aria-hidden", "true");
  openMeetingNotes?.setAttribute("aria-expanded", "false");
  setBodyLock();
}

function renderNotesDrawer() {
  if (!savedNotesList) return;
  showCurrentPageNotes?.classList.toggle("active", notesDrawerMode === "page");
  showAllMeetingNotes?.classList.toggle("active", notesDrawerMode === "all");

  const items = highlights
    .filter(item => notesDrawerMode === "all" || item.page === currentPage)
    .sort((a, b) => a.page === b.page ? a.start - b.start : a.page - b.page);

  savedNotesList.querySelectorAll(".saved-note-drawer-card").forEach(card => card.remove());
  if (emptyNotesMessage) emptyNotesMessage.hidden = items.length > 0;

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "saved-note-drawer-card";
    card.dataset.highlightId = item.id;
    card.innerHTML = `
      <span class="drawer-note-page">Page ${item.page} · ${escapeHtml(item.sectionName)}</span>
      <blockquote>“${escapeHtml(item.text)}”</blockquote>
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : `<p><em>No note added.</em></p>`}
      <div class="drawer-card-actions">
        <button type="button" data-edit-drawer="${item.id}">Edit</button>
        <button type="button" data-delete-drawer="${item.id}">Delete</button>
      </div>`;

    card.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      closeNotesDrawerPanel();
      returnToHighlight(item.id);
    });
    card.querySelector("[data-edit-drawer]")?.addEventListener("click", event => {
      event.stopPropagation();
      closeNotesDrawerPanel();
      openNoteEditorFor(item.id);
    });
    card.querySelector("[data-delete-drawer]")?.addEventListener("click", event => {
      event.stopPropagation();
      closeNotesDrawerPanel();
      openNoteEditorFor(item.id);
      openDeleteOptions();
    });
    savedNotesList.appendChild(card);
  });
}

function returnToHighlight(id) {
  const highlight = getHighlight(id);
  if (!highlight) return;

  const scrollToMark = () => requestAnimationFrame(() => {
    const mark = document.querySelector(`.saved-highlight[data-highlight-id="${id}"]`);
    if (!mark) return;
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
    mark.classList.add("is-return-target");
    setTimeout(() => mark.classList.remove("is-return-target"), 1600);
  });

  if (highlight.page !== currentPage) {
    showPage(highlight.page, { scrollToTop: false });
    setTimeout(scrollToMark, 80);
  } else {
    scrollToMark();
  }
}

function updateCounters() {
  const pageItems = highlights.filter(item => item.page === currentPage);
  const pageNotes = pageItems.filter(item => Boolean(item.note?.trim()));
  const allNotes = highlights.filter(item => Boolean(item.note?.trim()));
  if (pageHighlightCount) pageHighlightCount.textContent = String(pageItems.length);
  if (pageNoteCount) pageNoteCount.textContent = String(pageNotes.length);
  if (meetingNoteCount) meetingNoteCount.textContent = String(allNotes.length);
}

function updateContinueButton() {
  if (!continueMeetingButton) return;
  const state = getMeetingState();
  const hasProgress =
    Number(state.page) > 1 ||
    Number(state.scrollY) > 250 ||
    Object.values(state.audioTimes || {}).some(value => Number(value) > 2);
  continueMeetingButton.hidden = !hasProgress;
  if (hasProgress && continueMeetingLocation) {
    const page = clamp(Number(state.page) || 1, 1, TOTAL_PAGES);
    continueMeetingLocation.textContent = `Page ${page}: ${PAGE_TITLES[page - 1]}`;
  }
}

function resumeMeeting() {
  const state = getMeetingState();
  const page = clamp(Number(state.page) || 1, 1, TOTAL_PAGES);
  showPage(page, { scrollToTop: false, instant: true });
  requestAnimationFrame(() => {
    window.scrollTo({ top: Number(state.scrollY) || 0, behavior: "smooth" });
  });
  showToast("Returned to where you left off.");
}

function openGuide() {
  officeGuideOverlay?.classList.add("is-open");
  officeGuideOverlay?.setAttribute("aria-hidden", "false");
  setBodyLock();
}

function closeGuideModal() {
  officeGuideOverlay?.classList.remove("is-open");
  officeGuideOverlay?.setAttribute("aria-hidden", "true");
  localStorage.setItem(STORAGE.guideSeen, "true");
  setBodyLock();
}

function loadAudioForPage() {
  if (!meetingAudio) return;
  const state = getMeetingState();
  const source = AUDIO_SOURCES[currentPage] || "";
  meetingAudio.pause();
  meetingAudio.currentTime = 0;
  meetingAudio.src = source;
  if (audioPlayButton) audioPlayButton.innerHTML = '<span aria-hidden="true">▶</span>';
  if (audioProgressSlider) audioProgressSlider.value = "0";
  if (audioTimeDisplay) audioTimeDisplay.textContent = "0:00 / 0:00";

  const disabled = !source;
  [audioPlayButton, audioProgressSlider, audioBackButton, audioForwardButton]
    .forEach(control => { if (control) control.disabled = disabled; });
  if (!source) return;

  meetingAudio.addEventListener("loadedmetadata", () => {
    const saved = Number(state.audioTimes?.[currentPage]) || 0;
    meetingAudio.currentTime = Math.min(saved, meetingAudio.duration || 0);
    updateAudioUI();
  }, { once: true });
}

function updateAudioUI() {
  if (!meetingAudio) return;
  const duration = meetingAudio.duration || 0;
  const current = meetingAudio.currentTime || 0;
  if (audioProgressSlider) audioProgressSlider.value = String(duration ? (current / duration) * 100 : 0);
  if (audioTimeDisplay) audioTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function saveAudioTime() {
  if (!meetingAudio) return;
  const state = getMeetingState();
  saveMeetingState({
    audioTimes: {
      ...(state.audioTimes || {}),
      [currentPage]: meetingAudio.currentTime || 0
    }
  });
}

function handleResourceFolder(button) {
  const labels = {
    "rollout-timeline": "The rollout timeline folder is ready for your dates, screenshots and links.",
    "campaign-files": "The campaign files folder is ready for your evidence.",
    "campaign-screenshots": "The screenshots folder is ready for your images.",
    "campaign-notes": "The campaign notes folder is ready for your written observations."
  };
  showToast(labels[button.dataset.resourceFile] || "This office folder is ready to be connected.");
}

previousMeetingPage?.addEventListener("click", () => {
  if (currentPage > 1) showPage(currentPage - 1);
});
nextMeetingPage?.addEventListener("click", () => {
  if (currentPage < TOTAL_PAGES) showPage(currentPage + 1);
});
pageButtons.forEach(button => button.addEventListener("click", () => showPage(Number(button.dataset.pageTarget))));

showOfficeGuide?.addEventListener("click", openGuide);
closeOfficeGuide?.addEventListener("click", closeGuideModal);
enterMeetingButton?.addEventListener("click", closeGuideModal);
officeGuideOverlay?.addEventListener("click", event => {
  if (event.target === officeGuideOverlay) closeGuideModal();
});

document.addEventListener("mouseup", () => setTimeout(handleTextSelection, 10));
document.addEventListener("touchend", () => setTimeout(handleTextSelection, 120));
cancelSelectionButton?.addEventListener("click", cancelSelection);
confirmHighlightButton?.addEventListener("click", confirmHighlight);

closeNoteEditor?.addEventListener("click", closeNoteEditorModal);
saveNoteButton?.addEventListener("click", saveActiveNote);
noteEditorText?.addEventListener("input", syncNoteLimitUI);
noteEditorOverlay?.addEventListener("click", event => {
  if (event.target === noteEditorOverlay) closeNoteEditorModal();
});

openDeleteOptionsButton?.addEventListener("click", openDeleteOptions);
closeDeleteOptionsButton?.addEventListener("click", closeDeleteOptions);
cancelDeleteOptionsButton?.addEventListener("click", closeDeleteOptions);
deleteNoteOnlyButton?.addEventListener("click", deleteNoteOnly);
deleteNoteAndHighlightButton?.addEventListener("click", deleteHighlightAndNote);
deleteHighlightOnlyButton?.addEventListener("click", deleteHighlightAndNote);
deleteOptionsOverlay?.addEventListener("click", event => {
  if (event.target === deleteOptionsOverlay) closeDeleteOptions();
});

openMeetingNotes?.addEventListener("click", () => openNotesDrawer("page"));
closeMeetingNotes?.addEventListener("click", closeNotesDrawerPanel);
notesDrawerOverlay?.addEventListener("click", closeNotesDrawerPanel);
showCurrentPageNotes?.addEventListener("click", () => {
  notesDrawerMode = "page";
  renderNotesDrawer();
});
showAllMeetingNotes?.addEventListener("click", () => {
  notesDrawerMode = "all";
  renderNotesDrawer();
});
pageHighlightsButton?.addEventListener("click", () => openNotesDrawer("page"));
pageNotesButton?.addEventListener("click", () => openNotesDrawer("page"));
continueMeetingButton?.addEventListener("click", resumeMeeting);

$$('[data-resource-file]').forEach(button => {
  button.addEventListener("click", () => handleResourceFolder(button));
});

audioPlayButton?.addEventListener("click", async () => {
  if (!meetingAudio?.src) return;
  if (meetingAudio.paused) {
    try {
      await meetingAudio.play();
      audioPlayButton.innerHTML = '<span aria-hidden="true">❚❚</span>';
    } catch {
      showToast("The audio file could not be played.");
    }
  } else {
    meetingAudio.pause();
  }
});
audioBackButton?.addEventListener("click", () => {
  meetingAudio.currentTime = Math.max(0, meetingAudio.currentTime - 10);
  updateAudioUI();
});
audioForwardButton?.addEventListener("click", () => {
  meetingAudio.currentTime = Math.min(meetingAudio.duration || 0, meetingAudio.currentTime + 10);
  updateAudioUI();
});
audioProgressSlider?.addEventListener("input", () => {
  if (!meetingAudio.duration) return;
  meetingAudio.currentTime = (Number(audioProgressSlider.value) / 100) * meetingAudio.duration;
  updateAudioUI();
});
audioSpeedSelect?.addEventListener("change", () => {
  meetingAudio.playbackRate = Number(audioSpeedSelect.value) || 1;
});
meetingAudio?.addEventListener("timeupdate", () => {
  updateAudioUI();
  saveAudioTime();
});
meetingAudio?.addEventListener("pause", () => {
  if (audioPlayButton) audioPlayButton.innerHTML = '<span aria-hidden="true">▶</span>';
  saveAudioTime();
});
meetingAudio?.addEventListener("ended", () => {
  if (audioPlayButton) audioPlayButton.innerHTML = '<span aria-hidden="true">▶</span>';
  saveAudioTime();
});

window.addEventListener("scroll", () => {
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(saveMeetingState, 180);
});
window.addEventListener("resize", renderMarginNotes);
window.addEventListener("beforeunload", () => {
  saveMeetingState();
  saveAudioTime();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    cancelSelection();
    closeDeleteOptions();
    if (noteEditorOverlay?.classList.contains("is-open")) closeNoteEditorModal();
    if (meetingNotesDrawer?.classList.contains("is-open")) closeNotesDrawerPanel();
    if (officeGuideOverlay?.classList.contains("is-open")) closeGuideModal();
  }

  const typing = document.activeElement?.matches("textarea, input, select");
  if (!typing && event.key === "ArrowLeft" && currentPage > 1) showPage(currentPage - 1);
  if (!typing && event.key === "ArrowRight" && currentPage < TOTAL_PAGES) showPage(currentPage + 1);
});


/* =========================================================
   RELIABILITY + ACCESSIBILITY ENHANCEMENTS
   These helpers make the meeting resilient across refreshes,
   mobile selection, resized layouts, and malformed saved data.
   ========================================================= */

const MAX_NOTE_LENGTH = 1200;
let lastFocusedElement = null;
let selectionPreviewRaf = null;

function storageAvailable() {
  try {
    const key = "__sourceOfficeStorageTest__";
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeHighlightRecord(item) {
  if (!item || typeof item !== "object") return null;
  const page = clamp(Number(item.page) || 1, 1, TOTAL_PAGES);
  const start = Math.max(0, Number(item.start) || 0);
  const end = Math.max(start, Number(item.end) || start);
  const text = String(item.text || "").trim();
  if (!item.id || !text || end <= start) return null;
  return {
    id: String(item.id),
    page,
    text,
    start,
    end,
    sectionName: String(item.sectionName || PAGE_TITLES[page - 1]),
    note: String(item.note || "").slice(0, MAX_NOTE_LENGTH),
    createdAt: Number(item.createdAt) || Date.now(),
    updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now()
  };
}

function sanitizeStoredHighlights() {
  const clean = highlights.map(normalizeHighlightRecord).filter(Boolean);
  const seen = new Set();
  highlights = clean.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  saveHighlights();
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(element => !element.hidden && element.offsetParent !== null);
}

function rememberFocus() {
  lastFocusedElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

function restoreFocus() {
  if (lastFocusedElement?.isConnected) lastFocusedElement.focus();
  lastFocusedElement = null;
}

function trapModalFocus(event, container) {
  if (event.key !== "Tab") return;
  const focusable = getFocusableElements(container);
  if (!focusable.length) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function positionSelectionPreview() {
  if (!selectionNotePreview?.classList.contains("is-open")) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (!rect.width && !rect.height) return;

  selectionNotePreview.style.position = "fixed";
  selectionNotePreview.style.zIndex = "1000";
  selectionNotePreview.style.visibility = "hidden";

  const previewRect = selectionNotePreview.getBoundingClientRect();
  const gap = 12;
  const margin = 12;
  let left = rect.left + rect.width / 2 - previewRect.width / 2;
  left = clamp(left, margin, window.innerWidth - previewRect.width - margin);
  let top = rect.bottom + gap;
  if (top + previewRect.height > window.innerHeight - margin) {
    top = rect.top - previewRect.height - gap;
  }
  top = clamp(top, margin, window.innerHeight - previewRect.height - margin);

  selectionNotePreview.style.left = `${Math.round(left)}px`;
  selectionNotePreview.style.top = `${Math.round(top)}px`;
  selectionNotePreview.style.visibility = "visible";
}

function scheduleSelectionPreviewPosition() {
  cancelAnimationFrame(selectionPreviewRaf);
  selectionPreviewRaf = requestAnimationFrame(positionSelectionPreview);
}

function closeAllTransientUI() {
  cancelSelection();
  closeDeleteOptions();
  if (noteEditorOverlay?.classList.contains("is-open")) closeNoteEditorModal();
  if (meetingNotesDrawer?.classList.contains("is-open")) closeNotesDrawerPanel();
  if (officeGuideOverlay?.classList.contains("is-open")) closeGuideModal();
}

function validateHighlightAgainstPage(highlight) {
  const root = getReadableRoot(highlight.page);
  if (!root) return false;
  const fullText = root.textContent || "";
  if (highlight.end > fullText.length) return false;
  const storedSlice = fullText.slice(highlight.start, highlight.end).replace(/\s+/g, " ").trim();
  return storedSlice === highlight.text.replace(/\s+/g, " ").trim();
}

function repairHighlightOffsets(highlight) {
  const root = getReadableRoot(highlight.page);
  if (!root) return false;
  const fullText = root.textContent || "";
  const exact = fullText.indexOf(highlight.text);
  if (exact >= 0) {
    highlight.start = exact;
    highlight.end = exact + highlight.text.length;
    highlight.updatedAt = Date.now();
    return true;
  }

  const normalizedNeedle = highlight.text.replace(/\s+/g, " ").trim();
  const normalizedText = fullText.replace(/\s+/g, " ");
  const normalizedIndex = normalizedText.indexOf(normalizedNeedle);
  if (normalizedIndex < 0) return false;

  let rawIndex = 0;
  let normalizedCursor = 0;
  while (rawIndex < fullText.length && normalizedCursor < normalizedIndex) {
    if (/\s/.test(fullText[rawIndex])) {
      while (rawIndex < fullText.length && /\s/.test(fullText[rawIndex])) rawIndex += 1;
      normalizedCursor += 1;
    } else {
      rawIndex += 1;
      normalizedCursor += 1;
    }
  }
  highlight.start = rawIndex;
  highlight.end = rawIndex + highlight.text.length;
  highlight.updatedAt = Date.now();
  return true;
}

function repairStoredHighlights() {
  let changed = false;
  highlights.forEach(item => {
    if (!validateHighlightAgainstPage(item) && repairHighlightOffsets(item)) changed = true;
  });
  if (changed) saveHighlights();
}

function announce(message) {
  let region = document.getElementById("sourceOfficeLiveRegion");
  if (!region) {
    region = document.createElement("div");
    region.id = "sourceOfficeLiveRegion";
    region.className = "sr-only";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.appendChild(region);
  }
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}

function enhanceDialogSemantics() {
  [officeGuideOverlay, noteEditorOverlay, deleteOptionsOverlay].forEach(overlay => {
    if (!overlay) return;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
  });
  meetingNotesDrawer?.setAttribute("role", "dialog");
  meetingNotesDrawer?.setAttribute("aria-modal", "true");
}

function syncNoteLimitUI() {
  if (!noteEditorText) return;
  noteEditorText.maxLength = MAX_NOTE_LENGTH;
  const length = noteEditorText.value.length;
  if (noteCharacterCount) noteCharacterCount.textContent = `${length} / ${MAX_NOTE_LENGTH}`;
}

function installDelegatedHighlightActions() {
  document.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-highlight], [data-edit-drawer]");
    const remove = event.target.closest("[data-delete-highlight], [data-delete-drawer]");
    if (edit) {
      const id = edit.dataset.editHighlight || edit.dataset.editDrawer;
      if (id) openNoteEditorFor(id);
    }
    if (remove) {
      const id = remove.dataset.deleteHighlight || remove.dataset.deleteDrawer;
      if (!id) return;
      activeHighlightId = id;
      openNoteEditorFor(id);
      openDeleteOptions();
    }
  });
}

function installAccessibilityHandlers() {
  document.addEventListener("keydown", event => {
    if (noteEditorOverlay?.classList.contains("is-open")) trapModalFocus(event, noteEditorOverlay);
    else if (deleteOptionsOverlay?.classList.contains("is-open")) trapModalFocus(event, deleteOptionsOverlay);
    else if (officeGuideOverlay?.classList.contains("is-open")) trapModalFocus(event, officeGuideOverlay);
    else if (meetingNotesDrawer?.classList.contains("is-open")) trapModalFocus(event, meetingNotesDrawer);
  });
}

function installSelectionPositionHandlers() {
  window.addEventListener("resize", scheduleSelectionPreviewPosition);
  window.addEventListener("scroll", () => {
    if (selectionNotePreview?.classList.contains("is-open")) scheduleSelectionPreviewPosition();
  }, { passive: true });
  document.addEventListener("selectionchange", () => {
    if (selectionNotePreview?.classList.contains("is-open")) scheduleSelectionPreviewPosition();
  });
}

function installOnlineStatusHandlers() {
  window.addEventListener("offline", () => showToast("You are offline. Saved notes still work on this device."));
  window.addEventListener("online", () => showToast("You are back online."));
}

function installPrintHandlers() {
  window.addEventListener("beforeprint", () => {
    pages.forEach(page => { page.hidden = false; });
  });
  window.addEventListener("afterprint", () => {
    pages.forEach(page => {
      const active = Number(page.dataset.pageNumber) === currentPage;
      page.hidden = !active;
    });
  });
}

function installStateSync() {
  window.addEventListener("storage", event => {
    if (event.key === STORAGE.highlights) {
      loadHighlights();
      sanitizeStoredHighlights();
      repairStoredHighlights();
      renderAllHighlights();
      announce("Highlights updated in another tab.");
    }
    if (event.key === STORAGE.meeting) updateContinueButton();
  });
}

function installErrorBoundary() {
  window.addEventListener("error", event => {
    console.error("Source's Office error:", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", event => {
    console.error("Source's Office promise error:", event.reason);
  });
}

function initialize() {
  enhanceDialogSemantics();
  installDelegatedHighlightActions();
  installAccessibilityHandlers();
  installSelectionPositionHandlers();
  installOnlineStatusHandlers();
  installPrintHandlers();
  installStateSync();
  installErrorBoundary();

  loadHighlights();
  sanitizeStoredHighlights();
  repairStoredHighlights();
  buildPaginationDots();
  const state = getMeetingState();
  currentPage = clamp(Number(state.page) || 1, 1, TOTAL_PAGES);

  pages.forEach(page => {
    const active = Number(page.dataset.pageNumber) === currentPage;
    page.hidden = !active;
    page.classList.toggle("active", active);
  });

  renderAllHighlights();
  updatePageUI();
  updateContinueButton();

  if (!localStorage.getItem(STORAGE.guideSeen)) openGuide();

  requestAnimationFrame(() => {
    if (Number(state.scrollY) > 0) {
      window.scrollTo({ top: Number(state.scrollY), behavior: "auto" });
    }
  });
}

initialize();

