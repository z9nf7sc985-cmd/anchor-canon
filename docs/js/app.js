/**
 * Anchor Canon - empty reader shell.
 * Loads books.json catalog only. No verse text. No fake verse search.
 */
(function () {
  "use strict";

  const SECTION_LABELS = {
    ethiopian: "Ethiopian Orthodox",
    dss: "Dead Sea Scrolls",
    coincidence: "Coincidence search",
  };

  const SECTION_HINTS = {
    ethiopian: "Broader canon stubs including 1 Enoch. Text not loaded yet.",
    dss: "Manuscript stubs only - not verse text. Empty placeholders.",
    coincidence: "Panel present; search needs locked texts later.",
  };

  const state = {
    books: [],
    section: "ethiopian",
    filter: "",
    selectedBookId: null,
    selectedChapter: null,
  };

  const els = {
    bookSearch: document.getElementById("book-search"),
    sectionTitle: document.getElementById("section-title"),
    sectionHint: document.getElementById("section-hint"),
    bookList: document.getElementById("book-list"),
    readerHome: document.getElementById("reader-home"),
    readerActive: document.getElementById("reader-active"),
    coincidencePanel: document.getElementById("coincidence-panel"),
    readerBookTitle: document.getElementById("reader-book-title"),
    readerMeta: document.getElementById("reader-meta"),
    chapterChips: document.getElementById("chapter-chips"),
    readerPane: document.getElementById("reader-pane"),
    navBtns: Array.from(document.querySelectorAll(".nav-btn")),
  };

  function showPanel(which) {
    const map = {
      home: els.readerHome,
      active: els.readerActive,
      coincidence: els.coincidencePanel,
    };
    Object.keys(map).forEach(function (key) {
      const el = map[key];
      const on = key === which;
      el.hidden = !on;
      el.classList.toggle("is-hidden", !on);
    });
  }

  function filteredBooks() {
    const q = state.filter.trim().toLowerCase();
    return state.books.filter(function (b) {
      if (b.section !== state.section) return false;
      if (!q) return true;
      return b.title.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderBookList() {
    els.sectionTitle.textContent = SECTION_LABELS[state.section] || state.section;
    els.sectionHint.textContent = SECTION_HINTS[state.section] || "";

    els.bookList.innerHTML = "";

    if (state.section === "coincidence") {
      const li = document.createElement("li");
      li.className = "book-list-empty";
      li.textContent = "No books here - open the coincidence panel on the right.";
      els.bookList.appendChild(li);
      return;
    }

    const books = filteredBooks();
    if (!books.length) {
      const li = document.createElement("li");
      li.className = "book-list-empty";
      li.textContent = state.filter
        ? "No titles match that filter."
        : "No books in this section.";
      els.bookList.appendChild(li);
      return;
    }

    books.forEach(function (book) {
      const li = document.createElement("li");
      li.className = "book-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-btn";
      if (book.id === state.selectedBookId) btn.classList.add("is-selected");
      btn.setAttribute("data-book-id", book.id);

      const title = document.createElement("span");
      title.className = "book-title";
      title.textContent = book.title;

      const meta = document.createElement("span");
      meta.className = "book-meta";
      const ch = book.chapters > 0 ? book.chapters + " ch | " : "stub | ";
      meta.textContent = ch + "status: " + (book.status || "empty");

      btn.appendChild(title);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        selectBook(book.id);
      });

      li.appendChild(btn);
      els.bookList.appendChild(li);
    });
  }

  function emptyPlaceholder() {
    const p = document.createElement("p");
    p.className = "placeholder";
    p.textContent =
      "Text not loaded yet. Public-domain source will be locked here.";
    return p;
  }

  function renderChapters(book) {
    els.chapterChips.innerHTML = "";
    const count = Number(book.chapters) || 0;

    if (count <= 0) {
      const note = document.createElement("p");
      note.className = "chip-empty-note";
      note.textContent =
        "No chapter list for this manuscript stub. Reader pane stays empty until a public-domain source is locked.";
      els.chapterChips.appendChild(note);

      els.readerPane.innerHTML = "";
      els.readerPane.appendChild(emptyPlaceholder());
      state.selectedChapter = null;
      return;
    }

    for (let i = 1; i <= count; i++) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = String(i);
      chip.setAttribute("aria-label", "Chapter " + i);
      if (i === state.selectedChapter) chip.classList.add("is-active");
      chip.addEventListener("click", function () {
        selectChapter(i);
      });
      els.chapterChips.appendChild(chip);
    }

    if (state.selectedChapter == null) {
      els.readerPane.innerHTML = "";
      const hint = document.createElement("p");
      hint.className = "placeholder";
      hint.textContent = "Select a chapter. Text is not loaded yet.";
      els.readerPane.appendChild(hint);
    } else {
      els.readerPane.innerHTML = "";
      els.readerPane.appendChild(emptyPlaceholder());
    }
  }

  function selectBook(id) {
    const book = state.books.find(function (b) {
      return b.id === id;
    });
    if (!book) return;

    state.selectedBookId = id;
    state.selectedChapter = null;

    els.readerBookTitle.textContent = book.title;
    const notes = book.notes ? " | " + book.notes : "";
    els.readerMeta.textContent =
      "status: " + (book.status || "empty") + notes;

    showPanel("active");
    renderBookList();
    renderChapters(book);

    const main = document.getElementById("main");
    if (main && window.matchMedia("(max-width: 767px)").matches) {
      main.focus({ preventScroll: false });
      main.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function selectChapter(n) {
    const book = state.books.find(function (b) {
      return b.id === state.selectedBookId;
    });
    if (!book) return;

    state.selectedChapter = n;
    renderChapters(book);
    els.readerMeta.textContent =
      "Chapter " +
      n +
      " | status: " +
      (book.status || "empty") +
      (book.notes ? " | " + book.notes : "");
  }

  function setSection(section) {
    state.section = section;
    state.selectedBookId = null;
    state.selectedChapter = null;

    els.navBtns.forEach(function (btn) {
      const on = btn.getAttribute("data-section") === section;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (section === "coincidence") {
      showPanel("coincidence");
    } else {
      showPanel("home");
    }

    renderBookList();
  }

  function bindNav() {
    els.navBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setSection(btn.getAttribute("data-section"));
      });
    });
  }

  function bindSearch() {
    els.bookSearch.addEventListener("input", function () {
      state.filter = els.bookSearch.value || "";
      renderBookList();
    });
  }

  function loadCatalog() {
    return fetch("data/books.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load books.json (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        state.books = Array.isArray(data.books) ? data.books : [];
        renderBookList();
      })
      .catch(function (err) {
        els.bookList.innerHTML = "";
        const li = document.createElement("li");
        li.className = "book-list-empty";
        li.textContent = "Failed to load catalog: " + (err && err.message ? err.message : "unknown error");
        els.bookList.appendChild(li);
      });
  }

  bindNav();
  bindSearch();
  showPanel("home");
  loadCatalog();
})();
